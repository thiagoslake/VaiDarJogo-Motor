-- 🗄️ SCHEMA - SOLICITAÇÕES DE PARTICIPAÇÃO
-- 📅 Data: $(date)
-- 🔄 Tabela para gerenciar solicitações de participação em jogos

-- =====================================================
-- 📋 TABELA: SOLICITAÇÕES DE PARTICIPAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS participation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- =====================================================
-- 📈 ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_participation_requests_game_id ON participation_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_participation_requests_user_id ON participation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_participation_requests_status ON participation_requests(status);
CREATE INDEX IF NOT EXISTS idx_participation_requests_requested_at ON participation_requests(requested_at);

-- =====================================================
-- 🔄 TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para atualização automática
CREATE TRIGGER update_participation_requests_updated_at 
    BEFORE UPDATE ON participation_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🎯 POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE participation_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitações de participação
DROP POLICY IF EXISTS "Users can view own participation requests" ON participation_requests;
CREATE POLICY "Users can view own participation requests" ON participation_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own participation requests" ON participation_requests;
CREATE POLICY "Users can create own participation requests" ON participation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Game admins can view requests for their games" ON participation_requests;
CREATE POLICY "Game admins can view requests for their games" ON participation_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = participation_requests.game_id 
            AND games.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Game admins can update requests for their games" ON participation_requests;
CREATE POLICY "Game admins can update requests for their games" ON participation_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = participation_requests.game_id 
            AND games.user_id = auth.uid()
        )
    );

-- =====================================================
-- 📝 COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE participation_requests IS 'Solicitações de participação em jogos - permite que jogadores solicitem participação e administradores aprovem/rejeitem';
COMMENT ON COLUMN participation_requests.game_id IS 'ID do jogo para o qual a participação está sendo solicitada';
COMMENT ON COLUMN participation_requests.user_id IS 'ID do usuário que está solicitando participação';
COMMENT ON COLUMN participation_requests.status IS 'Status da solicitação: pending, approved, rejected';
COMMENT ON COLUMN participation_requests.requested_at IS 'Data e hora em que a solicitação foi feita';
COMMENT ON COLUMN participation_requests.responded_at IS 'Data e hora em que a solicitação foi respondida';
COMMENT ON COLUMN participation_requests.response_message IS 'Mensagem opcional do administrador ao responder a solicitação';

-- =====================================================
-- 🔧 FUNÇÕES AUXILIARES
-- =====================================================

-- Função para aprovar solicitação e adicionar jogador ao jogo
CREATE OR REPLACE FUNCTION approve_participation_request(
    request_id UUID, 
    response_msg TEXT DEFAULT NULL,
    player_type VARCHAR(20) DEFAULT 'casual'
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record participation_requests%ROWTYPE;
    player_record players%ROWTYPE;
BEGIN
    -- Buscar a solicitação
    SELECT * INTO request_record 
    FROM participation_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
    END IF;
    
    -- Verificar se o usuário atual é admin do jogo
    IF NOT EXISTS (
        SELECT 1 FROM games 
        WHERE id = request_record.game_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Apenas administradores do jogo podem aprovar solicitações';
    END IF;
    
    -- Validar tipo de jogador
    IF player_type NOT IN ('casual', 'monthly') THEN
        RAISE EXCEPTION 'Tipo de jogador deve ser "casual" ou "monthly"';
    END IF;
    
    -- Buscar dados do jogador
    SELECT * INTO player_record 
    FROM players 
    WHERE user_id = request_record.user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jogador não encontrado';
    END IF;
    
    -- Atualizar tipo do jogador se necessário
    IF player_record.type != player_type THEN
        UPDATE players 
        SET 
            type = player_type,
            updated_at = NOW()
        WHERE id = request_record.user_id;
    END IF;
    
    -- Atualizar status da solicitação
    UPDATE participation_requests 
    SET 
        status = 'approved',
        responded_at = NOW(),
        response_message = response_msg,
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Adicionar jogador ao jogo
    INSERT INTO game_players (game_id, player_id, status, joined_at)
    SELECT 
        request_record.game_id,
        p.id,
        'active',
        NOW()
    FROM players p
    WHERE p.user_id = request_record.user_id
    ON CONFLICT (game_id, player_id) DO UPDATE SET
        status = 'active',
        joined_at = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para rejeitar solicitação
CREATE OR REPLACE FUNCTION reject_participation_request(request_id UUID, response_msg TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    request_record participation_requests%ROWTYPE;
BEGIN
    -- Buscar a solicitação
    SELECT * INTO request_record 
    FROM participation_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
    END IF;
    
    -- Verificar se o usuário atual é admin do jogo
    IF NOT EXISTS (
        SELECT 1 FROM games 
        WHERE id = request_record.game_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Apenas administradores do jogo podem rejeitar solicitações';
    END IF;
    
    -- Atualizar status da solicitação
    UPDATE participation_requests 
    SET 
        status = 'rejected',
        responded_at = NOW(),
        response_message = response_msg,
        updated_at = NOW()
    WHERE id = request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
