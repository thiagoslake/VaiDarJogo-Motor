#!/usr/bin/env node

/**
 * 📊 COMANDO DE ESTATÍSTICAS - VAIDARJOGO MOTOR
 * 
 * Este script executa apenas o comando de estatísticas do motor,
 * sem inicializar o WhatsApp ou o agendador de notificações.
 * 
 * Uso:
 *   node comando_stats.js
 *   node comando_stats.js --stats
 *   node comando_stats.js -s
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class StatsCommand {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async execute() {
        try {
            console.log('📊 ===== ESTATÍSTICAS DO MOTOR VAIDARJOGO =====\n');
            
            // 1. Próxima notificação
            await this.showNextNotification();
            
            // 2. Notificações enviadas na última hora
            await this.showNotificationsLastHour();
            
            // 3. Notificações não lidas
            await this.showUnreadNotifications();
            
            console.log('\n📊 ===== FIM DAS ESTATÍSTICAS =====\n');
            
        } catch (error) {
            console.error('❌ Erro ao gerar estatísticas:', error);
        }
    }

    /**
     * 1. Mostrar próxima notificação
     */
    async showNextNotification() {
        try {
            console.log('🔔 1. PRÓXIMA NOTIFICAÇÃO:');
            
            const now = moment();
            
            // Buscar todas as sessões agendadas com notificações ativas
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
                .order('start_time', { ascending: true });
            
            if (error) {
                console.log('   ⚠️ Erro ao buscar sessões:', error.message);
                return;
            }
            
            if (!sessions || sessions.length === 0) {
                console.log('   📝 Nenhuma sessão agendada encontrada');
                return;
            }
            
            // Encontrar a próxima notificação
            let nextNotification = null;
            let nextNotificationTime = null;
            
            for (const session of sessions) {
                const sessionDateTime = moment(`${session.session_date} ${session.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                
                // Verificar se notification_configs existe e é um array
                const configs = session.notification_configs || [];
                if (!Array.isArray(configs)) {
                    continue;
                }
                
                for (const config of configs) {
                    try {
                        const schedule = Array.isArray(config.notification_schedule) ? 
                            config.notification_schedule : 
                            JSON.parse(config.notification_schedule);
                        
                        for (const item of schedule) {
                            const { hours_before } = item;
                            const notificationTime = sessionDateTime.clone().subtract(hours_before, 'hours');
                            
                            // Se a notificação ainda não foi enviada
                            if (notificationTime.isAfter(now)) {
                                if (!nextNotificationTime || notificationTime.isBefore(nextNotificationTime)) {
                                    nextNotificationTime = notificationTime;
                                    nextNotification = {
                                        game: session.games.organization_name,
                                        location: session.games.location,
                                        session_date: session.session_date,
                                        session_time: session.start_time,
                                        notification_time: notificationTime,
                                        hours_before: hours_before
                                    };
                                }
                            }
                        }
                    } catch (error) {
                        console.log('   ⚠️ Erro ao processar cronograma:', error.message);
                    }
                }
            }
            
            if (nextNotification) {
                const timeUntil = nextNotification.notification_time.diff(now, 'minutes');
                console.log(`   🎯 Jogo: ${nextNotification.game}`);
                console.log(`   📅 Data: ${moment(nextNotification.session_date).format('DD/MM/YYYY')} às ${nextNotification.session_time}`);
                console.log(`   📍 Local: ${nextNotification.location}`);
                console.log(`   ⏰ Notificação em: ${nextNotification.notification_time.format('DD/MM/YYYY HH:mm')}`);
                console.log(`   ⏳ Faltam: ${timeUntil} minutos (${nextNotification.hours_before}h antes do jogo)`);
            } else {
                console.log('   📝 Nenhuma notificação pendente encontrada');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar próxima notificação:', error);
        }
    }

    /**
     * 2. Mostrar notificações enviadas na última hora
     */
    async showNotificationsLastHour() {
        try {
            console.log('\n📤 2. NOTIFICAÇÕES ENVIADAS NA ÚLTIMA HORA:');
            
            const oneHourAgo = moment().subtract(1, 'hour').toISOString();
            
            // Buscar notificações enviadas na última hora
            const { data: notifications, error } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    title,
                    message,
                    type,
                    status,
                    sent_at,
                    games!inner(
                        organization_name
                    )
                `)
                .eq('status', 'sent')
                .gte('sent_at', oneHourAgo)
                .order('sent_at', { ascending: false });
            
            if (error) {
                console.log('   ⚠️ Erro ao buscar notificações:', error.message);
                return;
            }
            
            if (!notifications || notifications.length === 0) {
                console.log('   📝 Nenhuma notificação enviada na última hora');
                return;
            }
            
            console.log(`   📊 Total: ${notifications.length} notificações`);
            
            // Agrupar por jogo
            const notificationsByGame = {};
            notifications.forEach(notification => {
                const gameName = notification.games.organization_name;
                if (!notificationsByGame[gameName]) {
                    notificationsByGame[gameName] = 0;
                }
                notificationsByGame[gameName]++;
            });
            
            // Mostrar resumo por jogo
            Object.entries(notificationsByGame).forEach(([gameName, count]) => {
                console.log(`   🏈 ${gameName}: ${count} notificação(ões)`);
            });
            
            // Mostrar últimas 3 notificações
            console.log('\n   📋 Últimas notificações:');
            notifications.slice(0, 3).forEach((notification, index) => {
                const sentTime = moment(notification.sent_at).format('HH:mm:ss');
                console.log(`   ${index + 1}. [${sentTime}] ${notification.games.organization_name} - ${notification.title}`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar notificações da última hora:', error);
        }
    }

    /**
     * 3. Mostrar notificações não lidas
     */
    async showUnreadNotifications() {
        try {
            console.log('\n📬 3. NOTIFICAÇÕES NÃO LIDAS:');
            
            // Buscar notificações não lidas
            const { data: notifications, error } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    title,
                    message,
                    type,
                    status,
                    sent_at,
                    games!inner(
                        organization_name
                    )
                `)
                .eq('status', 'sent')
                .is('read_at', null)
                .order('sent_at', { ascending: false });
            
            if (error) {
                console.log('   ⚠️ Erro ao buscar notificações não lidas:', error.message);
                return;
            }
            
            if (!notifications || notifications.length === 0) {
                console.log('   📝 Todas as notificações foram lidas');
                return;
            }
            
            console.log(`   📊 Total: ${notifications.length} notificações não lidas`);
            
            // Agrupar por jogo
            const notificationsByGame = {};
            notifications.forEach(notification => {
                const gameName = notification.games.organization_name;
                if (!notificationsByGame[gameName]) {
                    notificationsByGame[gameName] = 0;
                }
                notificationsByGame[gameName]++;
            });
            
            // Mostrar resumo por jogo
            Object.entries(notificationsByGame).forEach(([gameName, count]) => {
                console.log(`   🏈 ${gameName}: ${count} notificação(ões) não lida(s)`);
            });
            
            // Mostrar notificações mais antigas não lidas
            console.log('\n   📋 Notificações não lidas (mais antigas):');
            notifications.slice(0, 5).forEach((notification, index) => {
                const sentTime = moment(notification.sent_at).format('DD/MM HH:mm');
                const timeAgo = moment(notification.sent_at).fromNow();
                console.log(`   ${index + 1}. [${sentTime}] ${notification.games.organization_name} - ${notification.title} (${timeAgo})`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar notificações não lidas:', error);
        }
    }
}

// Executar comando de estatísticas
async function main() {
    const statsCommand = new StatsCommand();
    await statsCommand.execute();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = StatsCommand;
