const moment = require('moment');

class GameController {
    constructor(database) {
        this.db = database;
        // Inicializar serviços de validação e recriação
        this.SessionRecreationService = require('../services/SessionRecreationService');
        this.GameValidationService = require('../services/GameValidationService');
        this.sessionRecreationService = new this.SessionRecreationService(database);
        this.gameValidationService = new this.GameValidationService(database);
    }
    
    async createGame(gameData) {
        try {
            // Usar a nova função do banco que cria automaticamente as sessões
            const result = await this.db.createGame({
                organization_name: gameData.organization_name,
                location: gameData.location,
                players_per_team: gameData.players_per_team,
                substitutes_per_team: gameData.substitutes_per_team,
                number_of_teams: gameData.number_of_teams,
                start_time: gameData.start_time,
                end_time: gameData.end_time,
                game_date: gameData.game_date || moment().format('YYYY-MM-DD'),
                day_of_week: gameData.day_of_week || null,
                frequency: gameData.frequency || 'Jogo Avulso'
            });
            
            // Criar configuração de preços padrão
            await this.createDefaultPriceConfig(result.id);
            
            return result;
        } catch (error) {
            console.error('Erro ao criar jogo:', error);
            throw error;
        }
    }
    
    async getCurrentGame() {
        try {
            const games = await this.db.getAllGames();
            return games.find(game => game.status === 'active') || null;
        } catch (error) {
            console.error('Erro ao buscar jogo atual:', error);
            throw error;
        }
    }
    
    async getGameById(gameId) {
        try {
            return await this.db.getGame(gameId);
        } catch (error) {
            console.error('Erro ao buscar jogo por ID:', error);
            throw error;
        }
    }
    
    async getAllGames() {
        try {
            return await this.db.all(`
                SELECT * FROM games 
                ORDER BY created_at DESC
            `);
        } catch (error) {
            console.error('Erro ao buscar todos os jogos:', error);
            throw error;
        }
    }
    
    async getGameSessions(gameId) {
        try {
            return await this.db.getGameSessions(gameId);
        } catch (error) {
            console.error('Erro ao buscar sessões do jogo:', error);
            throw error;
        }
    }
    
    async getUpcomingSessions(limit = 10) {
        try {
            return await this.db.getUpcomingSessions(limit);
        } catch (error) {
            console.error('Erro ao buscar próximas sessões:', error);
            throw error;
        }
    }
    
