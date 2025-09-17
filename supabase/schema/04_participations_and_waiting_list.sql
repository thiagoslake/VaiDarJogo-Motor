-- 🗄️ SCHEMA - PARTICIPAÇÕES E LISTA DE ESPERA
-- 📅 Data: $(date)
-- 🔄 Tabelas para sistema de confirmação e lista de espera

-- =====================================================
-- 📊 TABELA: PARTICIPAÇÕES EM SESSÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('confirmed', 'declined', 'pending')),
    notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, player_id)
);

-- =====================================================
-- 📋 TABELA: LISTA DE ESPERA
-- =====================================================

CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, player_id)
);

-- =====================================================
-- 📈 ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para participations
CREATE INDEX IF NOT EXISTS idx_participations_session_id ON participations(session_id);
CREATE INDEX IF NOT EXISTS idx_participations_player_id ON participations(player_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON participations(status);
CREATE INDEX IF NOT EXISTS idx_participations_session_status ON participations(session_id, status);

-- Índices para waiting_list
CREATE INDEX IF NOT EXISTS idx_waiting_list_session_id ON waiting_list(session_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_player_id ON waiting_list(player_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_position ON waiting_list(session_id, position);

-- =====================================================
-- 🔄 TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para participations
CREATE OR REPLACE FUNCTION update_participations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participations_updated_at
    BEFORE UPDATE ON participations
    FOR EACH ROW
    EXECUTE FUNCTION update_participations_updated_at();

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Políticas para participations
CREATE POLICY "Users can view their own participations" ON participations
    FOR SELECT USING (true); -- Por enquanto, permitir visualização para todos

CREATE POLICY "Users can insert their own participations" ON participations
    FOR INSERT WITH CHECK (true); -- Por enquanto, permitir inserção para todos

CREATE POLICY "Users can update their own participations" ON participations
    FOR UPDATE USING (true); -- Por enquanto, permitir atualização para todos

-- Políticas para waiting_list
CREATE POLICY "Users can view waiting list" ON waiting_list
    FOR SELECT USING (true); -- Por enquanto, permitir visualização para todos

CREATE POLICY "Users can insert into waiting list" ON waiting_list
    FOR INSERT WITH CHECK (true); -- Por enquanto, permitir inserção para todos

CREATE POLICY "Users can delete from waiting list" ON waiting_list
    FOR DELETE USING (true); -- Por enquanto, permitir exclusão para todos

-- =====================================================
-- 📝 COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE participations IS 'Participações dos jogadores em sessões de jogo';
COMMENT ON TABLE waiting_list IS 'Lista de espera para sessões de jogo';

COMMENT ON COLUMN participations.status IS 'Status da participação: confirmed, declined, pending';
COMMENT ON COLUMN participations.confirmed_at IS 'Data e hora da confirmação';
COMMENT ON COLUMN waiting_list.position IS 'Posição na lista de espera (1 = primeiro)';
COMMENT ON COLUMN waiting_list.added_at IS 'Data e hora em que foi adicionado à lista de espera';

