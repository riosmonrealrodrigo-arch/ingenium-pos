-- ==============================================================================
-- INGENIUM POS: MIGRACIÓN INTEGRAL - TIENDA, CHAT CON BOT, REPARACIONES Y TICKETS
-- ==============================================================================

-- 1. Ajustes en tabla products para el catálogo web
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS visible_en_tienda BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS commercial_description TEXT;

-- 2. Tabla de Conversaciones de Chat
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
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de Mensajes de Chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin', 'bot')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de Órdenes de Reparación y Taller
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
    unlock_pattern TEXT, -- PIN o descripción del patrón gráfico
    issue_reported TEXT NOT NULL,
    technician_diagnosis TEXT,
    estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    advance_payment NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'recibido' CHECK (status IN ('recibido', 'en_diagnostico', 'esperando_repuesto', 'listo_entrega', 'entregado', 'cancelado')),
    assigned_technician TEXT,
    received_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla de Configuración de Recibos y Tickets
CREATE TABLE IF NOT EXISTS public.ticket_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    tax_id TEXT, -- NIT / RFC
    address TEXT,
    phone TEXT,
    email TEXT,
    social_media TEXT,
    warranty_note TEXT DEFAULT 'Garantía de 30 días en piezas instaladas. No aplica en equipos mojados o golpeados.',
    repair_terms TEXT DEFAULT 'Los equipos no reclamados después de 60 días causarán abandono de acuerdo con las leyes comerciales aplicables.',
    default_format TEXT DEFAULT 'thermal_80' CHECK (default_format IN ('thermal_58', 'thermal_80', 'letter')),
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_conversations_business ON public.chat_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_repair_orders_business ON public.repair_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_phone ON public.repair_orders(client_phone);
CREATE INDEX IF NOT EXISTS idx_repair_orders_folio ON public.repair_orders(folio);
CREATE INDEX IF NOT EXISTS idx_products_visible_tienda ON public.products(visible_en_tienda);

-- 6. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para personal administrativo del POS
CREATE POLICY "Admin gestiona conversaciones de su negocio"
    ON public.chat_conversations FOR ALL
    USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin gestiona mensajes de su negocio"
    ON public.chat_messages FOR ALL
    USING (
        conversation_id IN (
            SELECT c.id FROM public.chat_conversations c
            INNER JOIN public.profiles p ON p.business_id = c.business_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Admin gestiona reparaciones de su negocio"
    ON public.repair_orders FOR ALL
    USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin gestiona ticket_settings de su negocio"
    ON public.ticket_settings FOR ALL
    USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas públicas para clientes (Catálogo y Chat web)
CREATE POLICY "Clientes pueden crear conversaciones"
    ON public.chat_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Clientes pueden ver conversaciones"
    ON public.chat_conversations FOR SELECT USING (true);

CREATE POLICY "Clientes y bot pueden insertar mensajes"
    ON public.chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Clientes pueden leer mensajes del chat"
    ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Clientes pueden consultar estado de su reparacion"
    ON public.repair_orders FOR SELECT USING (true);

CREATE POLICY "Visitantes públicos pueden ver catálogo de tienda"
    ON public.products FOR SELECT USING (visible_en_tienda = true);

CREATE POLICY "Lectura pública de ticket_settings"
    ON public.ticket_settings FOR SELECT USING (true);

-- 7. Habilitar Suscripción Realtime en Supabase
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'repair_orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_orders;
    END IF;
END $$;
