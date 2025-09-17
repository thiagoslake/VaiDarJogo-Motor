const moment = require('moment');
moment.locale('pt-br');

class AutoConfirmationService {
    constructor(database, notificationController) {
        this.db = database;
        this.notificationController = notificationController;
    }

    /**
     * Gera automaticamente confirmações para a próxima sessão do jogo
     */
    async generateAutoConfirmations(gameId = null) {
        try {
            console.log('🚀 Iniciando geração automática de confirmações...');

            // Buscar próxima sessão
            const nextSession = await this.getNextSession(gameId);
            if (!nextSession) {
                throw new Error('Nenhuma sessão futura encontrada');
            }

            console.log(`📅 Próxima sessão encontrada: ${nextSession.session_date} às ${nextSession.start_time}`);

            // Verificar se já existe configuração para esta sessão
            const existingConfig = await this.db.getNotificationConfig(nextSession.id);
            if (existingConfig) {
                console.log('⚠️ Configuração já existe para esta sessão');
                return {
                    success: false,
                    message: 'Configuração de confirmação já existe para esta sessão',
                    session: nextSession
                };
            }

            // Criar configuração automática
            const autoConfig = await this.createAutoNotificationConfig(nextSession);
            
            // Agendar notificações
            await this.notificationController.scheduleNotifications(autoConfig);

            console.log('✅ Confirmações automáticas geradas com sucesso!');

            return {
                success: true,
                message: 'Confirmações automáticas geradas com sucesso',
                session: nextSession,
                config: autoConfig
            };

        } catch (error) {
            console.error('❌ Erro ao gerar confirmações automáticas:', error);
            throw error;
        }
    }

