const moment = require('moment');
moment.locale('pt-br');

class SessionRecreationService {
    constructor(database) {
        this.db = database;
    }

    /**
     * Recria todas as sessões de um jogo baseado nos dados atuais
     */
    async recreateGameSessions(gameId) {
        try {
            console.log(`🔄 Iniciando recriação de sessões para o jogo ${gameId}...`);

            // Buscar dados atuais do jogo
            const game = await this.getGameData(gameId);
            if (!game) {
                throw new Error('Jogo não encontrado');
            }

            // Remover todas as sessões existentes
            const removedCount = await this.removeAllGameSessions(gameId);
            console.log(`🗑️ Removidas ${removedCount} sessões existentes`);

            // Criar novas sessões baseadas nos dados atuais
            const newSessions = await this.createNewSessions(game);
            console.log(`✅ Criadas ${newSessions.length} novas sessões`);

            // Validar as novas sessões
            const validationResult = await this.validateNewSessions(gameId, newSessions);

            return {
                game_id: gameId,
                removed_sessions: removedCount,
                created_sessions: newSessions.length,
                validation_result: validationResult,
                success: validationResult.is_valid,
                message: `Sessões recriadas com sucesso: ${removedCount} removidas, ${newSessions.length} criadas`
            };

        } catch (error) {
            console.error('❌ Erro na recriação de sessões:', error);
            throw error;
        }
    }