    async updateGame(gameId, updateData) {
        try {
            console.log(`🔄 Atualizando jogo ${gameId}...`);
            
            // Verificar se há alterações que afetam as sessões
            const sessionAffectingFields = [
                'game_date', 'day_of_week', 'frequency', 
                'start_time', 'end_time'
            ];
            
            const hasSessionAffectingChanges = Object.keys(updateData).some(
                key => sessionAffectingFields.includes(key)
            );
            
            // Atualizar dados do jogo usando Supabase
            const updateDataWithTimestamp = {
                ...updateData,
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };
            
            const { data, error } = await this.db.supabase
                .from('games')
                .update(updateDataWithTimestamp)
                .eq('id', gameId)
                .select();
            
            if (error) {
                throw new Error(`Erro ao atualizar jogo: ${error.message}`);
            }
            
            const result = data && data.length > 0 ? data[0] : null;
            
            // Se houve alterações que afetam as sessões, recriar todas as sessões
            if (hasSessionAffectingChanges) {
                console.log(`🔄 Alterações detectadas que afetam as sessões. Recriando sessões...`);
                
                try {
                    const recreationResult = await this.sessionRecreationService.recreateGameSessions(gameId);
                    
                    console.log(`✅ Sessões recriadas com sucesso: ${recreationResult.message}`);
                    
                    return {
                        ...result,
                        session_recreation: recreationResult
                    };
                } catch (recreationError) {
                    console.error('❌ Erro ao recriar sessões:', recreationError);
                    // Não falhar a atualização do jogo se a recriação de sessões falhar
                    return {
                        ...result,
                        session_recreation_error: recreationError.message
                    };
                }
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar jogo:', error);
            throw error;
        }
    }
    
    async deleteGame(gameId) {
        try {
            // Soft delete - apenas marcar como inativo
            const result = await this.db.run(`
                UPDATE games 
                SET status = 'inactive', updated_at = ? 
                WHERE id = ?
            `, [moment().format('YYYY-MM-DD HH:mm:ss'), gameId]);
            
            return result;
        } catch (error) {
            console.error('Erro ao deletar jogo:', error);
            throw error;
        }
    }
    
    async getGameStats(gameId) {
        try {
            const game = await this.getGameById(gameId);
            if (!game) return null;
            
            // Por enquanto, retornar estatísticas básicas
            // TODO: Implementar estatísticas completas quando as tabelas estiverem prontas
            return {
                game,
                teams: [],
                payments: {
                    total_payments: 0,
                    paid_payments: 0,
                    pending_payments: 0,
                    total_revenue: 0
                }
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas do jogo:', error);
            throw error;
        }
    }
    
    async createDefaultPriceConfig(gameId) {
        try {
            // Atualizar o campo price_config na tabela games
            const priceConfig = {
                monthly_player_price: 50.00,
                casual_player_price: 25.00
            };
            
            await this.db.updateGame(gameId, { price_config: priceConfig });
            
            console.log(`Configuração de preços criada para jogo ${gameId}`);
        } catch (error) {
            console.error('Erro ao criar configuração de preços:', error);
        }
    }
    
    async getPriceConfig(gameId) {
        try {
            const game = await this.db.getGame(gameId);
            return game ? game.price_config : null;
        } catch (error) {
            console.error('Erro ao buscar configuração de preços:', error);
            throw error;
        }
    }
    
    async updatePriceConfig(gameId, monthlyPrice, casualPrice) {
        try {
            const priceConfig = {
                monthly_player_price: monthlyPrice,
                casual_player_price: casualPrice
            };
            
            const result = await this.db.updateGame(gameId, { price_config: priceConfig });
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar configuração de preços:', error);
            throw error;
        }
    }
    
    async isGameReady(gameId) {
        try {
            const game = await this.getGameById(gameId);
            if (!game) return false;
            
            // Verificar se há jogadores suficientes
            const players = await this.db.getAllPlayers();
            const activePlayers = players.filter(player => player.status === 'active');
            
            const requiredPlayers = (game.players_per_team + game.substitutes_per_team) * game.number_of_teams;
            return activePlayers.length >= requiredPlayers;
        } catch (error) {
            console.error('Erro ao verificar se jogo está pronto:', error);
            return false;
        }
    }
    
    async getUpcomingGames() {
        try {
            const today = moment().format('YYYY-MM-DD');
            return await this.db.all(`
                SELECT * FROM games 
                WHERE game_date >= ? AND status = 'active'
                ORDER BY game_date ASC, start_time ASC
            `, [today]);
        } catch (error) {
            console.error('Erro ao buscar jogos futuros:', error);
            throw error;
        }
    }
    
    async getGameHistory(limit = 10) {
        try {
            const games = await this.db.getAllGames();
            return games
                .filter(game => game.status === 'inactive')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);
        } catch (error) {
            console.error('Erro ao buscar histórico de jogos:', error);
            throw error;
        }
    }

    /**
     * Valida um jogo e suas sessões
     */
    async validateGame(gameId) {
        try {
            console.log(`🔍 Validando jogo ${gameId}...`);
            return await this.gameValidationService.validateGameAndSessions(gameId);
        } catch (error) {
            console.error('Erro ao validar jogo:', error);
            throw error;
        }
    }

    /**
     * Recria as sessões de um jogo
     */
    async recreateGameSessions(gameId) {
        try {
            console.log(`🔄 Recriando sessões do jogo ${gameId}...`);
            return await this.sessionRecreationService.recreateGameSessions(gameId);
        } catch (error) {
            console.error('Erro ao recriar sessões do jogo:', error);
            throw error;
        }
    }

    /**
     * Verifica se um jogo precisa ter suas sessões recriadas
     */
    async checkIfGameNeedsSessionRecreation(gameId) {
        try {
            return await this.sessionRecreationService.checkIfGameNeedsSessionRecreation(gameId);
        } catch (error) {
            console.error('Erro ao verificar necessidade de recriação:', error);
            throw error;
        }
    }

    /**
     * Valida todos os jogos ativos
     */
    async validateAllActiveGames() {
        try {
            console.log('🔍 Validando todos os jogos ativos...');
            return await this.gameValidationService.validateAllActiveGames();
        } catch (error) {
            console.error('Erro ao validar todos os jogos:', error);
            throw error;
        }
    }

    /**
     * Recria sessões para todos os jogos ativos
     */
    async recreateAllActiveGameSessions() {
        try {
            console.log('🔄 Recriando sessões para todos os jogos ativos...');
            return await this.sessionRecreationService.recreateAllActiveGameSessions();
        } catch (error) {
            console.error('Erro ao recriar sessões de todos os jogos:', error);
            throw error;
        }
    }
}

module.exports = GameController;
