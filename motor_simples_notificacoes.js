#!/usr/bin/env node

/**
 * 🚀 MOTOR SIMPLES - APENAS NOTIFICAÇÕES
 * 
 * Este motor simplificado foca apenas em enviar notificações
 * individuais para mensalistas, sem as funcionalidades complexas.
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class MotorSimplesNotificacoes {
    constructor() {
        // Configuração do Puppeteer otimizada
        const puppeteerConfig = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-pings',
                '--password-store=basic',
                '--use-mock-keychain'
            ]
        };

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "vaidarjogo-motor-fixo",
                dataPath: "./.wwebjs_auth"
            }),
            puppeteer: puppeteerConfig,
            restartOnAuthFail: true
        });

        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.isReady = false;
        this.notificationInterval = null;
    }

    async initialize() {
        try {
            console.log('🚀 Iniciando Motor Simples de Notificações...\n');
            
            // Testar conexão com Supabase
            console.log('🔗 Testando conexão com Supabase...');
            const { data, error } = await this.supabase
                .from('app_users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.log('⚠️ Aviso: Erro na conexão com Supabase:', error.message);
            } else {
                console.log('✅ Conectado ao Supabase com sucesso!');
            }
            
            // Configurar eventos do WhatsApp
            this.setupWhatsAppEvents();
            
            // Inicializar cliente WhatsApp
            await this.client.initialize();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar motor:', error);
            throw error;
        }
    }

    setupWhatsAppEvents() {
        // QR Code
        this.client.on('qr', (qr) => {
            console.log('📱 QR Code gerado. Escaneie com o WhatsApp:');
            console.log('💾 Sessão será salva automaticamente após o escaneamento');
            qrcode.generate(qr, { small: true });
        });

        // Sessão carregada (sem QR Code)
        this.client.on('authenticated', () => {
            console.log('🔐 Sessão WhatsApp autenticada!');
            console.log('💾 Usando sessão salva anteriormente');
        });

        // Cliente pronto
        this.client.on('ready', () => {
            console.log('✅ WhatsApp conectado e pronto!');
            console.log('💾 Sessão salva em: ./.wwebjs_auth/');
            console.log('🔄 Próxima execução usará a sessão salva automaticamente');
            this.isReady = true;
            this.startNotificationScheduler();
        });

        // Erro de autenticação
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
        });

        // Cliente desconectado
        this.client.on('disconnected', (reason) => {
            console.log('🔌 Cliente desconectado:', reason);
            this.isReady = false;
            this.stopNotificationScheduler();
        });
    }

    /**
     * Iniciar agendador de notificações
     */
    startNotificationScheduler() {
        console.log('⏰ Iniciando agendador de notificações...');
        
        this.notificationInterval = setInterval(async () => {
            if (this.isReady) {
                await this.checkAndSendNotifications();
            }
        }, 10000); // Verificar a cada 10 segundos
        
        console.log('✅ Agendador iniciado (verificação a cada 10 segundos)');
    }

    /**
     * Parar agendador de notificações
     */
    stopNotificationScheduler() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
            console.log('⏹️ Agendador de notificações parado');
        }
    }

    /**
     * Verificar e enviar notificações
     */
    async checkAndSendNotifications() {
        try {
            console.log('🔍 Verificando notificações...');
            const now = moment();
            console.log('🕐 Hora atual:', now.format('DD/MM/YYYY HH:mm:ss'));
            
            // Buscar sessões que precisam de notificação
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    game_id,
                    session_date,
                    start_time,
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
                .gte('session_date', now.format('YYYY-MM-DD'));
            
            if (error) {
                console.log('⚠️ Erro ao buscar sessões:', error.message);
                return;
            }
            
            if (!sessoes || sessoes.length === 0) {
                console.log('📝 Nenhuma sessão encontrada');
                return; // Nenhuma sessão encontrada
            }
            
            console.log(`📊 Sessões encontradas: ${sessoes.length}`);
            
            // Processar cada sessão
            for (const sessao of sessoes) {
                console.log(`\n🎮 Processando sessão: ${sessao.games.organization_name}`);
                const sessionDateTime = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                console.log(`📅 Data da sessão: ${sessionDateTime.format('DD/MM/YYYY HH:mm:ss')}`);
                console.log(`⏰ Tempo restante: ${timeUntilSession.toFixed(3)} horas`);
                
                // Verificar se precisa enviar notificação
                let configs = sessao.notification_configs || [];
                
                // Se não é array, converter para array
                if (!Array.isArray(configs)) {
                    console.log('⚠️ Configurações não são array, convertendo...');
                    configs = [configs]; // Converter objeto único para array
                }
                
                console.log(`🔔 Configurações encontradas: ${configs.length}`);
                
                for (const config of configs) {
                    const shouldSend = this.shouldSendNotification(config, timeUntilSession);
                    console.log(`🔍 Deve enviar notificação: ${shouldSend ? 'SIM' : 'NÃO'}`);
                    
                    if (shouldSend) {
                        console.log('📤 Enviando notificações...');
                        await this.sendNotificationToMensalistas(sessao, config);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar notificações:', error);
        }
    }

    /**
     * Verificar se deve enviar notificação
     */
    shouldSendNotification(config, timeUntilSession) {
        try {
            const { notification_schedule } = config;
            const schedule = Array.isArray(notification_schedule) ? 
                           notification_schedule : 
                           JSON.parse(notification_schedule);
            
            console.log(`📋 Schedule:`, JSON.stringify(schedule, null, 2));
            console.log(`⏰ Time until session: ${timeUntilSession.toFixed(3)} horas`);
            
            for (const item of schedule) {
                const { hours_before } = item;
                const timeDiff = Math.abs(timeUntilSession - hours_before);
                
                console.log(`🔍 Item: ${hours_before}h antes, diff: ${timeDiff.toFixed(3)}h`);
                
                if (timeDiff <= 0.1) { // 6 minutos de tolerância
                    console.log(`✅ Deve enviar! (diff <= 0.1h)`);
                    return true;
                }
            }
            
            console.log(`❌ Não deve enviar (nenhum item dentro da tolerância)`);
            return false;
            
        } catch (error) {
            console.log('⚠️ Erro ao processar notification_schedule:', error.message);
            return false;
        }
    }

    /**
     * Enviar notificação para mensalistas
     */
    async sendNotificationToMensalistas(sessao, config) {
        try {
            console.log(`\n📱 Enviando notificação para sessão: ${sessao.games.organization_name}`);
            
            // Buscar mensalistas do jogo
            const { data: mensalistas, error } = await this.supabase
                .from('game_players')
                .select(`
                    player_id,
                    players!inner(
                        id,
                        name,
                        phone_number,
                        type
                    )
                `)
                .eq('game_id', sessao.games.id)
                .eq('status', 'active')
                .eq('players.type', 'monthly')
                .eq('players.status', 'active');
            
            if (error) {
                console.log('❌ Erro ao buscar mensalistas:', error.message);
                return;
            }
            
            if (!mensalistas || mensalistas.length === 0) {
                console.log('📝 Nenhum mensalista encontrado para este jogo');
                return;
            }
            
            const sessionDateTime = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const formattedDate = sessionDateTime.format('DD/MM/YYYY [às] HH:mm');
            
            // Enviar para cada mensalista
            for (const mensalista of mensalistas) {
                const success = await this.sendIndividualNotification(mensalista.players, sessao, formattedDate);
                if (success) {
                    // Log individual da notificação enviada
                    await this.logNotification(sessao, config, mensalista.players);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar notificações:', error);
        }
    }

    /**
     * Enviar notificação individual
     */
    async sendIndividualNotification(player, sessao, formattedDate) {
        try {
            const phoneNumber = `55${player.phone_number}@c.us`;
            
            const message = `🏈 *CONFIRMAÇÃO DE PRESENÇA*\n\n` +
                          `Olá ${player.name}! 👋\n\n` +
                          `Você tem um jogo agendado:\n` +
                          `🎮 *${sessao.games.organization_name}*\n` +
                          `📍 ${sessao.games.location}\n` +
                          `📅 ${formattedDate}\n\n` +
                          `Por favor, confirme sua presença respondendo:\n` +
                          `✅ *SIM* - Estarei presente\n` +
                          `❌ *NÃO* - Não poderei comparecer\n\n` +
                          `Obrigado! 🙏`;
            
            await this.client.sendMessage(phoneNumber, message);
            console.log(`✅ Notificação enviada para: ${player.name} (${player.phone_number})`);
            return true; // Sucesso
            
        } catch (error) {
            console.error(`❌ Erro ao enviar para ${player.name}:`, error.message);
            return false; // Falha
        }
    }

    /**
     * Log da notificação enviada
     */
    async logNotification(sessao, config, player) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .insert({
                    game_id: sessao.game_id,
                    player_id: player.id,
                    type: 'individual_confirmation',
                    title: `Confirmação de presença - ${sessao.games.organization_name}`,
                    message: `Notificação de confirmação enviada para ${player.name} (${player.phone_number})`,
                    sent_at: new Date().toISOString(),
                    status: 'sent'
                });
            
            if (error) {
                console.log('⚠️ Erro ao registrar notificação:', error.message);
            } else {
                console.log(`📝 Notificação registrada no banco para ${player.name} (ID: ${player.id})`);
            }
            
        } catch (error) {
            console.log('⚠️ Erro ao registrar notificação:', error.message);
        }
    }
}

// Executar motor
async function main() {
    const motor = new MotorSimplesNotificacoes();
    
    try {
        await motor.initialize();
        
        // Manter o processo rodando
        process.on('SIGINT', async () => {
            console.log('\n🛑 Parando motor...');
            motor.stopNotificationScheduler();
            await motor.client.destroy();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MotorSimplesNotificacoes;
