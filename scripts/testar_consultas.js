#!/usr/bin/env node

/**
 * 🔍 TESTE DE CONSULTAS - VAIDARJOGO MOTOR
 * 
 * Este script testa as consultas do motor para identificar
 * por que não está conseguindo acessar as sessões cadastradas.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TesteConsultas {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarTestes() {
        try {
            console.log('🔍 ===== TESTE DE CONSULTAS DO MOTOR =====\n');
            
            // 1. Testar conexão básica
            await this.testarConexaoBasica();
            
            // 2. Verificar se as tabelas existem
            await this.verificarTabelas();
            
            // 3. Contar registros em cada tabela
            await this.contarRegistros();
            
            // 4. Testar consulta de jogos
            await this.testarConsultaJogos();
            
            // 5. Testar consulta de sessões
            await this.testarConsultaSessoes();
            
            // 6. Testar consulta de configurações de notificação
            await this.testarConsultaNotificacoes();
            
            // 7. Testar consulta completa (como o motor faz)
            await this.testarConsultaCompleta();
            
            console.log('\n🔍 ===== FIM DOS TESTES =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante os testes:', error);
        }
    }

    /**
     * 1. Testar conexão básica
     */
    async testarConexaoBasica() {
        try {
            console.log('🔗 1. TESTANDO CONEXÃO BÁSICA:');
            
            const { data, error } = await this.supabase
                .from('app_users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro na conexão:', error.message);
            } else {
                console.log('   ✅ Conexão OK:', data);
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar conexão:', error);
        }
    }

    /**
     * 2. Verificar se as tabelas existem
     */
    async verificarTabelas() {
        try {
            console.log('\n📋 2. VERIFICANDO EXISTÊNCIA DAS TABELAS:');
            
            const tabelas = [
                'games',
                'game_sessions', 
                'notification_configs',
                'notifications',
                'players',
                'app_users'
            ];
            
            for (const tabela of tabelas) {
                try {
                    const { data, error } = await this.supabase
                        .from(tabela)
                        .select('*')
                        .limit(1);
                    
                    if (error) {
                        console.log(`   ❌ ${tabela}: ${error.message}`);
                    } else {
                        console.log(`   ✅ ${tabela}: OK`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${tabela}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar tabelas:', error);
        }
    }

    /**
     * 3. Contar registros em cada tabela
     */
    async contarRegistros() {
        try {
            console.log('\n📊 3. CONTANDO REGISTROS:');
            
            const tabelas = [
                'games',
                'game_sessions', 
                'notification_configs',
                'notifications',
                'players',
                'app_users'
            ];
            
            for (const tabela of tabelas) {
                try {
                    const { count, error } = await this.supabase
                        .from(tabela)
                        .select('*', { count: 'exact', head: true });
                    
                    if (error) {
                        console.log(`   ❌ ${tabela}: ${error.message}`);
                    } else {
                        console.log(`   📊 ${tabela}: ${count} registros`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${tabela}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao contar registros:', error);
        }
    }

    /**
     * 4. Testar consulta de jogos
     */
    async testarConsultaJogos() {
        try {
            console.log('\n🎮 4. TESTANDO CONSULTA DE JOGOS:');
            
            const { data: games, error } = await this.supabase
                .from('games')
                .select('id, organization_name, location, status')
                .limit(5);
            
            if (error) {
                console.log('   ❌ Erro ao buscar jogos:', error.message);
            } else {
                console.log(`   ✅ Encontrados ${games.length} jogos:`);
                games.forEach((game, index) => {
                    console.log(`   ${index + 1}. ${game.organization_name} (${game.status}) - ${game.location}`);
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar consulta de jogos:', error);
        }
    }

    /**
     * 5. Testar consulta de sessões
     */
    async testarConsultaSessoes() {
        try {
            console.log('\n📅 5. TESTANDO CONSULTA DE SESSÕES:');
            
            const { data: sessions, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        organization_name
                    )
                `)
                .limit(5);
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
            } else {
                console.log(`   ✅ Encontradas ${sessions.length} sessões:`);
                sessions.forEach((session, index) => {
                    console.log(`   ${index + 1}. ${session.games.organization_name} - ${session.session_date} ${session.start_time} (${session.status})`);
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar consulta de sessões:', error);
        }
    }

    /**
     * 6. Testar consulta de configurações de notificação
     */
    async testarConsultaNotificacoes() {
        try {
            console.log('\n🔔 6. TESTANDO CONSULTA DE CONFIGURAÇÕES:');
            
            const { data: configs, error } = await this.supabase
                .from('notification_configs')
                .select(`
                    id,
                    is_active,
                    notification_type,
                    total_notifications,
                    game_sessions!inner(
                        session_date,
                        start_time,
                        games!inner(
                            organization_name
                        )
                    )
                `)
                .limit(5);
            
            if (error) {
                console.log('   ❌ Erro ao buscar configurações:', error.message);
            } else {
                console.log(`   ✅ Encontradas ${configs.length} configurações:`);
                configs.forEach((config, index) => {
                    console.log(`   ${index + 1}. ${config.game_sessions.games.organization_name} - ${config.notification_type} (ativo: ${config.is_active})`);
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar consulta de configurações:', error);
        }
    }

    /**
     * 7. Testar consulta completa (como o motor faz)
     */
    async testarConsultaCompleta() {
        try {
            console.log('\n🔍 7. TESTANDO CONSULTA COMPLETA (COMO O MOTOR):');
            
            const now = moment();
            
            // Consulta exata como o motor faz
            const { data: games, error } = await this.supabase
                .from('games')
                .select(`
                    id,
                    organization_name,
                    location,
                    game_sessions!inner(
                        id,
                        session_date,
                        start_time,
                        status,
                        notification_configs!inner(
                            id,
                            notification_type,
                            total_notifications,
                            mensal_notifications,
                            whatsapp_group_id,
                            notification_schedule,
                            is_active
                        )
                    )
                `)
                .eq('game_sessions.status', 'scheduled')
                .eq('game_sessions.notification_configs.is_active', true)
                .gte('game_sessions.session_date', now.format('YYYY-MM-DD'));
            
            if (error) {
                console.log('   ❌ Erro na consulta completa:', error.message);
                console.log('   📝 Detalhes do erro:', error);
            } else {
                console.log(`   ✅ Consulta completa OK: ${games.length} jogos encontrados`);
                
                if (games.length > 0) {
                    console.log('   📋 Jogos encontrados:');
                    games.forEach((game, index) => {
                        console.log(`   ${index + 1}. ${game.organization_name}`);
                        game.game_sessions.forEach((session, sIndex) => {
                            console.log(`      Sessão ${sIndex + 1}: ${session.session_date} ${session.start_time}`);
                            session.notification_configs.forEach((config, cIndex) => {
                                console.log(`         Config ${cIndex + 1}: ${config.notification_type} (ativo: ${config.is_active})`);
                            });
                        });
                    });
                } else {
                    console.log('   📝 Nenhum jogo encontrado com os critérios do motor');
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar consulta completa:', error);
        }
    }
}

// Executar testes
async function main() {
    const teste = new TesteConsultas();
    await teste.executarTestes();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteConsultas;
