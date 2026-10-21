-- ==============================================================================
-- INGENIUM POS: MIGRACIÓN TIENDA WEB PÚBLICA + CHAT DE SOPORTE EN TIEMPO REAL
-- ==============================================================================

-- 1. Campos para la Tienda Web Pública en tabla products
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
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_chat_conversations_business ON public.chat_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_products_visible_tienda ON public.products(visible_en_tienda);

-- 4. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para el Administrador / Personal del POS
CREATE POLICY "Admin puede ver conversaciones de su negocio"
    ON public.chat_conversations FOR ALL
    USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin puede gestionar mensajes de su negocio"
    ON public.chat_messages FOR ALL
    USING (
        conversation_id IN (
            SELECT c.id FROM public.chat_conversations c
            INNER JOIN public.profiles p ON p.business_id = c.business_id
            WHERE p.id = auth.uid()
        )
    );

-- Políticas para clientes públicos / anónimos en la Tienda Web
-- Permite a clientes crear conversaciones e insertar mensajes
CREATE POLICY "Clientes pueden crear conversaciones"
    ON public.chat_conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Clientes pueden ver su propia conversación"
    ON public.chat_conversations FOR SELECT
    USING (true);

CREATE POLICY "Clientes y admin pueden insertar mensajes"
    ON public.chat_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Clientes pueden leer mensajes de la conversación"
    ON public.chat_messages FOR SELECT
    USING (true);

-- Política para que visitantes puedan ver productos marcados como visibles en tienda
CREATE POLICY "Visitantes públicos pueden ver catálogo de tienda"
    ON public.products FOR SELECT
    USING (visible_en_tienda = true);

-- 5. Habilitar Realtime para Chat en Supabase
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
END $$;
