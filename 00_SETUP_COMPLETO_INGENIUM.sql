-- ==============================================================================
-- INGENIUM POS — SCRIPT MAESTRO DE CONFIGURACIÓN INTEGRAL (PostgreSQL 15+)
-- Ejecuta este script completo en: Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

-- 1. Extensiones requeridas para UUIDs y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS PRINCIPALES DEL SISTEMA
-- ==============================================================================

-- 2.1 Negocios / Sucursales
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'INGENIUM MÓVIL',
    currency TEXT NOT NULL DEFAULT 'Q',
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 12.00,
    address TEXT,
    phone TEXT,
    email TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Perfiles de Usuario (Extensión de auth.users para personal del POS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','cajero','supervisor','tecnico')),
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Categorías de Inventario
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Productos, Repuestos y Accesorios (Con soporte de tienda web)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    commercial_description TEXT,
    image_url TEXT,
    visible_en_tienda BOOLEAN DEFAULT true,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Registro de Ventas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo','tarjeta','transferencia','credito')),
    cash_given NUMERIC(10,2),
    change NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Movimientos de Inventario (Kárdex)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada','salida','ajuste','venta')),
    quantity INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Conversaciones de Chat en Vivo (Storefront Web <-> POS Desktop)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    unread_admin_count INT NOT NULL DEFAULT 0,
    unread_client_count INT NOT NULL DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Mensajes de Chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin', 'bot')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 Órdenes de Reparación y Taller Técnico
CREATE TABLE IF NOT EXISTS public.repair_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    device_brand TEXT NOT NULL,
    device_model TEXT NOT NULL,
    device_color TEXT,
    imei_serial TEXT,
    unlock_pattern TEXT,
    issue_reported TEXT NOT NULL,
    technician_diagnosis TEXT,
    estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    advance_payment NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'recibido' CHECK (status IN ('recibido', 'en_diagnostico', 'esperando_repuesto', 'listo_entrega', 'entregado', 'cancelado')),
    assigned_technician TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Configuración de Recibos y Tickets (Térmico 58mm / 80mm / Carta)
CREATE TABLE IF NOT EXISTS public.ticket_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL DEFAULT 'INGENIUM MÓVIL',
    tax_id TEXT DEFAULT 'NIT: 10482910-3',
    address TEXT DEFAULT '6ta Avenida 12-34, Zona 1, Ciudad de Guatemala',
    phone TEXT DEFAULT '+502 5555-0199',
    email TEXT DEFAULT 'contacto@ingeniummovil.com',
    social_media TEXT DEFAULT 'FB & IG: @ingeniummovil',
    warranty_note TEXT DEFAULT 'Garantía de 30 días en repuestos instalados. No aplica en equipos mojados, manipulados o con sellos violados.',
    repair_terms TEXT DEFAULT 'Todo equipo no retirado después de 60 días causará abandono legal. No nos responsabilizamos por información no respaldada.',
    default_format TEXT DEFAULT 'thermal_80' CHECK (default_format IN ('thermal_58', 'thermal_80', 'letter')),
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_visible_tienda ON public.products(visible_en_tienda);
CREATE INDEX IF NOT EXISTS idx_sales_business ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conv_business ON public.chat_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_last_msg ON public.chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_repair_orders_folio ON public.repair_orders(folio);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_phone ON public.repair_orders(client_phone);

-- ==============================================================================
-- 4. FUNCIONES EN PL/PGSQL ESTRICTO (ESTÁNDAR POSTGRESQL 15+)
-- ==============================================================================

-- 4.1 Descontar inventario de forma segura (con comprobación de stock suficiente)
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id UUID, amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - amount
    WHERE id = product_id AND stock >= amount;
END;
$$;

-- 4.2 Función auxiliar reduce_stock (para compatibilidad de llamada alternativa)
CREATE OR REPLACE FUNCTION public.reduce_stock(product_id UUID, amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - amount)
    WHERE id = product_id;
END;
$$;

-- 4.3 Trigger para auto-crear perfil cuando se registra un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    name = COALESCE(EXCLUDED.name, profiles.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 Políticas para Personal Administrativo (POS)
DROP POLICY IF EXISTS "Acceso total negocios" ON public.businesses;
CREATE POLICY "Acceso total negocios" ON public.businesses FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total perfiles" ON public.profiles;
CREATE POLICY "Acceso total perfiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total categorias" ON public.categories;
CREATE POLICY "Acceso total categorias" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total productos personal" ON public.products;
CREATE POLICY "Acceso total productos personal" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total clientes" ON public.clients;
CREATE POLICY "Acceso total clientes" ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total ventas" ON public.sales;
CREATE POLICY "Acceso total ventas" ON public.sales FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total stock" ON public.stock_movements;
CREATE POLICY "Acceso total stock" ON public.stock_movements FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total chat admin" ON public.chat_conversations;
CREATE POLICY "Acceso total chat admin" ON public.chat_conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total mensajes admin" ON public.chat_messages;
CREATE POLICY "Acceso total mensajes admin" ON public.chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total reparaciones admin" ON public.repair_orders;
CREATE POLICY "Acceso total reparaciones admin" ON public.repair_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total ticket_settings" ON public.ticket_settings;
CREATE POLICY "Acceso total ticket_settings" ON public.ticket_settings FOR ALL USING (true);

-- 5.2 Políticas Públicas para Clientes Web (Catálogo, Chat y Estado de Órdenes)
DROP POLICY IF EXISTS "Lectura publica de productos visibles" ON public.products;
CREATE POLICY "Lectura publica de productos visibles" ON public.products FOR SELECT USING (visible_en_tienda = true);

DROP POLICY IF EXISTS "Clientes pueden crear conversaciones" ON public.chat_conversations;
CREATE POLICY "Clientes pueden crear conversaciones" ON public.chat_conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes pueden leer conversaciones" ON public.chat_conversations;
CREATE POLICY "Clientes pueden leer conversaciones" ON public.chat_conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clientes pueden enviar mensajes" ON public.chat_messages;
CREATE POLICY "Clientes pueden enviar mensajes" ON public.chat_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes pueden leer mensajes" ON public.chat_messages;
CREATE POLICY "Clientes pueden leer mensajes" ON public.chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clientes pueden consultar su orden" ON public.repair_orders;
CREATE POLICY "Clientes pueden consultar su orden" ON public.repair_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura publica de ticket_settings" ON public.ticket_settings;
CREATE POLICY "Lectura publica de ticket_settings" ON public.ticket_settings FOR SELECT USING (true);

-- ==============================================================================
-- 6. PUBLICACIÓN REALTIME SEGURA (MANEJO DE EXCEPCIONES PARA EVITAR DUPLICADOS)
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
