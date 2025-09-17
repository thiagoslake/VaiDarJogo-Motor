#!/usr/bin/env node

/**
 * 🔍 DEBUG CONSULTA
 * 
 * Este script debuga a consulta do Supabase para entender
 * por que as notification_configs não são retornadas como array.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class DebugConsulta {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async debugConsulta() {
        try {
            console.log('🔍 ===== DEBUG CONSULTA =====\n');
            
            const now = moment();
            
            // 1. Testar consulta simples
            await this.testarConsultaSimples();
            
            // 2. Testar consulta com JOIN
            await this.testarConsultaComJoin();
            
            // 3. Testar consulta exata do motor
            await this.testarConsultaExataMotor(now);
            
            console.log('\n🔍 ===== DEBUG CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o debug:', error);
        }
    }

    /**
     * 1. Testar consulta simples
     */
    async testarConsultaSimples() {
        try {
            console.log('🔍 1. TESTANDO CONSULTA SIMPLES:');
            
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select('id, session_date, start_time, status')
                .eq('status', 'scheduled')
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro:', error.message);
                return;
            }
            
            console.log(`   📊 Sessões encontradas: ${sessoes?.length || 0}`);
            if (sessoes && sessoes.length > 0) {
                console.log('   📝 Primeira sessão:', JSON.stringify(sessoes[0], null, 2));
            }
            
        } catch (error) {
            console.error('   ❌ Erro na consulta simples:', error);
        }
    }

    /**
     * 2. Testar consulta com JOIN
     */
    async testarConsultaComJoin() {
        try {
            console.log('\n🔍 2. TESTANDO CONSULTA COM JOIN:');
            
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        id,
                        organization_name
                    )
                `)
                .eq('status', 'scheduled')
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro:', error.message);
                return;
            }
            
            console.log(`   📊 Sessões encontradas: ${sessoes?.length || 0}`);
            if (sessoes && sessoes.length > 0) {
                console.log('   📝 Primeira sessão:', JSON.stringify(sessoes[0], null, 2));
            }
            
        } catch (error) {
            console.error('   ❌ Erro na consulta com JOIN:', error);
        }
    }

    /**
     * 3. Testar consulta exata do motor
     */
    async testarConsultaExataMotor(now) {
        try {
            console.log('\n🔍 3. TESTANDO CONSULTA EXATA DO MOTOR:');
            
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        id,
                        organization_name
                    ),
                    notification_configs!inner(
                        id,
                        notification_schedule,
                        is_active
                    )
                `)
                .eq('status', 'scheduled')
                .eq('notification_configs.is_active', true)
                .gte('session_date', now.format('YYYY-MM-DD'))
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro:', error.message);
                return;
            }
            
            console.log(`   📊 Sessões encontradas: ${sessoes?.length || 0}`);
            if (sessoes && sessoes.length > 0) {
                const sessao = sessoes[0];
                console.log('   📝 Sessão completa:', JSON.stringify(sessao, null, 2));
                
                console.log('\n   🔍 ANÁLISE DETALHADA:');
                console.log(`   📅 Data: ${sessao.session_date}`);
                console.log(`   ⏰ Hora: ${sessao.start_time}`);
                console.log(`   🎮 Jogo: ${sessao.games?.organization_name}`);
                console.log(`   🔔 Configs: ${JSON.stringify(sessao.notification_configs, null, 2)}`);
                
                // Verificar tipo das configurações
                console.log(`   🔍 Tipo das configs: ${typeof sessao.notification_configs}`);
                console.log(`   🔍 É array: ${Array.isArray(sessao.notification_configs)}`);
                console.log(`   🔍 É null: ${sessao.notification_configs === null}`);
                console.log(`   🔍 É undefined: ${sessao.notification_configs === undefined}`);
                
                if (sessao.notification_configs) {
                    console.log(`   🔍 Conteúdo: ${JSON.stringify(sessao.notification_configs)}`);
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro na consulta exata do motor:', error);
        }
    }
}

// Executar debug
async function main() {
    const debug = new DebugConsulta();
    await debug.debugConsulta();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DebugConsulta;

