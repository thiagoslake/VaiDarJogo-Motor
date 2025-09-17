#!/usr/bin/env node

/**
 * 🧪 SIMULAR NOTIFICAÇÃO TESTE
 * 
 * Este script simula uma notificação teste criando uma sessão
 * que seria agora para testar o sistema de notificações.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class SimularNotificacaoTeste {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarSimulacao() {
        try {
            console.log('🧪 ===== SIMULAÇÃO DE NOTIFICAÇÃO TESTE =====\n');
            
            // 1. Buscar um jogo existente
            const jogo = await this.buscarJogoExistente();
            
            if (!jogo) {
                console.log('❌ Nenhum jogo encontrado');
                return;
            }
            
            // 2. Criar sessão de teste
            const sessaoTeste = await this.criarSessaoTeste(jogo);
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração de notificação
            const configTeste = await this.criarConfiguracaoTeste(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 4. Simular notificação
            await this.simularNotificacao(sessaoTeste, configTeste);
            
            // 5. Testar comando de estatísticas
            await this.testarEstatisticas();
            
            // 6. Limpar dados de teste
            await this.limparDadosTeste(sessaoTeste, configTeste);
            
            console.log('\n🧪 ===== SIMULAÇÃO CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a simulação:', error);
        }
    }

    /**
     * 1. Buscar um jogo existente
     */
    async buscarJogoExistente() {
        try {
            console.log('🔍 1. BUSCANDO JOGO EXISTENTE:');
            
            const { data: jogos, error } = await this.supabase
                .from('games')
                .select('id, organization_name, location')
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro ao buscar jogos:', error.message);
                return null;
            }
            
            if (!jogos || jogos.length === 0) {
                console.log('   📝 Nenhum jogo encontrado');
                return null;
            }
            
            const jogo = jogos[0];
            console.log(`   ✅ Jogo encontrado: ${jogo.organization_name}`);
            console.log(`   📍 Local: ${jogo.location}`);
            
            return jogo;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar jogo:', error);
            return null;
        }
    }

    /**
     * 2. Criar sessão de teste
     */
    async criarSessaoTeste(jogo) {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO DE TESTE:');
            
            const agora = moment();
            const dataTeste = agora.clone().add(2, 'hours'); // 2 horas no futuro
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataTeste.format('YYYY-MM-DD'),
                start_time: dataTeste.format('HH:mm:ss'),
                end_time: dataTeste.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão de teste para simulação de notificação'
            };
            
            const { data: sessao, error } = await this.supabase
                .from('game_sessions')
                .insert(sessaoData)
                .select()
                .single();
            
            if (error) {
                console.log('   ❌ Erro ao criar sessão:', error.message);
                return null;
            }
            
            console.log(`   ✅ Sessão de teste criada: ${sessao.id}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   ⏰ Faltam: ${dataTeste.diff(agora, 'hours', true).toFixed(1)} horas`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão de teste:', error);
            return null;
        }
    }

    /**
     * 3. Criar configuração de notificação
     */
    async criarConfiguracaoTeste(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO DE TESTE:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 3,
                mensal_notifications: 2,
                notification_type: 'group',
                whatsapp_group_id: 'teste@group.us', // ID de teste
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 1.5, // 1.5 horas antes (para testar agora)
                        "target": "todos",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 1, // 1 hora antes
                        "target": "todos",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.5, // 30 minutos antes
                        "target": "todos",
                        "message_type": "final_confirmation"
                    }
                ],
                is_active: true
            };
            
            const { data: config, error } = await this.supabase
                .from('notification_configs')
                .insert(configData)
                .select()
                .single();
            
            if (error) {
                console.log('   ❌ Erro ao criar configuração:', error.message);
                return null;
            }
            
            console.log(`   ✅ Configuração de teste criada: ${config.id}`);
            console.log(`   🔔 3 notificações configuradas:`);
            console.log(`      1. 1.5h antes (todos) - confirmação`);
            console.log(`      2. 1h antes (todos) - lembrete`);
            console.log(`      3. 0.5h antes (todos) - confirmação final`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração de teste:', error);
            return null;
        }
    }

    /**
     * 4. Simular notificação
     */
    async simularNotificacao(sessao, config) {
        try {
            console.log('\n📤 4. SIMULANDO NOTIFICAÇÃO:');
            
            const agora = moment();
            const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const timeUntilSession = dataSessao.diff(agora, 'hours', true);
            
            console.log(`   ⏳ Tempo até a sessão: ${timeUntilSession.toFixed(1)} horas`);
            
            const schedule = Array.isArray(config.notification_schedule) ? 
                config.notification_schedule : 
                JSON.parse(config.notification_schedule);
            
            for (const item of schedule) {
                const { hours_before, target, message_type } = item;
                const timeDiff = Math.abs(timeUntilSession - hours_before);
                
                console.log(`   🔔 Testando: ${hours_before}h antes (${target})`);
                console.log(`      Diferença: ${timeDiff.toFixed(2)} horas`);
                
                // Se está dentro de 30 minutos do horário programado
                if (timeDiff <= 0.5) {
                    console.log(`      ✅ NOTIFICAÇÃO DEVERIA SER ENVIADA!`);
                    
                    // Gerar mensagem
                    const message = this.gerarMensagemTeste(sessao, item);
                    console.log(`      📱 Mensagem:`);
                    console.log(`      ${message}`);
                    
                    // Simular envio para o banco
                    await this.simularEnvioParaBanco(sessao, item);
                } else {
                    console.log(`      ⏳ Não é hora ainda (diferença: ${timeDiff.toFixed(2)}h)`);
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular notificação:', error);
        }
    }

    /**
     * Gerar mensagem de teste
     */
    gerarMensagemTeste(sessao, item) {
        const { hours_before, target, message_type } = item;
        const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
        const formattedDate = dataSessao.format('DD/MM/YYYY [às] HH:mm');
        
        let message = `🏈 *${sessao.game_id} - TESTE*\n\n`;
        message += `📅 Data: ${formattedDate}\n`;
        message += `📍 Local: Sessão de Teste\n\n`;
        
        if (message_type === 'confirmation') {
            message += `⚽ [TESTE] Confirme sua presença!`;
        } else if (message_type === 'reminder') {
            message += `⏰ [TESTE] Lembrete: Jogo em ${hours_before}h!`;
        } else if (message_type === 'final_confirmation') {
            message += `🔥 [TESTE] Última chamada! Jogo em ${hours_before}h!`;
        }
        
        message += `\n\n🧪 Esta é uma notificação de teste do sistema.`;
        
        return message;
    }

    /**
     * Simular envio para o banco
     */
    async simularEnvioParaBanco(sessao, item) {
        try {
            const { hours_before, target, message_type } = item;
            
            // Criar log de notificação teste
            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    game_id: sessao.game_id,
                    title: `[TESTE] Lembrete: Sessão de Teste`,
                    message: `[TESTE] Jogo agendado para ${moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY [às] HH:mm')} - ${hours_before}h antes (${target})`,
                    type: 'game_reminder_test',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });

            if (error) {
                console.log(`      ❌ Erro ao salvar no banco: ${error.message}`);
            } else {
                console.log(`      ✅ Notificação teste salva no banco`);
            }
            
        } catch (error) {
            console.error(`      ❌ Erro ao simular envio para banco:`, error);
        }
    }

    /**
     * 5. Testar comando de estatísticas
     */
    async testarEstatisticas() {
        try {
            console.log('\n📊 5. TESTANDO COMANDO DE ESTATÍSTICAS:');
            
            // Simular o que o comando de estatísticas faria
            const agora = moment();
            
            const { data: sessions, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
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
                .gte('session_date', agora.format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(3);
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return;
            }
            
            console.log(`   📊 Encontradas ${sessions.length} sessões com notificações:`);
            
            for (const session of sessions) {
                const sessionDateTime = moment(`${session.session_date} ${session.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const timeUntilSession = sessionDateTime.diff(agora, 'hours', true);
                
                console.log(`   🎯 ${session.games.organization_name}:`);
                console.log(`      📅 ${sessionDateTime.format('DD/MM/YYYY HH:mm')} (faltam ${timeUntilSession.toFixed(1)}h)`);
                
                const configs = session.notification_configs || [];
                if (Array.isArray(configs)) {
                    for (const config of configs) {
                        try {
                            const schedule = Array.isArray(config.notification_schedule) ? 
                                config.notification_schedule : 
                                JSON.parse(config.notification_schedule);
                            
                            for (const item of schedule) {
                                const { hours_before, target, message_type } = item;
                                const notificationTime = sessionDateTime.clone().subtract(hours_before, 'hours');
                                const timeUntilNotification = notificationTime.diff(agora, 'hours', true);
                                
                                const status = timeUntilNotification > 0 ? '⏳ Pendente' : 
                                             timeUntilNotification > -1 ? '🔔 Agora!' : '✅ Passou';
                                
                                console.log(`         ${status} ${hours_before}h antes (${target}) - ${notificationTime.format('DD/MM HH:mm')}`);
                            }
                        } catch (error) {
                            console.log(`         ❌ Erro ao processar configuração: ${error.message}`);
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar estatísticas:', error);
        }
    }

    /**
     * 6. Limpar dados de teste
     */
    async limparDadosTeste(sessao, config) {
        try {
            console.log('\n🧹 6. LIMPANDO DADOS DE TESTE:');
            
            // Remover configuração de teste
            const { error: configError } = await this.supabase
                .from('notification_configs')
                .delete()
                .eq('id', config.id);
            
            if (configError) {
                console.log('   ❌ Erro ao remover configuração:', configError.message);
            } else {
                console.log('   ✅ Configuração de teste removida');
            }
            
            // Remover sessão de teste
            const { error: sessaoError } = await this.supabase
                .from('game_sessions')
                .delete()
                .eq('id', sessao.id);
            
            if (sessaoError) {
                console.log('   ❌ Erro ao remover sessão:', sessaoError.message);
            } else {
                console.log('   ✅ Sessão de teste removida');
            }
            
            // Remover notificações de teste
            const { error: notifError } = await this.supabase
                .from('notifications')
                .delete()
                .eq('type', 'game_reminder_test');
            
            if (notifError) {
                console.log('   ❌ Erro ao remover notificações:', notifError.message);
            } else {
                console.log('   ✅ Notificações de teste removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar dados de teste:', error);
        }
    }
}

// Executar simulação
async function main() {
    const simulacao = new SimularNotificacaoTeste();
    await simulacao.executarSimulacao();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimularNotificacaoTeste;
