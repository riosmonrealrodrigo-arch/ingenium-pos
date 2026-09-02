-- =====================================================
-- INGENIUM POS — Supabase Database Schema
-- Ejecuta este SQL en: Supabase → SQL Editor → New query
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: businesses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'Q',
  tax_rate    NUMERIC(5,2) NOT NULL DEFAULT 12,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: profiles (extiende auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'cajero' CHECK (role IN ('admin','cajero','supervisor')),
  avatar_url  TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: products
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code           TEXT NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  category_id    UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price     NUMERIC(10,2) NOT NULL,
  stock          INTEGER NOT NULL DEFAULT 0,
  min_stock      INTEGER NOT NULL DEFAULT 5,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: clients
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: sales
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id),
  user_name      TEXT NOT NULL,
  client_id      UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name    TEXT,
  items          JSONB NOT NULL DEFAULT '[]',
  subtotal       NUMERIC(10,2) NOT NULL,
  discount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  cash_given     NUMERIC(10,2),
  change         NUMERIC(10,2),
  status         TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','cancelled','pending')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: stock_movements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('entrada','salida','ajuste','venta')),
  quantity     INTEGER NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FUNCIÓN: Decrementar stock (llamada desde el app)
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - amount)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Auto-crear profile cuando llega nuevo usuario
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo insertar si no existe ya (por si el signup manual ya lo creó)
  INSERT INTO public.profiles (id, business_id, name, email, role, avatar_url)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada negocio ve SOLO sus propios datos
-- =====================================================

ALTER TABLE public.businesses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- businesses: solo el owner o empleados del negocio
CREATE POLICY "business_access" ON public.businesses
  FOR ALL USING (
    id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    OR owner_id = auth.uid()
  );

-- profiles: acceso por negocio
CREATE POLICY "profiles_access" ON public.profiles
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- categories
CREATE POLICY "categories_access" ON public.categories
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

-- products
CREATE POLICY "products_access" ON public.products
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

-- clients
CREATE POLICY "clients_access" ON public.clients
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

-- sales
CREATE POLICY "sales_access" ON public.sales
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

-- stock_movements
CREATE POLICY "movements_access" ON public.stock_movements
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