    /**
     * Busca a próxima sessão do jogo
     */
    async getNextSession(gameId = null) {
        try {
            let query = this.db.supabase
                .from('game_sessions')
                .select(`
                    *,
                    games (
                        id,
                        organization_name,
                        location,
                        start_time,
                        end_time,
                        players_per_team,
                        substitutes_per_team,
                        number_of_teams,
                        frequency,
                        day_of_week
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(1);

            if (gameId) {
                query = query.eq('game_id', gameId);
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Erro ao buscar próxima sessão: ${error.message}`);
            }

            return data && data.length > 0 ? data[0] : null;

        } catch (error) {
            console.error('Erro ao buscar próxima sessão:', error);
            throw error;
        }
    }

    /**
     * Cria configuração automática de notificação baseada no tipo de jogo
     */
    async createAutoNotificationConfig(session) {
        try {
            const game = session.games;
            
            // Determinar configuração baseada na frequência do jogo
            let configData;
            
            if (game.frequency === 'Diária') {
                configData = this.getDailyGameConfig();
            } else if (game.frequency === 'Semanal') {
                configData = this.getWeeklyGameConfig();
            } else if (game.frequency === 'Mensal') {
                configData = this.getMonthlyGameConfig();
            } else {
                // Jogo avulso ou frequência não definida
                configData = this.getDefaultGameConfig();
            }

            // Criar configuração no banco
            const notificationConfig = await this.db.createNotificationConfig({
                session_id: session.id,
                game_id: game.id,
                total_notifications: configData.total_notifications,
                mensal_notifications: configData.mensal_notifications,
                notification_type: configData.notification_type,
                whatsapp_group_id: configData.whatsapp_group_id,
                notification_schedule: configData.notification_schedule,
                is_active: true
            });

            console.log(`📋 Configuração automática criada para sessão ${session.id}`);
            return notificationConfig;

        } catch (error) {
            console.error('Erro ao criar configuração automática:', error);
            throw error;
        }
    }

    /**
     * Configuração para jogos diários
     */
    getDailyGameConfig() {
        return {
            total_notifications: 2,
            mensal_notifications: 1,
            notification_type: 'individual',
            whatsapp_group_id: null,
            notification_schedule: [
                {
                    number: 1,
                    hours_before: 6,
                    target: "mensalistas",
                    message_type: "confirmation"
                },
                {
                    number: 2,
                    hours_before: 2,
                    target: "todos",
                    message_type: "final_confirmation"
                }
            ]
        };
    }

    /**
     * Configuração para jogos semanais
     */
    getWeeklyGameConfig() {
        return {
            total_notifications: 3,
            mensal_notifications: 2,
            notification_type: 'individual',
            whatsapp_group_id: null,
            notification_schedule: [
                {
                    number: 1,
                    hours_before: 24, // 24 horas antes
                    target: "mensalistas",
                    message_type: "confirmation"
                },
                {
                    number: 2,
                    hours_before: 12, // 12 horas antes
                    target: "mensalistas",
                    message_type: "reminder"
                },
                {
                    number: 3,
                    hours_before: 7, // 7 horas antes
                    target: "todos",
                    message_type: "final_confirmation"
                }
            ]
        };
    }

    /**
     * Configuração para jogos mensais
     */
    getMonthlyGameConfig() {
        return {
            total_notifications: 3,
            mensal_notifications: 2,
            notification_type: 'individual',
            whatsapp_group_id: null,
            notification_schedule: [
                {
                    number: 1,
                    hours_before: 24, // 24 horas antes
                    target: "mensalistas",
                    message_type: "confirmation"
                },
                {
                    number: 2,
                    hours_before: 12, // 12 horas antes
                    target: "mensalistas",
                    message_type: "reminder"
                },
                {
                    number: 3,
                    hours_before: 7, // 7 horas antes
                    target: "todos",
                    message_type: "final_confirmation"
                }
            ]
        };
    }

    /**
     * Configuração padrão para jogos avulsos
     */
    getDefaultGameConfig() {
        return {
            total_notifications: 3,
            mensal_notifications: 2,
            notification_type: 'individual',
            whatsapp_group_id: null,
            notification_schedule: [
                {
                    number: 1,
                    hours_before: 24, // 24 horas antes
                    target: "mensalistas",
                    message_type: "confirmation"
                },
                {
                    number: 2,
                    hours_before: 12, // 12 horas antes
                    target: "mensalistas",
                    message_type: "reminder"
                },
                {
                    number: 3,
                    hours_before: 7, // 7 horas antes
                    target: "todos",
                    message_type: "final_confirmation"
                }
            ]
        };
    }

    /**
     * Gera confirmações para todas as sessões futuras de um jogo
     */
    async generateConfirmationsForAllFutureSessions(gameId) {
        try {
            console.log(`🚀 Gerando confirmações para todas as sessões futuras do jogo ${gameId}...`);

            // Buscar todas as sessões futuras
            const { data: sessions, error } = await this.db.supabase
                .from('game_sessions')
                .select(`
                    *,
                    games (
                        id,
                        organization_name,
                        location,
                        start_time,
                        end_time,
                        players_per_team,
                        substitutes_per_team,
                        number_of_teams,
                        frequency,
                        day_of_week
                    )
                `)
                .eq('game_id', gameId)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'))
                .order('session_date', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar sessões futuras: ${error.message}`);
            }

            if (!sessions || sessions.length === 0) {
                return {
                    success: false,
                    message: 'Nenhuma sessão futura encontrada para este jogo'
                };
            }

            const results = [];
            let successCount = 0;

            for (const session of sessions) {
                try {
                    // Verificar se já existe configuração
                    const existingConfig = await this.db.getNotificationConfig(session.id);
                    if (existingConfig) {
                        console.log(`⚠️ Configuração já existe para sessão ${session.session_date}`);
                        results.push({
                            session_date: session.session_date,
                            status: 'skipped',
                            message: 'Configuração já existe'
                        });
                        continue;
                    }

                    // Criar configuração automática
                    const autoConfig = await this.createAutoNotificationConfig(session);
                    
                    // Agendar notificações
                    await this.notificationController.scheduleNotifications(autoConfig);

                    successCount++;
                    results.push({
                        session_date: session.session_date,
                        status: 'success',
                        message: 'Configuração criada com sucesso'
                    });

                    console.log(`✅ Confirmação gerada para sessão ${session.session_date}`);

                } catch (error) {
                    console.error(`❌ Erro ao gerar confirmação para sessão ${session.session_date}:`, error);
                    results.push({
                        session_date: session.session_date,
                        status: 'error',
                        message: error.message
                    });
                }
            }

            return {
                success: true,
                message: `Confirmações geradas: ${successCount}/${sessions.length} sessões`,
                total_sessions: sessions.length,
                success_count: successCount,
                results: results
            };

        } catch (error) {
            console.error('❌ Erro ao gerar confirmações para todas as sessões:', error);
            throw error;
        }
    }

    /**
     * Verifica se há sessões sem configuração de confirmação
     */
    async checkUnconfiguredSessions(gameId = null) {
        try {
            let query = this.db.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games (
                        id,
                        organization_name,
                        frequency
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'))
                .order('session_date', { ascending: true });

            if (gameId) {
                query = query.eq('game_id', gameId);
            }

            const { data: sessions, error } = await query;

            if (error) {
                throw new Error(`Erro ao buscar sessões: ${error.message}`);
            }

            const unconfiguredSessions = [];

            for (const session of sessions) {
                const config = await this.db.getNotificationConfig(session.id);
                if (!config) {
                    unconfiguredSessions.push(session);
                }
            }

            return {
                total_sessions: sessions.length,
                unconfigured_count: unconfiguredSessions.length,
                unconfigured_sessions: unconfiguredSessions
            };

        } catch (error) {
            console.error('Erro ao verificar sessões não configuradas:', error);
            throw error;
        }
    }
}

module.exports = AutoConfirmationService;
