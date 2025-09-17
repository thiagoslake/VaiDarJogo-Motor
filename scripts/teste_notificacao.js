#!/usr/bin/env node

/**
 * 🧪 TESTE DE NOTIFICAÇÃO
 * 
 * Este script simula uma notificação teste, considerando que
 * a próxima sessão do jogo seria agora.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TesteNotificacao {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarTeste() {
        try {
            console.log('🧪 ===== TESTE DE NOTIFICAÇÃO =====\n');
            
            // 1. Buscar a próxima sessão
            const proximaSessao = await this.buscarProximaSessao();
            
            if (!proximaSessao) {
                console.log('❌ Nenhuma sessão encontrada para teste');
                return;
            }
            
            // 2. Simular que a sessão é agora
            await this.simularSessaoAgora(proximaSessao);
            
            // 3. Testar lógica de notificação
            await this.testarLogicaNotificacao(proximaSessao);
            
            // 4. Simular envio de notificação
            await this.simularEnvioNotificacao(proximaSessao);
            
            // 5. Verificar resultado
            await this.verificarResultado();
            
            console.log('\n🧪 ===== TESTE CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
        }
    }

    /**
     * 1. Buscar a próxima sessão
     */
    async buscarProximaSessao() {
        try {
            console.log('🔍 1. BUSCANDO PRÓXIMA SESSÃO:');
            
            const now = moment();
            
            const { data: sessions, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        id,
                        organization_name,
                        location
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
                .order('session_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return null;
            }
            
            if (!sessions || sessions.length === 0) {
                console.log('   📝 Nenhuma sessão encontrada');
                return null;
            }
            
            const sessao = sessions[0];
            console.log(`   ✅ Sessão encontrada: ${sessao.games.organization_name}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   📍 Local: ${sessao.games.location}`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar próxima sessão:', error);
            return null;
        }
    }

    /**
     * 2. Simular que a sessão é agora
     */
    async simularSessaoAgora(sessao) {
        try {
            console.log('\n⏰ 2. SIMULANDO SESSÃO AGORA:');
            
            const agora = moment();
            const dataOriginal = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            
            console.log(`   📅 Data original: ${dataOriginal.format('DD/MM/YYYY HH:mm')}`);
            console.log(`   ⏰ Agora: ${agora.format('DD/MM/YYYY HH:mm')}`);
            console.log(`   ⏳ Diferença: ${dataOriginal.diff(agora, 'hours', true).toFixed(1)} horas`);
            
            // Calcular quando as notificações deveriam ser enviadas
            const configs = sessao.notification_configs || [];
            if (Array.isArray(configs)) {
                for (const config of configs) {
                    try {
                        const schedule = Array.isArray(config.notification_schedule) ? 
                            config.notification_schedule : 
                            JSON.parse(config.notification_schedule);
                        
                        console.log(`   🔔 Configuração (${config.id}):`);
                        
                        for (const item of schedule) {
                            const { hours_before, target, message_type } = item;
                            const notificationTime = dataOriginal.clone().subtract(hours_before, 'hours');
                            const timeUntilNotification = notificationTime.diff(agora, 'hours', true);
                            
                            const status = timeUntilNotification > 0 ? '⏳ Pendente' : 
                                         timeUntilNotification > -1 ? '🔔 Agora!' : '✅ Passou';
                            
                            console.log(`      ${status} ${hours_before}h antes (${target}) - ${notificationTime.format('DD/MM HH:mm')}`);
                        }
                    } catch (error) {
                        console.log(`      ❌ Erro ao processar configuração: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular sessão:', error);
        }
    }

    /**
     * 3. Testar lógica de notificação
     */
    async testarLogicaNotificacao(sessao) {
        try {
            console.log('\n🔍 3. TESTANDO LÓGICA DE NOTIFICAÇÃO:');
            
            const agora = moment();
            const dataOriginal = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const timeUntilSession = dataOriginal.diff(agora, 'hours', true);
            
            console.log(`   ⏳ Tempo até a sessão: ${timeUntilSession.toFixed(1)} horas`);
            
            const configs = sessao.notification_configs || [];
            if (Array.isArray(configs)) {
                for (const config of configs) {
                    try {
                        const schedule = Array.isArray(config.notification_schedule) ? 
                            config.notification_schedule : 
                            JSON.parse(config.notification_schedule);
                        
                        console.log(`   🔔 Testando configuração (${config.id}):`);
                        
                        for (const item of schedule) {
                            const { hours_before, target, message_type } = item;
                            const timeDiff = Math.abs(timeUntilSession - hours_before);
                            
                            // Se está dentro de 30 minutos do horário programado
                            if (timeDiff <= 0.5) {
                                console.log(`      🔔 NOTIFICAÇÃO DEVERIA SER ENVIADA!`);
                                console.log(`         ${hours_before}h antes, target: ${target}, tipo: ${message_type}`);
                                console.log(`         Diferença: ${timeDiff.toFixed(2)} horas (≤ 0.5h)`);
                            } else {
                                console.log(`      ⏳ Não é hora ainda (diferença: ${timeDiff.toFixed(2)}h)`);
                            }
                        }
                    } catch (error) {
                        console.log(`      ❌ Erro ao processar configuração: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar lógica:', error);
        }
    }

    /**
     * 4. Simular envio de notificação
     */
    async simularEnvioNotificacao(sessao) {
        try {
            console.log('\n📤 4. SIMULANDO ENVIO DE NOTIFICAÇÃO:');
            
            const agora = moment();
            const dataOriginal = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const timeUntilSession = dataOriginal.diff(agora, 'hours', true);
            
            const configs = sessao.notification_configs || [];
            if (Array.isArray(configs)) {
                for (const config of configs) {
                    try {
                        const schedule = Array.isArray(config.notification_schedule) ? 
                            config.notification_schedule : 
                            JSON.parse(config.notification_schedule);
                        
                        for (const item of schedule) {
                            const { hours_before, target, message_type } = item;
                            const timeDiff = Math.abs(timeUntilSession - hours_before);
                            
                            // Se está dentro de 30 minutos do horário programado
                            if (timeDiff <= 0.5) {
                                console.log(`   🔔 Enviando notificação teste:`);
                                console.log(`      Jogo: ${sessao.games.organization_name}`);
                                console.log(`      Data: ${dataOriginal.format('DD/MM/YYYY [às] HH:mm')}`);
                                console.log(`      Local: ${sessao.games.location}`);
                                console.log(`      Target: ${target}`);
                                console.log(`      Tipo: ${message_type}`);
                                console.log(`      Horário: ${hours_before}h antes do jogo`);
                                
                                // Simular mensagem
                                const message = this.gerarMensagemTeste(sessao, item);
                                console.log(`      📱 Mensagem:`);
                                console.log(`      ${message}`);
                                
                                // Simular envio para o banco
                                await this.simularEnvioParaBanco(sessao, item);
                            }
                        }
                    } catch (error) {
                        console.log(`   ❌ Erro ao processar configuração: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular envio:', error);
        }
    }

    /**
     * Gerar mensagem de teste
     */
    gerarMensagemTeste(sessao, item) {
        const { hours_before, target, message_type } = item;
        const dataOriginal = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
        const formattedDate = dataOriginal.format('DD/MM/YYYY [às] HH:mm');
        
        let message = `🏈 *${sessao.games.organization_name}*\n\n`;
        message += `📅 Data: ${formattedDate}\n`;
        message += `🏢 Organização: ${sessao.games.organization_name}\n`;
        message += `📍 Local: ${sessao.games.location}\n\n`;
        
        if (message_type === 'confirmation') {
            message += `⚽ Confirme sua presença!`;
        } else if (message_type === 'reminder') {
            message += `⏰ Lembrete: Jogo em ${hours_before}h!`;
        } else if (message_type === 'final_confirmation') {
            message += `🔥 Última chamada! Jogo em ${hours_before}h!`;
        }
        
        if (target === 'mensalistas') {
            message += `\n\n👥 Mensalistas: Confirmação obrigatória!`;
        } else if (target === 'todos') {
            message += `\n\n👥 Todos os jogadores: Confirme sua presença!`;
        }
        
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
                    game_id: sessao.games.id,
                    title: `[TESTE] Lembrete: ${sessao.games.organization_name}`,
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
     * 5. Verificar resultado
     */
    async verificarResultado() {
        try {
            console.log('\n✅ 5. VERIFICANDO RESULTADO:');
            
            // Contar notificações de teste
            const { count, error } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'game_reminder_test');
            
            if (error) {
                console.log('   ❌ Erro ao contar notificações de teste:', error.message);
            } else {
                console.log(`   📊 Total de notificações de teste: ${count}`);
            }
            
            // Mostrar últimas notificações de teste
            const { data: notifications, error: notifError } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    title,
                    message,
                    sent_at,
                    games!inner(
                        organization_name
                    )
                `)
                .eq('type', 'game_reminder_test')
                .order('sent_at', { ascending: false })
                .limit(3);
            
            if (notifError) {
                console.log('   ❌ Erro ao buscar notificações de teste:', notifError.message);
            } else if (notifications && notifications.length > 0) {
                console.log(`   📋 Últimas notificações de teste:`);
                notifications.forEach((notification, index) => {
                    const sentTime = moment(notification.sent_at).format('DD/MM HH:mm:ss');
                    console.log(`   ${index + 1}. [${sentTime}] ${notification.games.organization_name} - ${notification.title}`);
                });
            } else {
                console.log('   📝 Nenhuma notificação de teste encontrada');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar resultado:', error);
        }
    }
}

// Executar teste
async function main() {
    const teste = new TesteNotificacao();
    await teste.executarTeste();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteNotificacao;
