-- 🔧 ADICIONAR COLUNA ADDRESS - VAIDARJOGO
-- 📅 Data: $(date)
-- 🚀 Adiciona coluna address à tabela games

-- =====================================================
-- 📍 ADICIONAR COLUNA ADDRESS À TABELA GAMES
-- =====================================================

-- Adicionar coluna address à tabela games
ALTER TABLE games ADD COLUMN IF NOT EXISTS address TEXT;

-- Adicionar comentário à coluna
COMMENT ON COLUMN games.address IS 'Endereço/localização do jogo';

-- Verificar se a coluna foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'games' 
AND column_name = 'address';

-- =====================================================
-- ✅ VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar estrutura atual da tabela games
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'games' 
ORDER BY ordinal_position;
