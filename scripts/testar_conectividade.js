#!/usr/bin/env node

/**
 * 🔍 TESTAR CONECTIVIDADE
 * 
 * Este script testa a conectividade do motor
 * e verifica se há problemas na configuração.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TestarConectividade {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async testarConectividade() {
        try {
            console.log('🔍 ===== TESTANDO CONECTIVIDADE =====\n');
            
            // 1. Testar conexão com Supabase
            await this.testarSupabase();
            
            // 2. Verificar dados necessários
            await this.verificarDadosNecessarios();
            
            // 3. Simular lógica do motor
            await this.simularLogicaMotor();
            
            // 4. Verificar problemas potenciais
            await this.verificarProblemasPotenciais();
            
            console.log('\n🔍 ===== TESTE DE CONECTIVIDADE CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste de conectividade:', error);
        }
    }

    /**
     * 1. Testar conexão com Supabase
     */
    async testarSupabase() {
        try {
            console.log('🔗 1. TESTANDO CONEXÃO COM SUPABASE:');
            
            // Teste básico
            const { data, error } = await this.supabase
                .from('app_users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro na conexão básica:', error.message);
                return false;
            } else {
                console.log('   ✅ Conexão básica: OK');
            }
            
            // Teste de tabelas específicas
            const tabelas = ['games', 'game_sessions', 'notification_configs', 'players', 'game_players', 'participation_confirmations'];
            
            for (const tabela of tabelas) {
                const { error: tabelaError } = await this.supabase
                    .from(tabela)
                    .select('id')
                    .limit(1);
                
                if (tabelaError) {
                    console.log(`   ❌ Tabela ${tabela}: ERRO - ${tabelaError.message}`);
                } else {
                    console.log(`   ✅ Tabela ${tabela}: OK`);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('   ❌ Erro ao testar Supabase:', error);
            return false;
        }
    }

    /**
     * 2. Verificar dados necessários
     */
    async verificarDadosNecessarios() {
        try {
            console.log('\n📊 2. VERIFICANDO DADOS NECESSÁRIOS:');
            
            // Verificar jogos
            const { data: jogos, error: jogosError } = await this.supabase
                .from('games')
                .select('id, organization_name, status')
                .eq('status', 'active');
            
            if (jogosError) {
                console.log('   ❌ Erro ao buscar jogos:', jogosError.message);
            } else {
                console.log(`   ✅ Jogos ativos: ${jogos?.length || 0}`);
                if (jogos && jogos.length > 0) {
                    jogos.forEach((jogo, index) => {
                        console.log(`      ${index + 1}. ${jogo.organization_name}`);
                    });
                }
            }
            
            // Verificar sessões agendadas
            const agora = moment();
            const { data: sessoes, error: sessoesError } = await this.supabase
                .from('game_sessions')
                .select('id, session_date, start_time, status, games(organization_name)')
                .eq('status', 'scheduled')
                .gte('session_date', agora.format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .limit(5);
            
            if (sessoesError) {
                console.log('   ❌ Erro ao buscar sessões:', sessoesError.message);
            } else {
                console.log(`   ✅ Sessões agendadas: ${sessoes?.length || 0}`);
                if (sessoes && sessoes.length > 0) {
                    sessoes.forEach((sessao, index) => {
                        const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                        const tempoRestante = dataSessao.diff(agora, 'minutes', true);
                        console.log(`      ${index + 1}. ${sessao.games.organization_name} - ${dataSessao.format('DD/MM HH:mm')} (${tempoRestante.toFixed(1)} min)`);
                    });
                }
            }
            
            // Verificar configurações de notificação
            const { data: configs, error: configsError } = await this.supabase
                .from('notification_configs')
                .select('id, is_active, notification_type, whatsapp_group_id')
                .eq('is_active', true);
            
            if (configsError) {
                console.log('   ❌ Erro ao buscar configurações:', configsError.message);
            } else {
                console.log(`   ✅ Configurações ativas: ${configs?.length || 0}`);
                if (configs && configs.length > 0) {
                    configs.forEach((config, index) => {
                        console.log(`      ${index + 1}. Tipo: ${config.notification_type}, Grupo: ${config.whatsapp_group_id || 'Não configurado'}`);
                    });
                }
            }
            
            // Verificar mensalistas
            const { data: mensalistas, error: mensalistasError } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type, status')
                .eq('type', 'monthly')
                .eq('status', 'active');
            
            if (mensalistasError) {
                console.log('   ❌ Erro ao buscar mensalistas:', mensalistasError.message);
            } else {
                console.log(`   ✅ Mensalistas ativos: ${mensalistas?.length || 0}`);
                if (mensalistas && mensalistas.length > 0) {
                    mensalistas.forEach((mensalista, index) => {
                        console.log(`      ${index + 1}. ${mensalista.name} - ${mensalista.phone_number}`);
                    });
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar dados necessários:', error);
        }
    }

    /**
     * 3. Simular lógica do motor
     */
    async simularLogicaMotor() {
        try {
            console.log('\n🤖 3. SIMULANDO LÓGICA DO MOTOR:');
            
            const now = moment();
            
            // Simular consulta do motor
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
                console.log('   ❌ Erro na consulta do motor:', error.message);
                return;
            }
            
            console.log(`   📊 Jogos encontrados: ${games?.length || 0}`);
            
            if (!games || games.length === 0) {
                console.log('   ⚠️ Nenhum jogo encontrado com os critérios do motor');
                return;
            }
            
            // Processar cada jogo
            for (const game of games) {
                console.log(`\n   🎮 Processando jogo: ${game.organization_name}`);
                
                for (const session of game.game_sessions || []) {
                    const sessionDateTime = moment(`${session.session_date} ${session.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                    const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                    
                    console.log(`      📅 Sessão: ${sessionDateTime.format('DD/MM HH:mm')} (${timeUntilSession.toFixed(2)}h restantes)`);
                    
                    for (const config of session.notification_configs || []) {
                        console.log(`      🔔 Configuração: ${config.id}`);
                        console.log(`         Tipo: ${config.notification_type}`);
                        console.log(`         Grupo: ${config.whatsapp_group_id || 'Não configurado'}`);
                        
                        // Verificar se deve enviar notificação
                        const shouldSend = this.shouldSendNotification(config, timeUntilSession);
                        console.log(`         Deve enviar: ${shouldSend ? 'SIM' : 'NÃO'}`);
                        
                        if (shouldSend) {
                            // Buscar mensalistas
                            const { data: mensalistas, error: mensalistasError } = await this.supabase
                                .from('game_players')
                                .select(`
                                    player_id,
                                    players!inner(
                                        id,
                                        name,
                                        phone_number,
                                        type,
                                        status
                                    )
                                `)
                                .eq('game_id', game.id)
                                .eq('status', 'active')
                                .eq('players.type', 'monthly')
                                .eq('players.status', 'active');
                            
                            if (mensalistasError) {
                                console.log(`         ❌ Erro ao buscar mensalistas: ${mensalistasError.message}`);
                            } else {
                                console.log(`         📱 Mensalistas para notificar: ${mensalistas?.length || 0}`);
                                if (mensalistas && mensalistas.length > 0) {
                                    mensalistas.forEach((mensalista, index) => {
                                        console.log(`            ${index + 1}. ${mensalista.players.name} - ${mensalista.players.phone_number}`);
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular lógica do motor:', error);
        }
    }

    /**
     * Verificar se deve enviar notificação
     */
    shouldSendNotification(config, timeUntilSession) {
        const { notification_schedule } = config;
        
        try {
            const schedule = Array.isArray(notification_schedule) ? notification_schedule : JSON.parse(notification_schedule);
            
            for (const item of schedule) {
                const { hours_before } = item;
                const timeDiff = Math.abs(timeUntilSession - hours_before);
                
                if (timeDiff <= 0.5) {
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.log(`         ⚠️ Erro ao processar notification_schedule: ${error.message}`);
            return false;
        }
    }

    /**
     * 4. Verificar problemas potenciais
     */
    async verificarProblemasPotenciais() {
        try {
            console.log('\n⚠️ 4. VERIFICANDO PROBLEMAS POTENCIAIS:');
            
            // Verificar se há mensalistas sem telefone
            const { data: mensalistasSemTelefone, error: semTelefoneError } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type')
                .eq('type', 'monthly')
                .eq('status', 'active')
                .or('phone_number.is.null,phone_number.eq.');
            
            if (semTelefoneError) {
                console.log('   ❌ Erro ao verificar mensalistas sem telefone:', semTelefoneError.message);
            } else if (mensalistasSemTelefone && mensalistasSemTelefone.length > 0) {
                console.log(`   ⚠️ Mensalistas sem telefone: ${mensalistasSemTelefone.length}`);
                mensalistasSemTelefone.forEach((mensalista, index) => {
                    console.log(`      ${index + 1}. ${mensalista.name} - Telefone: ${mensalista.phone_number || 'VAZIO'}`);
                });
            } else {
                console.log('   ✅ Todos os mensalistas têm telefone cadastrado');
            }
            
            // Verificar configurações sem grupo WhatsApp
            const { data: configsSemGrupo, error: semGrupoError } = await this.supabase
                .from('notification_configs')
                .select('id, notification_type, whatsapp_group_id')
                .eq('is_active', true)
                .or('whatsapp_group_id.is.null,whatsapp_group_id.eq.');
            
            if (semGrupoError) {
                console.log('   ❌ Erro ao verificar configurações sem grupo:', semGrupoError.message);
            } else if (configsSemGrupo && configsSemGrupo.length > 0) {
                console.log(`   ⚠️ Configurações sem grupo WhatsApp: ${configsSemGrupo.length}`);
                configsSemGrupo.forEach((config, index) => {
                    console.log(`      ${index + 1}. Tipo: ${config.notification_type}, Grupo: ${config.whatsapp_group_id || 'VAZIO'}`);
                });
            } else {
                console.log('   ✅ Todas as configurações têm grupo WhatsApp');
            }
            
            // Verificar sessões sem configuração
            const { data: sessoesSemConfig, error: semConfigError } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    games!inner(organization_name)
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'));
            
            if (semConfigError) {
                console.log('   ❌ Erro ao verificar sessões sem configuração:', semConfigError.message);
            } else if (sessoesSemConfig && sessoesSemConfig.length > 0) {
                console.log(`   📊 Sessões agendadas: ${sessoesSemConfig.length}`);
                
                for (const sessao of sessoesSemConfig) {
                    const { data: configs, error: configsError } = await this.supabase
                        .from('notification_configs')
                        .select('id')
                        .eq('session_id', sessao.id)
                        .eq('is_active', true);
                    
                    if (configsError) {
                        console.log(`   ❌ Erro ao verificar configuração da sessão ${sessao.id}:`, configsError.message);
                    } else if (!configs || configs.length === 0) {
                        console.log(`   ⚠️ Sessão sem configuração: ${sessao.games.organization_name} - ${sessao.session_date} ${sessao.start_time}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar problemas potenciais:', error);
        }
    }
}

// Executar teste de conectividade
async function main() {
    const teste = new TestarConectividade();
    await teste.testarConectividade();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestarConectividade;
