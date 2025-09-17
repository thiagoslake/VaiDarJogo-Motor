-- 🗄️ SCHEMA - CORREÇÃO DA TABELA PARTICIPATION_REQUESTS
-- 📅 Data: $(date)
-- 🔄 Corrigir referência de player_id para user_id

-- =====================================================
-- 🔧 VERIFICAÇÃO E CORREÇÃO DA ESTRUTURA
-- =====================================================

-- Verificar se a tabela participation_requests existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'participation_requests'
    ) THEN
        -- Verificar se a coluna player_id existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'participation_requests' AND column_name = 'player_id'
        ) THEN
            -- Renomear a coluna player_id para user_id
            ALTER TABLE participation_requests RENAME COLUMN player_id TO user_id;
            RAISE NOTICE '✅ Coluna player_id renomeada para user_id na tabela participation_requests';
        END IF;
        
        -- Verificar se a foreign key existe e recriar se necessário
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'participation_requests' 
            AND constraint_name LIKE '%player_id%'
        ) THEN
            -- Remover constraint antiga
            ALTER TABLE participation_requests DROP CONSTRAINT IF EXISTS participation_requests_player_id_fkey;
            RAISE NOTICE '✅ Constraint antiga removida';
        END IF;
        
        -- Adicionar nova foreign key para users
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'participation_requests' 
            AND constraint_name = 'participation_requests_user_id_fkey'
        ) THEN
            ALTER TABLE participation_requests 
            ADD CONSTRAINT participation_requests_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ Nova foreign key criada para users';
        END IF;
        
        -- Recriar índice se necessário
        DROP INDEX IF EXISTS idx_participation_requests_player_id;
        CREATE INDEX IF NOT EXISTS idx_participation_requests_user_id ON participation_requests(user_id);
        RAISE NOTICE '✅ Índice atualizado para user_id';
    END IF;
END $$;

-- =====================================================
-- 🔧 ATUALIZAÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Recriar políticas RLS com a nova estrutura
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'participation_requests'
    ) THEN
        -- Remover políticas antigas
        DROP POLICY IF EXISTS "Users can view own participation requests" ON participation_requests;
        DROP POLICY IF EXISTS "Users can create own participation requests" ON participation_requests;
        DROP POLICY IF EXISTS "Game admins can view requests for their games" ON participation_requests;
        DROP POLICY IF EXISTS "Game admins can update requests for their games" ON participation_requests;
        
        -- Criar novas políticas
        CREATE POLICY "Users can view own participation requests" ON participation_requests
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can create own participation requests" ON participation_requests
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Game admins can view requests for their games" ON participation_requests
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM games 
                    WHERE games.id = participation_requests.game_id 
                    AND games.user_id = auth.uid()
                )
            );

        CREATE POLICY "Game admins can update requests for their games" ON participation_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM games 
                    WHERE games.id = participation_requests.game_id 
                    AND games.user_id = auth.uid()
                )
            );
            
        RAISE NOTICE '✅ Políticas RLS atualizadas para participation_requests';
    END IF;
END $$;

-- =====================================================
-- 🔧 ATUALIZAÇÃO DAS FUNÇÕES
-- =====================================================

-- Atualizar função de aprovação
CREATE OR REPLACE FUNCTION approve_participation_request(
    request_id UUID, 
    response_msg TEXT DEFAULT NULL,
    player_type VARCHAR(20) DEFAULT 'casual'
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record participation_requests%ROWTYPE;
    user_record users%ROWTYPE;
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
    
    -- Buscar dados do usuário
    SELECT * INTO user_record 
    FROM users 
    WHERE id = request_record.user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Verificar se o usuário já tem um registro na tabela players
    IF NOT EXISTS (
        SELECT 1 FROM players 
        WHERE user_id = request_record.user_id
    ) THEN
        -- Criar registro na tabela players
        INSERT INTO players (
            user_id,
            name,
            phone_number,
            type,
            status,
            created_at,
            updated_at
        ) VALUES (
            request_record.user_id,
            user_record.name,
            user_record.phone,
            player_type,
            'active',
            NOW(),
            NOW()
        );
    ELSE
        -- Atualizar tipo do jogador se necessário
        UPDATE players 
        SET 
            type = player_type,
            updated_at = NOW()
        WHERE user_id = request_record.user_id;
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

-- Atualizar função de rejeição
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

-- =====================================================
-- 📝 COMENTÁRIOS ATUALIZADOS
-- =====================================================

COMMENT ON COLUMN participation_requests.user_id IS 'ID do usuário que está solicitando participação';
