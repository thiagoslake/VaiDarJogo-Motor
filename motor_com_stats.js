require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const moment = require('moment');
moment.locale('pt-br');

class VaiDarJogoMotorComStats {
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
                clientId: "vaidarjogo-motor-stats"
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
            console.log('🚀 Iniciando VaiDarJogo Motor com Estatísticas...\n');
            
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
     * FUNCIONALIDADE 2: Agendador de notificações (a cada 10 segundos)
     */
    startNotificationScheduler() {
        console.log('⏰ Iniciando agendador de notificações...');
        
        this.notificationInterval = setInterval(async () => {
            try {
                await this.checkAndSendNotifications();
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
     * Verificar se precisa enviar notificações
     */
    async checkAndSendNotifications() {
        try {
            // Buscar jogos com notificações pendentes
            const gamesWithNotifications = await this.getGamesWithPendingNotifications();
            
            if (gamesWithNotifications.length === 0) {
                return; // Nenhuma notificação pendente
            }

            console.log(`🔔 ${gamesWithNotifications.length} jogos com notificações pendentes`);

            for (const game of gamesWithNotifications) {
                await this.sendGameNotification(game);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar notificações:', error);
        }
    }

    /**
     * Buscar jogos com notificações pendentes
     */
    async getGamesWithPendingNotifications() {
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
                                whatsapp_group_id: config.whatsapp_group_id,
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
     * Enviar notificação do jogo
     */
    async sendGameNotification(game) {
        try {
            const { game_name, organization_name, location, session_date, session_time, whatsapp_group_id } = game;
            
            const sessionDateTime = moment(`${session_date} ${session_time}`, 'YYYY-MM-DD HH:mm:ss');
            const formattedDate = sessionDateTime.format('DD/MM/YYYY [às] HH:mm');
            
            const message = `🏈 *${game_name}*\n\n` +
                          `📅 Data: ${formattedDate}\n` +
                          `🏢 Organização: ${organization_name}\n` +
                          `📍 Local: ${location}\n\n` +
                          `⚽ Confirme sua presença!`;

            // Enviar para o grupo se especificado
            if (whatsapp_group_id) {
                await this.client.sendMessage(whatsapp_group_id, message);
                console.log(`📤 Notificação enviada para o grupo: ${whatsapp_group_id}`);
            } else {
                console.log('⚠️ WhatsApp group ID não especificado para esta notificação');
            }

            // Marcar notificação como enviada
            await this.markNotificationAsSent(game);

        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
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
     * FUNCIONALIDADE 3: COMANDO DE ESTATÍSTICAS
     */
    async showStatistics() {
        try {
            console.log('\n📊 ===== ESTATÍSTICAS DO MOTOR =====\n');
            
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

    /**
     * Parar o motor
     */
    async stop() {
        console.log('🛑 Parando VaiDarJogo Motor com Estatísticas...');
        
        this.stopNotificationScheduler();
        
        if (this.client) {
            await this.client.destroy();
        }
        
        console.log('✅ Motor parado');
    }
}

// Função para executar comando de estatísticas
async function runStatsCommand() {
    const motor = new VaiDarJogoMotorComStats();
    
    try {
        // Inicializar apenas a conexão com Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';
        
        motor.supabase = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseAnonKey);
        
        // Mostrar estatísticas
        await motor.showStatistics();
        
    } catch (error) {
        console.error('❌ Erro ao executar comando de estatísticas:', error);
    }
}

// Inicializar motor
async function startMotor() {
    const motor = new VaiDarJogoMotorComStats();
    
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

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--stats') || args.includes('-s')) {
    // Executar apenas comando de estatísticas
    runStatsCommand();
} else {
    // Iniciar motor completo
    startMotor();
}

module.exports = VaiDarJogoMotorComStats;
