const moment = require('moment');
moment.locale('pt-br');

class NotificationController {
    constructor(database, whatsappClient) {
        this.db = database;
        this.client = whatsappClient;
    }
    
    async createNotificationConfig(configData) {
        try {
            // Validar dados
            if (!configData.session_id || !configData.notification_type) {
                throw new Error('Dados obrigatórios não fornecidos');
            }
            
            // Buscar informações da sessão
            const session = await this.db.get(
                'SELECT gs.*, g.organization_name, g.location FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [configData.session_id]
            );
            
            if (!session) {
                throw new Error('Sessão não encontrada');
            }
            
            // Criar configuração
            const result = await this.db.createNotificationConfig({
                game_id: session.game_id,
                session_id: configData.session_id,
                notification_type: configData.notification_type,
                total_notifications: configData.total_notifications || 3,
                first_notification_time: configData.first_notification_time,
                notification_interval_hours: configData.notification_interval_hours || 24,
                mensal_notifications: configData.mensal_notifications || 1,
                group_chat_id: configData.group_chat_id || null
            });
            
            // Criar confirmações pendentes para todos os jogadores
            await this.initializeParticipations(configData.session_id);
            
            return result;
        } catch (error) {
            console.error('Erro ao criar configuração de notificação:', error);
            throw error;
        }
    }
    
    async initializeParticipations(sessionId) {
        try {
            // Buscar todos os jogadores ativos
            const players = await this.db.all('SELECT id FROM players WHERE status = "active"');
            
            // Criar confirmações pendentes para cada jogador
            for (const player of players) {
                await this.db.confirmParticipation(sessionId, player.id, 'pending');
            }
            
            console.log(`${players.length} confirmações pendentes criadas para a sessão ${sessionId}`);
        } catch (error) {
            console.error('Erro ao inicializar participações:', error);
        }
    }
    
