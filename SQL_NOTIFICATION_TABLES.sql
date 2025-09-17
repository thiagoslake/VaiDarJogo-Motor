-- =====================================================
-- 🗄️ SQL PARA CRIAR TABELAS DE NOTIFICAÇÕES
-- =====================================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- =====================================================
-- 📊 TABELA: CONFIGURAÇÕES DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    
    -- Configurações das notificações
    total_notifications INTEGER NOT NULL DEFAULT 3,
    mensal_notifications INTEGER NOT NULL DEFAULT 2,
    
    -- Tipo de notificação (individual ou grupo)
    notification_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (notification_type IN ('individual', 'group')),
    
    -- ID do grupo WhatsApp (se for notificação em grupo)
    whatsapp_group_id VARCHAR(100),
    
    -- Configurações de horários (JSON para flexibilidade)
    notification_schedule JSONB NOT NULL DEFAULT '[
        {"number": 1, "hours_before": 24, "target": "mensalistas", "message_type": "confirmation"},
        {"number": 2, "hours_before": 12, "target": "mensalistas", "message_type": "reminder"},
        {"number": 3, "hours_before": 6, "target": "todos", "message_type": "final_confirmation"}
    ]'::jsonb,
    
    -- Status da configuração
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(session_id)
);

-- =====================================================
-- 📊 TABELA: CONFIRMAÇÕES DE PARTICIPAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS participation_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_phone VARCHAR(20) NOT NULL,
    
    -- Status da confirmação
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'declined', 'pending')),
    
    -- Tipo de jogador no momento da confirmação
    player_type VARCHAR(20) NOT NULL CHECK (player_type IN ('monthly', 'casual')),
    
    -- Posição na lista (para controle de ordem)
    position INTEGER,
    
    -- Dados da confirmação
    confirmed_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(session_id, player_phone)
);

-- =====================================================
-- 📈 ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notification_configs_session_id ON notification_configs(session_id);
CREATE INDEX IF NOT EXISTS idx_notification_configs_game_id ON notification_configs(game_id);
CREATE INDEX IF NOT EXISTS idx_notification_configs_active ON notification_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_participation_confirmations_session_id ON participation_confirmations(session_id);
CREATE INDEX IF NOT EXISTS idx_participation_confirmations_player_id ON participation_confirmations(player_id);
CREATE INDEX IF NOT EXISTS idx_participation_confirmations_status ON participation_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_participation_confirmations_position ON participation_confirmations(session_id, position);

-- =====================================================
-- 🔄 TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_notification_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_configs_updated_at
    BEFORE UPDATE ON notification_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_configs_updated_at();

CREATE TRIGGER update_participation_confirmations_updated_at
    BEFORE UPDATE ON participation_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_configs_updated_at();

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_confirmations ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_configs
CREATE POLICY "Users can view notification configs" ON notification_configs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert notification configs" ON notification_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update notification configs" ON notification_configs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete notification configs" ON notification_configs
    FOR DELETE USING (true);

-- Políticas para participation_confirmations
CREATE POLICY "Users can view participation confirmations" ON participation_confirmations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert participation confirmations" ON participation_confirmations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update participation confirmations" ON participation_confirmations
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete participation confirmations" ON participation_confirmations
    FOR DELETE USING (true);

-- =====================================================
-- 📝 COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE notification_configs IS 'Configurações de notificações automáticas para sessões de jogo';
COMMENT ON COLUMN notification_configs.total_notifications IS 'Número total de notificações a serem enviadas';
COMMENT ON COLUMN notification_configs.mensal_notifications IS 'Número de notificações apenas para mensalistas';
COMMENT ON COLUMN notification_configs.notification_type IS 'Tipo de notificação: individual ou grupo';
COMMENT ON COLUMN notification_configs.whatsapp_group_id IS 'ID do grupo WhatsApp para notificações em grupo';
COMMENT ON COLUMN notification_configs.notification_schedule IS 'Cronograma das notificações em formato JSON';

COMMENT ON TABLE participation_confirmations IS 'Confirmações de participação dos jogadores em sessões';
COMMENT ON COLUMN participation_confirmations.status IS 'Status da confirmação: confirmed, declined, pending';
COMMENT ON COLUMN participation_confirmations.player_type IS 'Tipo do jogador: monthly ou casual';
COMMENT ON COLUMN participation_confirmations.position IS 'Posição na lista de confirmação';
COMMENT ON COLUMN participation_confirmations.confirmed_at IS 'Data e hora da confirmação';
COMMENT ON COLUMN participation_confirmations.declined_at IS 'Data e hora da desistência';












