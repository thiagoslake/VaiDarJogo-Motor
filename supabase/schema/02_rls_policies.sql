-- 🔐 POLÍTICAS RLS (ROW LEVEL SECURITY) - VAIDARJOGO
-- 📅 Data: $(date)
-- 🎯 Configuração de políticas de segurança para inserção e consulta

-- =====================================================
-- 🔓 POLÍTICAS PARA INSERÇÃO (MIGRAÇÃO)
-- =====================================================

-- Política para permitir inserção em app_users durante migração
CREATE POLICY "allow_insert_during_migration" ON app_users
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em games durante migração
CREATE POLICY "allow_insert_during_migration" ON games
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em players durante migração
CREATE POLICY "allow_insert_during_migration" ON players
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em teams durante migração
CREATE POLICY "allow_insert_during_migration" ON teams
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em team_players durante migração
CREATE POLICY "allow_insert_during_migration" ON team_players
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em payments durante migração
CREATE POLICY "allow_insert_during_migration" ON payments
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em notifications durante migração
CREATE POLICY "allow_insert_during_migration" ON notifications
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em game_sessions durante migração
CREATE POLICY "allow_insert_during_migration" ON game_sessions
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em device_tokens durante migração
CREATE POLICY "allow_insert_during_migration" ON device_tokens
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em audit_logs durante migração
CREATE POLICY "allow_insert_during_migration" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Política para permitir inserção em api_keys durante migração
CREATE POLICY "allow_insert_during_migration" ON api_keys
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 👁️ POLÍTICAS PARA CONSULTA
-- =====================================================

-- Política para permitir consulta em app_users
CREATE POLICY "allow_select_for_all" ON app_users
    FOR SELECT USING (true);

-- Política para permitir consulta em games
CREATE POLICY "allow_select_for_all" ON games
    FOR SELECT USING (true);

-- Política para permitir consulta em players
CREATE POLICY "allow_select_for_all" ON players
    FOR SELECT USING (true);

-- Política para permitir consulta em teams
CREATE POLICY "allow_select_for_all" ON teams
    FOR SELECT USING (true);

-- Política para permitir consulta em team_players
CREATE POLICY "allow_select_for_all" ON team_players
    FOR SELECT USING (true);

-- Política para permitir consulta em payments
CREATE POLICY "allow_select_for_all" ON payments
    FOR SELECT USING (true);

-- Política para permitir consulta em notifications
CREATE POLICY "allow_select_for_all" ON notifications
    FOR SELECT USING (true);

-- Política para permitir consulta em game_sessions
CREATE POLICY "allow_select_for_all" ON game_sessions
    FOR SELECT USING (true);

-- Política para permitir consulta em device_tokens
CREATE POLICY "allow_select_for_all" ON device_tokens
    FOR SELECT USING (true);

-- Política para permitir consulta em audit_logs
CREATE POLICY "allow_select_for_all" ON audit_logs
    FOR SELECT USING (true);

-- Política para permitir consulta em api_keys
CREATE POLICY "allow_select_for_all" ON api_keys
    FOR SELECT USING (true);

-- =====================================================
-- ✏️ POLÍTICAS PARA ATUALIZAÇÃO
-- =====================================================

-- Política para permitir atualização em app_users
CREATE POLICY "allow_update_for_all" ON app_users
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em games
CREATE POLICY "allow_update_for_all" ON games
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em players
CREATE POLICY "allow_update_for_all" ON players
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em teams
CREATE POLICY "allow_update_for_all" ON teams
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em team_players
CREATE POLICY "allow_update_for_all" ON team_players
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em payments
CREATE POLICY "allow_update_for_all" ON payments
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em notifications
CREATE POLICY "allow_update_for_all" ON notifications
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em game_sessions
CREATE POLICY "allow_update_for_all" ON game_sessions
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em device_tokens
CREATE POLICY "allow_update_for_all" ON device_tokens
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em audit_logs
CREATE POLICY "allow_update_for_all" ON audit_logs
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para permitir atualização em api_keys
CREATE POLICY "allow_update_for_all" ON api_keys
    FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================
-- 🗑️ POLÍTICAS PARA EXCLUSÃO
-- =====================================================

-- Política para permitir exclusão em app_users
CREATE POLICY "allow_delete_for_all" ON app_users
    FOR DELETE USING (true);

-- Política para permitir exclusão em games
CREATE POLICY "allow_delete_for_all" ON games
    FOR DELETE USING (true);

-- Política para permitir exclusão em players
CREATE POLICY "allow_delete_for_all" ON players
    FOR DELETE USING (true);

-- Política para permitir exclusão em teams
CREATE POLICY "allow_delete_for_all" ON teams
    FOR DELETE USING (true);

-- Política para permitir exclusão em team_players
CREATE POLICY "allow_delete_for_all" ON team_players
    FOR DELETE USING (true);

-- Política para permitir exclusão em payments
CREATE POLICY "allow_delete_for_all" ON payments
    FOR DELETE USING (true);

-- Política para permitir exclusão em notifications
CREATE POLICY "allow_delete_for_all" ON notifications
    FOR DELETE USING (true);

-- Política para permitir exclusão em game_sessions
CREATE POLICY "allow_delete_for_all" ON game_sessions
    FOR DELETE USING (true);

-- Política para permitir exclusão em device_tokens
CREATE POLICY "allow_delete_for_all" ON device_tokens
    FOR DELETE USING (true);

-- Política para permitir exclusão em audit_logs
CREATE POLICY "allow_delete_for_all" ON audit_logs
    FOR DELETE USING (true);

-- Política para permitir exclusão em api_keys
CREATE POLICY "allow_delete_for_all" ON api_keys
    FOR DELETE USING (true);

-- =====================================================
-- ✅ FINALIZAÇÃO
-- =====================================================

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS configuradas com sucesso!';
    RAISE NOTICE '🔓 Inserção, consulta, atualização e exclusão permitidas';
    RAISE NOTICE '⚠️ ATENÇÃO: Estas são políticas permissivas para desenvolvimento';
    RAISE NOTICE '🔒 Configure políticas mais restritivas para produção';
END $$;
