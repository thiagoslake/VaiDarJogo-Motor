require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const moment = require('moment');
moment.locale('pt-br');

class VaiDarJogoMotorIndividual {
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
                clientId: "vaidarjogo-motor-individual"
            }),
            puppeteer: puppeteerConfig
        });

        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);

        this.isReady = false;
        this.notificationInterval = null;
        this.mappedGroups = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Iniciando VaiDarJogo Motor Individual...\n');
            
            // Testar conexão com Supabase
            console.log('🔗 Testando conexão com Supabase...');
            
            const { data, error } = await this.supabase
                .from('app_users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.log('⚠️ Aviso: Erro na conexão com Supabase:', error.message);
                console.log('📝 O motor funcionará apenas para mapeamento de grupos\n');
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
            qrcode.generate(qr, { small: true });
        });

        // Cliente pronto
        this.client.on('ready', () => {
            console.log('✅ WhatsApp conectado e pronto!');
            this.isReady = true;
            this.startNotificationScheduler();
        });

        // Bot adicionado a grupo
        this.client.on('group_join', async (notification) => {
            console.log('👥 Bot adicionado ao grupo:', notification.id._serialized);
            await this.mapGroupMembers(notification.id._serialized);
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
     * FUNCIONALIDADE 1: Mapear membros do grupo e gerar arquivo Excel
     */
    async mapGroupMembers(groupId) {
        try {
            console.log(`\n🗺️ Iniciando mapeamento do grupo: ${groupId}`);
            
            // Verificar se o grupo já foi mapeado
            if (this.mappedGroups.has(groupId)) {
                console.log('⚠️ Grupo já foi mapeado anteriormente');
                return;
            }

            // Obter informações do grupo
            const groupInfo = await this.client.getChatById(groupId);
            if (!groupInfo) {
                console.log('❌ Grupo não encontrado');
                return;
            }

            console.log(`📋 Nome do grupo: ${groupInfo.name}`);
            console.log(`👥 Total de participantes: ${groupInfo.participants.length}`);

            // Obter participantes
            let participants = [];
            try {
                participants = groupInfo.participants;
                console.log(`✅ ${participants.length} participantes obtidos`);
            } catch (error) {
                console.error('❌ Erro ao obter participantes:', error);
                return;
            }

            // Mapear participantes
            const mappedMembers = [];
            
            for (const participant of participants) {
                try {
                    // Extrair ID do participante
                    let participantId;
                    if (typeof participant.id === 'string') {
                        participantId = participant.id;
                    } else if (participant.id && participant.id._serialized) {
                        participantId = participant.id._serialized;
                    } else if (participant.id && participant.id.user && participant.id.server) {
                        participantId = `${participant.id.user}@${participant.id.server}`;
                    } else {
                        continue;
                    }

                    // Obter informações do contato
                    let contactName = 'Nome não disponível';
                    try {
                        const contact = await this.client.getContactById(participantId);
                        if (contact) {
                            contactName = contact.name || 
                                         contact.pushname || 
                                         contact.notify || 
                                         contact.shortName ||
                                         contact.formattedName ||
                                         contact.displayName ||
                                         'Nome não disponível';
                        }
                    } catch (error) {
                        console.log(`⚠️ Não foi possível obter contato ${participantId}`);
                    }

                    // Adicionar membro mapeado
                    mappedMembers.push({
                        id: participantId,
                        nome: contactName,
                        isAdmin: participant.isAdmin || false,
                        isSuperAdmin: participant.isSuperAdmin || false,
                        dataMapeamento: moment().format('DD/MM/YYYY HH:mm:ss')
                    });

                } catch (error) {
                    console.log(`⚠️ Erro ao processar participante:`, error.message);
                }
            }

            // Gerar arquivo Excel
            await this.generateExcelFile(groupInfo.name, mappedMembers);
            
            // Marcar grupo como mapeado
            this.mappedGroups.set(groupId, {
                name: groupInfo.name,
                mappedAt: new Date(),
                memberCount: mappedMembers.length
            });

            console.log(`✅ Mapeamento concluído! ${mappedMembers.length} membros mapeados`);

        } catch (error) {
            console.error('❌ Erro no mapeamento do grupo:', error);
        }
    }

    /**
     * Gerar arquivo Excel com membros do grupo
     */
    async generateExcelFile(groupName, members) {
        try {
            // Criar dados para o Excel
            const excelData = members.map(member => ({
                'ID': member.id,
                'Nome': member.nome,
                'Admin': member.isAdmin ? 'Sim' : 'Não',
                'Super Admin': member.isSuperAdmin ? 'Sim' : 'Não',
                'Data Mapeamento': member.dataMapeamento
            }));

            // Criar workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Membros do Grupo');

            // Criar diretório se não existir
            const outputDir = path.join(__dirname, 'exports');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Nome do arquivo
            const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `grupo_${sanitizedGroupName}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
            const filePath = path.join(outputDir, fileName);

            // Salvar arquivo
            XLSX.writeFile(workbook, filePath);

            console.log(`📊 Arquivo Excel gerado: ${fileName}`);
            console.log(`📁 Local: ${filePath}`);

        } catch (error) {
            console.error('❌ Erro ao gerar arquivo Excel:', error);
        }
    }

    /**
     * FUNCIONALIDADE 2: Agendador de notificações individuais (a cada 10 segundos)
     */
    startNotificationScheduler() {
        console.log('⏰ Iniciando agendador de notificações individuais...');
        
        this.notificationInterval = setInterval(async () => {
            try {
                await this.checkAndSendIndividualNotifications();
            } catch (error) {
                console.error('❌ Erro no agendador de notificações:', error);
            }
        }, 10000); // 10 segundos

        console.log('✅ Agendador iniciado (verificação a cada 10 segundos)');
    }

    stopNotificationScheduler() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
            console.log('⏹️ Agendador de notificações parado');
        }
    }

    /**
     * Verificar se precisa enviar notificações individuais
     */
    async checkAndSendIndividualNotifications() {
        try {
            // Buscar jogos com notificações pendentes
            const gamesWithNotifications = await this.getGamesWithPendingIndividualNotifications();
            
            if (gamesWithNotifications.length === 0) {
                return; // Nenhuma notificação pendente
            }

            console.log(`🔔 ${gamesWithNotifications.length} jogos com notificações pendentes`);

            for (const game of gamesWithNotifications) {
                await this.sendIndividualGameNotifications(game);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar notificações:', error);
        }
    }

    /**
     * Buscar jogos com notificações pendentes - CORRIGIDO para notificações individuais
     */
    async getGamesWithPendingIndividualNotifications() {
        try {
            const now = moment();
            
            // Buscar jogos usando a estrutura CORRETA do schema atual
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
                            notification_schedule,
                            is_active
                        )
                    )
                `)
                .eq('game_sessions.status', 'scheduled')
                .eq('game_sessions.notification_configs.is_active', true)
                .gte('game_sessions.session_date', now.format('YYYY-MM-DD'));
            
            if (error) {
                console.log('⚠️ Erro ao buscar jogos:', error.message);
                return [];
            }
            
            // Filtrar jogos que precisam de notificação
            const gamesToNotify = [];
            
            for (const game of games || []) {
                for (const session of game.game_sessions || []) {
                    for (const config of session.notification_configs || []) {
                        const sessionDateTime = moment(`${session.session_date} ${session.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                        const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                        
                        // Verificar se está no horário de notificar usando o notification_schedule
                        if (this.shouldSendNotification(config, timeUntilSession)) {
                            gamesToNotify.push({
                                game_id: game.id,
                                game_name: game.organization_name,
                                organization_name: game.organization_name,
                                location: game.location,
                                session_id: session.id,
                                session_date: session.session_date,
                                session_time: session.start_time,
                                notification_config_id: config.id,
                                notification_type: config.notification_type,
                                total_notifications: config.total_notifications,
                                mensal_notifications: config.mensal_notifications,
                                notification_schedule: config.notification_schedule
                            });
                        }
                    }
                }
            }

            return gamesToNotify;

        } catch (error) {
            console.error('❌ Erro ao buscar jogos com notificações:', error);
            return [];
        }
    }

    /**
     * Verificar se deve enviar notificação
     */
    shouldSendNotification(config, timeUntilSession) {
        const { notification_schedule, notification_type } = config;
        
        try {
            // Parse do JSON notification_schedule
            const schedule = Array.isArray(notification_schedule) ? notification_schedule : JSON.parse(notification_schedule);
            
            // Verificar cada item do cronograma
            for (const item of schedule) {
                const { hours_before, target, message_type } = item;
                
                // Calcular diferença de tempo
                const timeDiff = Math.abs(timeUntilSession - hours_before);
                
                // Se está dentro de 30 minutos do horário programado
                if (timeDiff <= 0.5) {
                    console.log(`⏰ Horário de notificação detectado: ${hours_before}h antes, target: ${target}, tipo: ${message_type}`);
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.log('⚠️ Erro ao processar notification_schedule:', error.message);
            return false;
        }
    }

    /**
     * Enviar notificações individuais do jogo
     */
    async sendIndividualGameNotifications(game) {
        try {
            const { game_id, game_name, organization_name, location, session_date, session_time } = game;
            
            const sessionDateTime = moment(`${session_date} ${session_time}`, 'YYYY-MM-DD HH:mm:ss');
            const formattedDate = sessionDateTime.format('DD/MM/YYYY [às] HH:mm');
            
            // Buscar mensalistas do jogo
            const mensalistas = await this.getMensalistasDoJogo(game_id);
            
            if (mensalistas.length === 0) {
                console.log(`⚠️ Nenhum mensalista encontrado para o jogo: ${game_name}`);
                return;
            }
            
            console.log(`📱 Enviando notificações para ${mensalistas.length} mensalistas do jogo: ${game_name}`);
            
            // Enviar notificação para cada mensalista
            for (const mensalista of mensalistas) {
                await this.sendIndividualNotification(mensalista, game, formattedDate);
            }
            
            // Marcar notificação como enviada
            await this.markNotificationAsSent(game);

        } catch (error) {
            console.error('❌ Erro ao enviar notificações individuais:', error);
        }
    }

    /**
     * Buscar mensalistas do jogo
     */
    async getMensalistasDoJogo(gameId) {
        try {
            const { data: mensalistas, error } = await this.supabase
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
                .eq('game_id', gameId)
                .eq('status', 'active')
                .eq('players.type', 'monthly')
                .eq('players.status', 'active');
            
            if (error) {
                console.log('⚠️ Erro ao buscar mensalistas:', error.message);
                return [];
            }
            
            return mensalistas || [];
            
        } catch (error) {
            console.error('❌ Erro ao buscar mensalistas:', error);
            return [];
        }
    }

    /**
     * Enviar notificação individual
     */
    async sendIndividualNotification(mensalista, game, formattedDate) {
        try {
            const { players } = mensalista;
            const { game_name, organization_name, location } = game;
            
            // Formatar número do telefone para WhatsApp
            const phoneNumber = this.formatPhoneForWhatsApp(players.phone_number);
            
            if (!phoneNumber) {
                console.log(`⚠️ Número de telefone inválido para ${players.name}: ${players.phone_number}`);
                return;
            }
            
            // Gerar mensagem personalizada
            const message = this.generateIndividualMessage(players.name, game_name, formattedDate, location);
            
            // Enviar mensagem via WhatsApp
            await this.client.sendMessage(phoneNumber, message);
            
            console.log(`✅ Notificação enviada para ${players.name} (${phoneNumber})`);
            
            // Salvar log da notificação individual
            await this.saveIndividualNotificationLog(players, game, message);
            
        } catch (error) {
            console.error(`❌ Erro ao enviar notificação para ${mensalista.players.name}:`, error);
        }
    }

    /**
     * Formatar número de telefone para WhatsApp
     */
    formatPhoneForWhatsApp(phoneNumber) {
        try {
            // Remover caracteres não numéricos
            let cleanNumber = phoneNumber.replace(/\D/g, '');
            
            // Se começar com 55 (Brasil), manter
            if (cleanNumber.startsWith('55')) {
                return cleanNumber + '@c.us';
            }
            
            // Se começar com 0, remover
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }
            
            // Adicionar código do Brasil se não tiver
            if (!cleanNumber.startsWith('55')) {
                cleanNumber = '55' + cleanNumber;
            }
            
            return cleanNumber + '@c.us';
            
        } catch (error) {
            console.error('❌ Erro ao formatar número:', error);
            return null;
        }
    }

    /**
     * Gerar mensagem individual personalizada
     */
    generateIndividualMessage(playerName, gameName, formattedDate, location) {
        const message = `🏈 *Olá ${playerName}!*\n\n` +
                       `📅 *Jogo: ${gameName}*\n` +
                       `📅 Data: ${formattedDate}\n` +
                       `📍 Local: ${location}\n\n` +
                       `⚽ *Confirme sua presença no jogo!*\n\n` +
                       `📱 Responda:\n` +
                       `✅ SIM - para confirmar presença\n` +
                       `❌ NÃO - para informar ausência\n\n` +
                       `🔔 Esta é uma notificação automática do sistema VaiDarJogo.`;
        
        return message;
    }

    /**
     * Salvar log da notificação individual
     */
    async saveIndividualNotificationLog(player, game, message) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    game_id: game.game_id,
                    title: `Notificação Individual: ${player.name}`,
                    message: message,
                    type: 'individual_confirmation',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });

            if (error) {
                console.log('⚠️ Erro ao salvar log de notificação individual:', error.message);
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar log de notificação individual:', error);
        }
    }

    /**
     * Marcar notificação como enviada
     */
    async markNotificationAsSent(game) {
        try {
            // Criar log de notificação (se a tabela existir)
            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    game_id: game.game_id,
                    title: `Lembrete: ${game.game_name}`,
                    message: `Jogo agendado para ${moment(`${game.session_date} ${game.session_time}`, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY [às] HH:mm')}`,
                    type: 'game_reminder',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });

            if (error) {
                console.log('⚠️ Erro ao salvar log de notificação:', error.message);
            } else {
                console.log(`✅ Notificação marcada como enviada para o jogo: ${game.game_name}`);
            }

        } catch (error) {
            console.error('❌ Erro ao marcar notificação como enviada:', error);
        }
    }

    /**
     * Parar o motor
     */
    async stop() {
        console.log('🛑 Parando VaiDarJogo Motor Individual...');
        
        this.stopNotificationScheduler();
        
        if (this.client) {
            await this.client.destroy();
        }
        
        console.log('✅ Motor parado');
    }
}

// Inicializar motor
async function startMotor() {
    const motor = new VaiDarJogoMotorIndividual();
    
    try {
        await motor.initialize();
        
        // Manter o processo rodando
        process.on('SIGINT', async () => {
            console.log('\n🛑 Recebido SIGINT, parando motor...');
            await motor.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Recebido SIGTERM, parando motor...');
            await motor.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro fatal ao inicializar motor:', error);
        process.exit(1);
    }
}

// Iniciar motor se este arquivo for executado diretamente
if (require.main === module) {
    startMotor();
}

module.exports = VaiDarJogoMotorIndividual;
