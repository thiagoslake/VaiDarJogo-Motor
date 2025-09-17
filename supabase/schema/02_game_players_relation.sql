-- 🗄️ SCHEMA - RELACIONAMENTO JOGADORES E JOGOS
-- 📅 Data: $(date)
-- 🔄 Adicionando tabela para relacionar jogadores com jogos específicos

-- =====================================================
-- 🔗 TABELA: JOGADORES POR JOGO
-- =====================================================

CREATE TABLE IF NOT EXISTS game_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, player_id)
);

-- =====================================================
-- 📈 ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_game_players_status ON game_players(status);

-- =====================================================
-- 🔄 TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para atualização automática
CREATE TRIGGER update_game_players_updated_at 
    BEFORE UPDATE ON game_players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🎯 POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 📝 COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE game_players IS 'Relacionamento entre jogadores e jogos específicos - permite que um jogador participe de múltiplos jogos';

-- =====================================================
-- ✅ FINALIZAÇÃO
-- =====================================================

-- Log de criação
INSERT INTO audit_logs (action, table_name, notes) 
VALUES ('table_creation', 'game_players', 'Tabela de relacionamento jogadores-jogos criada com sucesso');

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela game_players criada com sucesso!';
    RAISE NOTICE '🔗 Relacionamento jogadores-jogos estabelecido';
    RAISE NOTICE '📈 Índices de performance criados';
END $$;


