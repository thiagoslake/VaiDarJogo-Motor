-- 🗄️ SCHEMA - MIGRAÇÃO PARA TIPO DE JOGADOR
-- 📅 Data: $(date)
-- 🔄 Garantir que a tabela players tenha a coluna type

-- =====================================================
-- 🔧 VERIFICAÇÃO E CRIAÇÃO DA COLUNA TYPE
-- =====================================================

-- Verificar se a coluna type existe na tabela players
DO $$ 
BEGIN
    -- Se a tabela players existe mas não tem a coluna type, adicionar
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'players'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'type'
    ) THEN
        ALTER TABLE players ADD COLUMN type VARCHAR(20) DEFAULT 'casual';
        
        -- Adicionar constraint para validar valores
        ALTER TABLE players 
        ADD CONSTRAINT check_player_type 
        CHECK (type IN ('casual', 'monthly'));
        
        -- Adicionar comentário
        COMMENT ON COLUMN players.type IS 'Tipo do jogador: casual (avulso) ou monthly (mensalista)';
        
        RAISE NOTICE '✅ Coluna type adicionada à tabela players';
    END IF;
END $$;

-- =====================================================
-- 🔧 ATUALIZAÇÃO DE DADOS EXISTENTES
-- =====================================================

-- Se existirem jogadores sem tipo definido, definir como casual
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'type'
    ) THEN
        UPDATE players 
        SET type = 'casual' 
        WHERE type IS NULL;
        
        RAISE NOTICE '✅ Jogadores sem tipo definido foram marcados como casual';
    END IF;
END $$;

-- =====================================================
-- 🔧 ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Criar índice para consultas por tipo de jogador
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'type'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_players_type ON players(type);
        RAISE NOTICE '✅ Índice criado para players.type';
    END IF;
END $$;

-- =====================================================
-- 🔧 ATUALIZAÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Atualizar políticas RLS para incluir a coluna type
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'players'
    ) THEN
        -- Recriar políticas se existirem
        DROP POLICY IF EXISTS "Users can view own players" ON players;
        CREATE POLICY "Users can view own players" ON players
            FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own players" ON players;
        CREATE POLICY "Users can insert own players" ON players
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own players" ON players;
        CREATE POLICY "Users can update own players" ON players
            FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete own players" ON players;
        CREATE POLICY "Users can delete own players" ON players
            FOR DELETE USING (auth.uid() = user_id);
            
        RAISE NOTICE '✅ Políticas RLS atualizadas para players';
    END IF;
END $$;
