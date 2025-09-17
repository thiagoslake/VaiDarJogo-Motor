-- 🔓 DESABILITAR RLS TEMPORARIAMENTE - VAIDARJOGO
-- 📅 Data: $(date)
-- ⚠️ ATENÇÃO: Use apenas para desenvolvimento/migração

-- Desabilitar RLS em todas as tabelas
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ RLS desabilitado temporariamente em todas as tabelas';
    RAISE NOTICE '🔓 Agora você pode executar a migração de dados';
    RAISE NOTICE '⚠️ LEMBRE-SE: Reabilitar RLS após a migração';
END $$;
