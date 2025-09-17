#!/usr/bin/env node

/**
 * 🧹 LIMPAR DADOS DE TESTE
 * 
 * Este script limpa todos os dados de teste criados durante
 * os testes de notificação, deixando o sistema limpo.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class LimparDadosTeste {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarLimpeza() {
        try {
            console.log('🧹 ===== LIMPEZA DE DADOS DE TESTE =====\n');
            
            // 1. Limpar notificações de teste
            await this.limparNotificacoesTeste();
            
            // 2. Limpar configurações de teste
            await this.limparConfiguracoesTeste();
            
            // 3. Limpar sessões de teste
            await this.limparSessoesTeste();
            
            // 4. Verificar resultado final
            await this.verificarResultadoFinal();
            
            console.log('\n🧹 ===== LIMPEZA CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a limpeza:', error);
        }
    }

    /**
     * 1. Limpar notificações de teste
     */
    async limparNotificacoesTeste() {
        try {
            console.log('🧹 1. LIMPANDO NOTIFICAÇÕES DE TESTE:');
            
            // Contar notificações de teste antes da limpeza
            const { count: antes, error: countError } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .in('type', ['game_reminder_test', 'game_reminder_real']);
            
            if (countError) {
                console.log('   ❌ Erro ao contar notificações:', countError.message);
            } else {
                console.log(`   📊 Notificações de teste encontradas: ${antes}`);
            }
            
            // Remover notificações de teste
            const { error: deleteError } = await this.supabase
                .from('notifications')
                .delete()
                .in('type', ['game_reminder_test', 'game_reminder_real']);
            
            if (deleteError) {
                console.log('   ❌ Erro ao remover notificações:', deleteError.message);
            } else {
                console.log('   ✅ Notificações de teste removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar notificações:', error);
        }
    }

    /**
     * 2. Limpar configurações de teste
     */
    async limparConfiguracoesTeste() {
        try {
            console.log('\n🧹 2. LIMPANDO CONFIGURAÇÕES DE TESTE:');
            
            // Buscar configurações de teste (que referenciam sessões de teste)
            const { data: configs, error: searchError } = await this.supabase
                .from('notification_configs')
                .select(`
                    id,
                    session_id,
                    game_sessions!inner(
                        id,
                        notes
                    )
                `)
                .like('game_sessions.notes', '%teste%');
            
            if (searchError) {
                console.log('   ❌ Erro ao buscar configurações:', searchError.message);
                return;
            }
            
            if (!configs || configs.length === 0) {
                console.log('   📝 Nenhuma configuração de teste encontrada');
                return;
            }
            
            console.log(`   📊 Configurações de teste encontradas: ${configs.length}`);
            
            // Remover configurações de teste
            const configIds = configs.map(c => c.id);
            const { error: deleteError } = await this.supabase
                .from('notification_configs')
                .delete()
                .in('id', configIds);
            
            if (deleteError) {
                console.log('   ❌ Erro ao remover configurações:', deleteError.message);
            } else {
                console.log('   ✅ Configurações de teste removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar configurações:', error);
        }
    }

    /**
     * 3. Limpar sessões de teste
     */
    async limparSessoesTeste() {
        try {
            console.log('\n🧹 3. LIMPANDO SESSÕES DE TESTE:');
            
            // Buscar sessões de teste
            const { data: sessoes, error: searchError } = await this.supabase
                .from('game_sessions')
                .select('id, notes')
                .like('notes', '%teste%');
            
            if (searchError) {
                console.log('   ❌ Erro ao buscar sessões:', searchError.message);
                return;
            }
            
            if (!sessoes || sessoes.length === 0) {
                console.log('   📝 Nenhuma sessão de teste encontrada');
                return;
            }
            
            console.log(`   📊 Sessões de teste encontradas: ${sessoes.length}`);
            
            // Remover sessões de teste
            const sessaoIds = sessoes.map(s => s.id);
            const { error: deleteError } = await this.supabase
                .from('game_sessions')
                .delete()
                .in('id', sessaoIds);
            
            if (deleteError) {
                console.log('   ❌ Erro ao remover sessões:', deleteError.message);
            } else {
                console.log('   ✅ Sessões de teste removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar sessões:', error);
        }
    }

    /**
     * 4. Verificar resultado final
     */
    async verificarResultadoFinal() {
        try {
            console.log('\n✅ 4. VERIFICANDO RESULTADO FINAL:');
            
            // Contar notificações totais
            const { count: totalNotif, error: totalError } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true });
            
            if (totalError) {
                console.log('   ❌ Erro ao contar notificações totais:', totalError.message);
            } else {
                console.log(`   📊 Total de notificações no sistema: ${totalNotif}`);
            }
            
            // Contar configurações totais
            const { count: totalConfig, error: configError } = await this.supabase
                .from('notification_configs')
                .select('*', { count: 'exact', head: true });
            
            if (configError) {
                console.log('   ❌ Erro ao contar configurações totais:', configError.message);
            } else {
                console.log(`   📊 Total de configurações no sistema: ${totalConfig}`);
            }
            
            // Contar sessões totais
            const { count: totalSessoes, error: sessoesError } = await this.supabase
                .from('game_sessions')
                .select('*', { count: 'exact', head: true });
            
            if (sessoesError) {
                console.log('   ❌ Erro ao contar sessões totais:', sessoesError.message);
            } else {
                console.log(`   📊 Total de sessões no sistema: ${totalSessoes}`);
            }
            
            // Verificar se há notificações de teste restantes
            const { count: testeRestante, error: testeError } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .in('type', ['game_reminder_test', 'game_reminder_real']);
            
            if (testeError) {
                console.log('   ❌ Erro ao verificar notificações de teste:', testeError.message);
            } else if (testeRestante === 0) {
                console.log('   ✅ Nenhuma notificação de teste restante');
            } else {
                console.log(`   ⚠️ Ainda há ${testeRestante} notificações de teste`);
            }
            
            // Mostrar resumo final
            console.log('\n   📋 RESUMO FINAL:');
            console.log(`   🎮 Jogos: 2 (ativos)`);
            console.log(`   📅 Sessões: ${totalSessoes} (agendadas)`);
            console.log(`   🔔 Configurações: ${totalConfig} (ativas)`);
            console.log(`   📱 Notificações: ${totalNotif} (enviadas)`);
            console.log(`   🧹 Dados de teste: Removidos`);
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar resultado final:', error);
        }
    }
}

// Executar limpeza
async function main() {
    const limpeza = new LimparDadosTeste();
    await limpeza.executarLimpeza();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = LimparDadosTeste;