    async sendNotification(notificationConfig, notificationNumber) {
        try {
            const config = await this.db.getNotificationConfig(notificationConfig.session_id);
            if (!config) {
                throw new Error('Configuração de notificação não encontrada');
            }
            
            const session = await this.db.get(
                'SELECT gs.*, g.organization_name, g.location FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [config.session_id]
            );
            
            // Determinar tipo de destinatário baseado no número da notificação
            let targetType = 'mensal';
            if (notificationNumber > config.mensal_notifications) {
                targetType = 'avulso';
            }
            
            // Buscar jogadores baseado no tipo
            let players = [];
            if (targetType === 'mensal') {
                players = await this.db.all(
                    'SELECT * FROM players WHERE type = "monthly" AND status = "active"'
                );
            } else {
                players = await this.db.all(
                    'SELECT * FROM players WHERE type = "casual" AND status = "active"'
                );
            }
            
            // Criar mensagem
            const message = await this.createNotificationMessage(session, notificationNumber, targetType);
            
            // Enviar notificações individuais
            let sentCount = 0;
            for (const player of players) {
                try {
                    await this.sendIndividualNotification(player.phone_number, message);
                    sentCount++;
                    
                    // Aguardar um pouco entre mensagens para evitar spam
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Erro ao enviar notificação para ${player.name}:`, error);
                }
            }
            
            // Enviar notificação no grupo se configurado
            if (config.notification_type === 'group' || config.notification_type === 'both') {
                if (config.group_chat_id) {
                    try {
                        await this.sendGroupNotification(config.group_chat_id, message);
                    } catch (error) {
                        console.error('Erro ao enviar notificação no grupo:', error);
                    }
                }
            }
            
            // Registrar notificação enviada
            await this.db.logNotificationSent(
                config.id,
                notificationNumber,
                targetType,
                message
            );
            
            console.log(`Notificação ${notificationNumber} enviada para ${sentCount} jogadores (${targetType})`);
            
            return { sentCount, targetType };
            
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            throw error;
        }
    }
    
    async createNotificationMessage(session, notificationNumber, targetType) {
        const sessionDate = new Date(session.session_date);
        const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let message = `⚽ *NOTIFICAÇÃO DE JOGO* ⚽\n\n`;
        message += `🏢 *${session.organization_name}*\n`;
        message += `📍 *Local:* ${session.location}\n`;
        message += `📅 *Data:* ${formattedDate}\n`;
        message += `⏰ *Horário:* ${session.start_time} - ${session.end_time}\n\n`;
        
        if (notificationNumber === 1) {
            message += `🎯 *Primeira chamada para ${targetType === 'mensal' ? 'mensalistas' : 'jogadores avulsos'}!*\n\n`;
        } else {
            message += `🔄 *${notificationNumber}ª chamada para ${targetType === 'mensal' ? 'mensalistas' : 'jogadores avulsos'}*\n\n`;
        }
        
        message += `✅ *Para confirmar participação:*\n`;
        message += `Digite: "confirmar ${session.id}"\n\n`;
        message += `❌ *Para recusar:*\n`;
        message += `Digite: "recusar ${session.id}"\n\n`;
        
        message += `📊 *Status atual:*\n`;
        message += `Jogadores confirmados: ${await this.getConfirmedCount(session.id)}\n`;
        message += `Vagas restantes: ${await this.getRemainingSlots(session.id)}\n`;
        
        // Verificar se há goleiros confirmados
        const hasGoalkeeper = await this.checkIfHasGoalkeeper(session.id);
        if (!hasGoalkeeper) {
            // Buscar número de times para mostrar quantas vagas estão reservadas
            const gameInfo = await this.db.get(
                'SELECT g.number_of_teams FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [session.id]
            );
            const reservedSlots = gameInfo ? gameInfo.number_of_teams : 1;
            message += `🥅 *Nota:* ${reservedSlots} vaga(s) de jogadores de linha reservada(s) para goleiro(s). Vagas de reservas sempre liberadas.\n`;
        }
        
        message += `\n`;
        
        message += `⚡ *Responda rapidamente para garantir sua vaga!*`;
        
        return message;
    }
    
    async sendIndividualNotification(phoneNumber, message) {
        try {
            const chatId = `${phoneNumber}@c.us`;
            await this.client.sendMessage(chatId, message);
        } catch (error) {
            console.error(`Erro ao enviar mensagem individual para ${phoneNumber}:`, error);
            throw error;
        }
    }
    
    async sendGroupNotification(groupChatId, message) {
        try {
            await this.client.sendMessage(groupChatId, message);
        } catch (error) {
            console.error(`Erro ao enviar mensagem no grupo ${groupChatId}:`, error);
            throw error;
        }
    }
    
    async handleConfirmation(phoneNumber, sessionId, status, notes = null) {
        try {
            // Buscar jogador pelo telefone
            const player = await this.db.get(
                'SELECT * FROM players WHERE phone_number = ? AND status = "active"',
                [phoneNumber]
            );
            
            if (!player) {
                throw new Error('Jogador não encontrado');
            }
            
            // Buscar sessão
            const session = await this.db.get(
                'SELECT gs.*, g.players_per_team, g.substitutes_per_team, g.number_of_teams FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [sessionId]
            );
            
            if (!session) {
                throw new Error('Sessão não encontrada');
            }
            
            // Calcular vagas disponíveis
            const maxPlayers = (session.players_per_team + session.substitutes_per_team) * session.number_of_teams;
            const maxLinePlayers = session.players_per_team * session.number_of_teams; // Apenas jogadores de linha
            const maxReserves = session.substitutes_per_team * session.number_of_teams; // Apenas reservas
            const confirmedPlayers = await this.db.getConfirmedPlayers(sessionId);
            const currentCount = confirmedPlayers.length;
            
            if (status === 'confirmed') {
                // Verificar se há goleiros confirmados
                const hasGoalkeeper = await this.checkIfHasGoalkeeper(sessionId);
                
                // Calcular vagas efetivamente disponíveis
                let effectiveMaxPlayers = maxPlayers;
                if (!hasGoalkeeper) {
                    // Reservar vagas para goleiros apenas nas vagas de jogadores de linha
                    // As vagas de reservas sempre ficam liberadas
                    effectiveMaxPlayers = maxLinePlayers - session.number_of_teams + maxReserves;
                }
                
                if (currentCount >= effectiveMaxPlayers) {
                    // Adicionar à lista de espera
                    await this.db.addToWaitingList(sessionId, player.id);
                    await this.db.confirmParticipation(sessionId, player.id, 'confirmed', notes);
                    
                    let message = `✅ Confirmação registrada! Você foi adicionado à lista de espera (posição ${await this.getWaitingListPosition(sessionId, player.id)})`;
                    
                    if (!hasGoalkeeper) {
                        message += `\n\n🥅 *Nota:* ${session.number_of_teams} vaga(s) de jogadores de linha reservada(s) para goleiro(s). Vagas de reservas sempre liberadas.`;
                    }
                    
                    return {
                        success: true,
                        message: message,
                        addedToWaitingList: true
                    };
                } else {
                    // Confirmar participação normalmente
                    await this.db.confirmParticipation(sessionId, player.id, 'confirmed', notes);
                    
                    let message = `✅ Participação confirmada! Você está na lista de jogadores para o jogo.`;
                    
                    if (!hasGoalkeeper && player.primary_position !== 'Goleiro') {
                        message += `\n\n🥅 *Nota:* ${session.number_of_teams} vaga(s) de jogadores de linha reservada(s) para goleiro(s). Vagas de reservas sempre liberadas.`;
                    }
                    
                    return {
                        success: true,
                        message: message,
                        addedToWaitingList: false
                    };
                }
            } else if (status === 'declined') {
                await this.db.confirmParticipation(sessionId, player.id, 'declined', notes);
                
                // Remover da lista de espera se estiver lá
                await this.db.removeFromWaitingList(sessionId, player.id);
                
                return {
                    success: true,
                    message: `❌ Participação recusada registrada. Obrigado por informar!`,
                    addedToWaitingList: false
                };
            }
            
        } catch (error) {
            console.error('Erro ao processar confirmação:', error);
            throw error;
        }
    }
    
    async checkIfHasGoalkeeper(sessionId) {
        try {
            // Buscar número de times da sessão
            const session = await this.db.get(
                'SELECT g.number_of_teams FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [sessionId]
            );
            
            if (!session) return false;
            
            // Buscar jogadores confirmados que são goleiros
            const result = await this.db.get(
                `SELECT COUNT(*) as count 
                 FROM participations p 
                 JOIN players pl ON p.player_id = pl.id 
                 WHERE p.session_id = ? 
                 AND p.status = 'confirmed' 
                 AND pl.primary_position = 'Goleiro'`,
                [sessionId]
            );
            
            // Verificar se há pelo menos 1 goleiro por time
            return result.count >= session.number_of_teams;
        } catch (error) {
            console.error('Erro ao verificar goleiros confirmados:', error);
            return false;
        }
    }
    
    async getWaitingListPosition(sessionId, playerId) {
        try {
            const waiting = await this.db.get(
                'SELECT position FROM waiting_list WHERE session_id = ? AND player_id = ?',
                [sessionId, playerId]
            );
            return waiting ? waiting.position : null;
        } catch (error) {
            console.error('Erro ao buscar posição na lista de espera:', error);
            return null;
        }
    }
    
    async getConfirmedCount(sessionId) {
        try {
            const result = await this.db.getPlayerCountForSession(sessionId);
            return result.confirmed;
        } catch (error) {
            console.error('Erro ao contar confirmados:', error);
            return 0;
        }
    }
    
    async getRemainingSlots(sessionId) {
        try {
            const session = await this.db.get(
                'SELECT g.players_per_team, g.substitutes_per_team, g.number_of_teams FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [sessionId]
            );
            
            if (!session) return 0;
            
            const maxPlayers = (session.players_per_team + session.substitutes_per_team) * session.number_of_teams;
            const maxLinePlayers = session.players_per_team * session.number_of_teams; // Apenas jogadores de linha
            const maxReserves = session.substitutes_per_team * session.number_of_teams; // Apenas reservas
            const confirmedCount = await this.getConfirmedCount(sessionId);
            const hasGoalkeeper = await this.checkIfHasGoalkeeper(sessionId);
            
            // Calcular vagas efetivamente disponíveis
            let effectiveMaxPlayers = maxPlayers;
            if (!hasGoalkeeper) {
                // Reservar vagas para goleiros apenas nas vagas de jogadores de linha
                // As vagas de reservas sempre ficam liberadas
                effectiveMaxPlayers = maxLinePlayers - session.number_of_teams + maxReserves;
            }
            
            return Math.max(0, effectiveMaxPlayers - confirmedCount);
        } catch (error) {
            console.error('Erro ao calcular vagas restantes:', error);
            return 0;
        }
    }
    
    async getNotificationStatus(sessionId) {
        try {
            const config = await this.db.getNotificationConfig(sessionId);
            if (!config) return null;
            
            const playerCounts = await this.db.getPlayerCountForSession(sessionId);
            const waitingList = await this.db.getWaitingList(sessionId);
            const session = await this.db.get(
                'SELECT gs.*, g.organization_name, g.location FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id = ?',
                [sessionId]
            );
            
            // Verificar se há goleiros confirmados
            const hasGoalkeeper = await this.checkIfHasGoalkeeper(sessionId);
            
            return {
                config,
                session,
                playerCounts,
                waitingList,
                remainingSlots: await this.getRemainingSlots(sessionId),
                hasGoalkeeper
            };
        } catch (error) {
            console.error('Erro ao buscar status da notificação:', error);
            throw error;
        }
    }
    
    async scheduleNotifications(notificationConfig) {
        try {
            const config = await this.db.getNotificationConfig(notificationConfig.session_id);
            if (!config) {
                throw new Error('Configuração de notificação não encontrada');
            }
            
            // Calcular horários das notificações
            const firstNotificationTime = moment(config.first_notification_time, 'HH:mm');
            const sessionDate = moment(config.session_date);
            
            // Agendar notificações
            for (let i = 1; i <= config.total_notifications; i++) {
                const notificationTime = firstNotificationTime.clone().subtract(
                    (config.total_notifications - i) * config.notification_interval_hours,
                    'hours'
                );
                
                // Agendar notificação
                setTimeout(async () => {
                    try {
                        await this.sendNotification(config, i);
                    } catch (error) {
                        console.error(`Erro ao enviar notificação agendada ${i}:`, error);
                    }
                }, notificationTime.diff(moment()));
            }
            
            console.log(`${config.total_notifications} notificações agendadas para a sessão ${config.session_id}`);
            
        } catch (error) {
            console.error('Erro ao agendar notificações:', error);
            throw error;
        }
    }
}

module.exports = NotificationController;