    /**
     * Busca dados do jogo
     */
    async getGameData(gameId) {
        try {
            const { data, error } = await this.db.supabase
                .from('games')
                .select('*')
                .eq('id', gameId)
                .single();

            if (error) {
                throw new Error(`Erro ao buscar jogo: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar dados do jogo:', error);
            throw error;
        }
    }

    /**
     * Remove todas as sessões de um jogo
     */
    async removeAllGameSessions(gameId) {
        try {
            // Primeiro, buscar o número de sessões que serão removidas
            const { data: sessions, error: countError } = await this.db.supabase
                .from('game_sessions')
                .select('id')
                .eq('game_id', gameId);

            if (countError) {
                throw new Error(`Erro ao contar sessões: ${countError.message}`);
            }

            const sessionCount = sessions ? sessions.length : 0;

            if (sessionCount === 0) {
                console.log('ℹ️ Nenhuma sessão encontrada para remover');
                return 0;
            }

            // Remover todas as sessões
            const { error } = await this.db.supabase
                .from('game_sessions')
                .delete()
                .eq('game_id', gameId);

            if (error) {
                throw new Error(`Erro ao remover sessões: ${error.message}`);
            }

            console.log(`🗑️ Removidas ${sessionCount} sessões do jogo ${gameId}`);
            return sessionCount;

        } catch (error) {
            console.error('Erro ao remover sessões:', error);
            throw error;
        }
    }

    /**
     * Cria novas sessões baseadas nos dados do jogo
     */
    async createNewSessions(game) {
        try {
            console.log(`📅 Criando novas sessões para jogo com frequência: ${game.frequency}`);

            // Se for jogo avulso, criar apenas uma sessão
            if (game.frequency === 'Jogo Avulso' || !game.frequency) {
                return await this.createSingleSession(game);
            }

            // Para jogos com frequência, criar múltiplas sessões
            return await this.createRecurringSessions(game);

        } catch (error) {
            console.error('Erro ao criar novas sessões:', error);
            throw error;
        }
    }

    /**
     * Cria uma sessão única (jogo avulso)
     */
    async createSingleSession(game) {
        try {
            const sessionData = {
                game_id: game.id,
                session_date: game.game_date || moment().format('YYYY-MM-DD'),
                start_time: game.start_time,
                end_time: game.end_time,
                status: 'scheduled'
            };

            const { data, error } = await this.db.supabase
                .from('game_sessions')
                .insert([sessionData])
                .select();

            if (error) {
                throw new Error(`Erro ao criar sessão avulsa: ${error.message}`);
            }

            console.log(`✅ Sessão avulsa criada: ${data[0].id}`);
            return data;

        } catch (error) {
            console.error('Erro ao criar sessão avulsa:', error);
            throw error;
        }
    }

    /**
     * Cria sessões recorrentes baseadas na frequência
     */
    async createRecurringSessions(game) {
        try {
            const startDate = new Date(game.game_date || moment().format('YYYY-MM-DD'));
            const dayOfWeek = this.getDayOfWeekNumber(game.day_of_week);
            let currentDate = new Date(startDate);
            
            // Ajustar para o próximo dia da semana correto
            while (currentDate.getDay() !== dayOfWeek) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            const sessions = [];
            const maxSessions = this.getMaxSessionsForFrequency(game.frequency);
            
            // Criar sessões baseadas na frequência
            for (let i = 0; i < maxSessions; i++) {
                const sessionDate = currentDate.toISOString().split('T')[0];
                
                sessions.push({
                    game_id: game.id,
                    session_date: sessionDate,
                    start_time: game.start_time,
                    end_time: game.end_time,
                    status: 'scheduled'
                });
                
                // Calcular próxima data baseada na frequência
                this.calculateNextDate(currentDate, game.frequency);
            }
            
            // Inserir todas as sessões de uma vez
            const { data, error } = await this.db.supabase
                .from('game_sessions')
                .insert(sessions)
                .select();

            if (error) {
                throw new Error(`Erro ao criar sessões recorrentes: ${error.message}`);
            }

            console.log(`✅ ${data.length} sessões recorrentes criadas para o jogo ${game.id}`);
            return data;
            
        } catch (error) {
            console.error('Erro ao criar sessões recorrentes:', error);
            throw error;
        }
    }

    /**
     * Retorna o número máximo de sessões baseado na frequência
     */
    getMaxSessionsForFrequency(frequency) {
        switch (frequency) {
            case 'Diária': return 30; // 1 mês
            case 'Semanal': return 52; // 1 ano
            case 'Mensal': return 12; // 1 ano
            case 'Anual': return 5; // 5 anos
            default: return 52; // Padrão: 1 ano
        }
    }

    /**
     * Calcula a próxima data baseada na frequência
     */
    calculateNextDate(currentDate, frequency) {
        switch (frequency) {
            case 'Diária':
                currentDate.setDate(currentDate.getDate() + 1);
                break;
            case 'Semanal':
                currentDate.setDate(currentDate.getDate() + 7);
                break;
            case 'Mensal':
                currentDate.setMonth(currentDate.getMonth() + 1);
                break;
            case 'Anual':
                currentDate.setFullYear(currentDate.getFullYear() + 1);
                break;
            default:
                currentDate.setDate(currentDate.getDate() + 7); // Padrão semanal
        }
    }

    /**
     * Converte dia da semana para número
     */
    getDayOfWeekNumber(dayName) {
        const days = {
            'Domingo': 0,
            'Segunda': 1,
            'Terça': 2,
            'Quarta': 3,
            'Quinta': 4,
            'Sexta': 5,
            'Sábado': 6
        };
        return days[dayName] !== undefined ? days[dayName] : -1;
    }

    /**
     * Valida as novas sessões criadas
     */
    async validateNewSessions(gameId, sessions) {
        try {
            console.log('🔍 Validando novas sessões criadas...');

            const GameValidationService = require('./GameValidationService');
            const validationService = new GameValidationService(this.db);
            
            const validationResult = await validationService.validateGameAndSessions(gameId);
            
            console.log(`✅ Validação concluída. Válido: ${validationResult.is_valid}`);
            return validationResult;

        } catch (error) {
            console.error('Erro na validação das novas sessões:', error);
            return {
                is_valid: false,
                errors: [`Erro na validação: ${error.message}`]
            };
        }
    }

    /**
     * Recria sessões para todos os jogos ativos
     */
    async recreateAllActiveGameSessions() {
        try {
            console.log('🔄 Iniciando recriação de sessões para todos os jogos ativos...');

            const { data: games, error } = await this.db.supabase
                .from('games')
                .select('id, organization_name, location')
                .eq('status', 'active');

            if (error) {
                throw new Error(`Erro ao buscar jogos ativos: ${error.message}`);
            }

            const results = [];
            let totalSuccess = 0;
            let totalErrors = 0;

            for (const game of games) {
                try {
                    const result = await this.recreateGameSessions(game.id);
                    results.push({
                        game_id: game.id,
                        game_name: game.organization_name,
                        success: true,
                        result: result
                    });
                    totalSuccess++;
                } catch (error) {
                    console.error(`Erro ao recriar sessões do jogo ${game.id}:`, error);
                    results.push({
                        game_id: game.id,
                        game_name: game.organization_name,
                        success: false,
                        error: error.message
                    });
                    totalErrors++;
                }
            }

            return {
                total_games: games.length,
                successful_recreations: totalSuccess,
                failed_recreations: totalErrors,
                results: results,
                recreation_date: moment().format('YYYY-MM-DD HH:mm:ss')
            };

        } catch (error) {
            console.error('❌ Erro na recriação de todas as sessões:', error);
            throw error;
        }
    }

    /**
     * Gera relatório de recriação de sessões
     */
    generateRecreationReport(recreationResult) {
        let report = `🔄 *RELATÓRIO DE RECRIAÇÃO DE SESSÕES*\n\n`;
        
        report += `📅 *Data da Recriação:* ${recreationResult.recreation_date}\n`;
        report += `🎮 *Total de Jogos:* ${recreationResult.total_games}\n`;
        report += `✅ *Sucessos:* ${recreationResult.successful_recreations}\n`;
        report += `❌ *Falhas:* ${recreationResult.failed_recreations}\n\n`;

        if (recreationResult.results && recreationResult.results.length > 0) {
            report += `📋 *DETALHES POR JOGO:*\n\n`;
            
            recreationResult.results.forEach((result, index) => {
                const icon = result.success ? '✅' : '❌';
                report += `${icon} *${result.game_name}*\n`;
                
                if (result.success) {
                    report += `   • Sessões removidas: ${result.result.removed_sessions}\n`;
                    report += `   • Sessões criadas: ${result.result.created_sessions}\n`;
                    report += `   • Validação: ${result.result.validation_result.is_valid ? 'Válida' : 'Inválida'}\n`;
                } else {
                    report += `   • Erro: ${result.error}\n`;
                }
                
                report += `\n`;
            });
        }

        return report;
    }

    /**
     * Verifica se um jogo precisa ter suas sessões recriadas
     */
    async checkIfGameNeedsSessionRecreation(gameId) {
        try {
            console.log(`🔍 Verificando se o jogo ${gameId} precisa de recriação de sessões...`);

            const GameValidationService = require('./GameValidationService');
            const validationService = new GameValidationService(this.db);
            
            const validationResult = await validationService.validateGameAndSessions(gameId);
            
            const needsRecreation = !validationResult.is_valid || 
                                  validationResult.errors.length > 0 ||
                                  validationResult.session_validation.invalid_sessions > 0;

            return {
                game_id: gameId,
                needs_recreation: needsRecreation,
                validation_result: validationResult,
                reason: needsRecreation ? 'Sessões inválidas ou erros encontrados' : 'Sessões válidas'
            };

        } catch (error) {
            console.error('Erro ao verificar necessidade de recriação:', error);
            return {
                game_id: gameId,
                needs_recreation: true,
                reason: `Erro na verificação: ${error.message}`
            };
        }
    }
}

module.exports = SessionRecreationService;
