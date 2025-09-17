/**
 * 🗄️ DATABASE SUPABASE - VAIDARJOGO
 * 📅 Data: $(date)
 * 🚀 Classe para operações de banco de dados usando Supabase
 */

require('dotenv').config();
const { supabaseAdmin } = require('./supabase/config/supabase');

class DatabaseSupabase {
    constructor() {
        this.supabase = supabaseAdmin;
    }

    // =====================================================
    // 🔧 MÉTODOS BÁSICOS
    // =====================================================

    /**
     * Inicializar conexão (compatibilidade com SQLite)
     */
    async initialize() {
        try {
            console.log('🔗 Conectando ao Supabase...');
            // Testar conexão
            const { data, error } = await this.supabase
                .from('games')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('❌ Erro na conexão:', error.message);
                return false;
            }
            
            console.log('✅ Conectado ao Supabase com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar ao Supabase:', error);
            return false;
        }
    }

    /**
     * Executar query (compatibilidade com SQLite)
     */
    async run(query, params = []) {
        try {
            // Para compatibilidade, vamos implementar as operações básicas
            if (query.includes('INSERT INTO')) {
                return await this.insert(query, params);
            } else if (query.includes('UPDATE')) {
                return await this.update(query, params);
            } else if (query.includes('DELETE')) {
                return await this.delete(query, params);
            }
            
            throw new Error('Operação não suportada');
        } catch (error) {
            console.error('Erro ao executar query:', error);
            throw error;
        }
    }

    /**
     * Buscar um registro
     */
    async get(query, params = []) {
        try {
            // Implementar busca baseada na query
            if (query.includes('SELECT COUNT(*)')) {
                return await this.count(query, params);
            } else if (query.includes('FROM games')) {
                return await this.getGame(query, params);
            } else if (query.includes('FROM players')) {
                return await this.getPlayer(query, params);
            } else if (query.includes('FROM game_sessions')) {
                return await this.getGameSession(query, params);
            }
            
            throw new Error('Query não suportada');
        } catch (error) {
            console.error('Erro ao buscar registro:', error);
            throw error;
        }
    }

    /**
     * Buscar múltiplos registros
     */
    async all(query, params = []) {
        try {
            if (query.includes('FROM players')) {
                return await this.getPlayers(query, params);
            } else if (query.includes('FROM games')) {
                return await this.getGames(query, params);
            }
            
            throw new Error('Query não suportada');
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
            throw error;
        }
    }

    // =====================================================
    // 🎮 OPERAÇÕES DE JOGOS
    // =====================================================

    /**
     * Buscar jogo atual
     */
    async getCurrentGame() {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw new Error(`Erro ao buscar jogo: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao buscar jogo atual:', error);
            return null;
        }
    }

    /**
     * Criar jogo
     */
    async createGame(gameData) {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .insert([gameData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar jogo: ${error.message}`);
            }

            // Criar sessões automaticamente
            try {
                await this.createGameSessions(data.id, gameData);
                console.log(`Sessões criadas automaticamente para o jogo ${data.id}`);
            } catch (sessionError) {
                console.error('Erro ao criar sessões automaticamente:', sessionError);
                // Não falhar a criação do jogo se as sessões falharem
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar jogo:', error);
            throw error;
        }
    }

    /**
     * Atualizar jogo
     */
    async updateGame(gameId, updateData) {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .update(updateData)
                .eq('id', gameId)
                .select();

            if (error) {
                throw new Error(`Erro ao atualizar jogo: ${error.message}`);
            }

            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Erro ao atualizar jogo:', error);
            throw error;
        }
    }

    // =====================================================
    // 👥 OPERAÇÕES DE JOGADORES
    // =====================================================

    /**
     * Buscar todos os jogadores
     */
    async getAllPlayers() {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar jogadores: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            return [];
        }
    }

    /**
     * Buscar jogadores mensalistas
     * @param {string} gameId - ID do jogo para filtrar jogadores (opcional)
     */
    async getMonthlyPlayers(gameId = null) {
        try {
            let query = this.supabase
                .from('players')
                .select('*')
                .eq('type', 'monthly')
                .eq('status', 'active')
                .order('name', { ascending: true });

            // Se gameId for fornecido, buscar apenas jogadores do jogo específico
            if (gameId) {
                const { data: gamePlayers, error: gamePlayersError } = await this.supabase
                    .from('game_players')
                    .select('players:player_id (*)')
                    .eq('game_id', gameId)
                    .eq('status', 'active')
                    .eq('players.type', 'monthly')
                    .eq('players.status', 'active')
                    .order('players(name)', { ascending: true });

                if (gamePlayersError) {
                    throw new Error(`Erro ao buscar jogadores mensalistas do jogo: ${gamePlayersError.message}`);
                }

                // Extrair os dados dos jogadores da resposta
                const players = gamePlayers
                    .map(item => item.players)
                    .filter(player => player != null);

                return players;
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Erro ao buscar jogadores mensalistas: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar jogadores mensalistas:', error);
            return [];
        }
    }

    /**
     * Buscar jogadores avulsos
     * @param {string} gameId - ID do jogo para filtrar jogadores (opcional)
     */
    async getCasualPlayers(gameId = null) {
        try {
            let query = this.supabase
                .from('players')
                .select('*')
                .eq('type', 'casual')
                .eq('status', 'active')
                .order('name', { ascending: true });

            // Se gameId for fornecido, buscar apenas jogadores do jogo específico
            if (gameId) {
                const { data: gamePlayers, error: gamePlayersError } = await this.supabase
                    .from('game_players')
                    .select('players:player_id (*)')
                    .eq('game_id', gameId)
                    .eq('status', 'active')
                    .eq('players.type', 'casual')
                    .eq('players.status', 'active')
                    .order('players(name)', { ascending: true });

                if (gamePlayersError) {
                    throw new Error(`Erro ao buscar jogadores avulsos do jogo: ${gamePlayersError.message}`);
                }

                // Extrair os dados dos jogadores da resposta
                const players = gamePlayers
                    .map(item => item.players)
                    .filter(player => player != null);

                return players;
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Erro ao buscar jogadores avulsos: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar jogadores avulsos:', error);
            return [];
        }
    }

    /**
     * Obter jogo ativo/atual (para uso do bot)
     * @returns {Object|null} - Jogo ativo ou null se não houver
     */
    async getCurrentGame() {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                throw new Error(`Erro ao buscar jogo atual: ${error.message}`);
            }

            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Erro ao buscar jogo atual:', error);
            return null;
        }
    }

    /**
     * Criar jogador
     */
    async createPlayer(playerData) {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .insert([playerData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar jogador: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    }

    /**
     * Criar pagamento
     */
    async createPayment(paymentData) {
        try {
            const { data, error } = await this.supabase
                .from('payments')
                .insert([paymentData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar pagamento: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar pagamento:', error);
            throw error;
        }
    }

    /**
     * Criar time
     */
    async createTeam(teamData) {
        try {
            const { data, error } = await this.supabase
                .from('teams')
                .insert([teamData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar time: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar time:', error);
            throw error;
        }
    }

    /**
     * Criar jogador por time
     */
    async createTeamPlayer(teamPlayerData) {
        try {
            const { data, error } = await this.supabase
                .from('team_players')
                .insert([teamPlayerData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar jogador por time: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar jogador por time:', error);
            throw error;
        }
    }

    /**
     * Criar sessão de jogo
     */
    async createGameSession(sessionData) {
        try {
            const { data, error } = await this.supabase
                .from('game_sessions')
                .insert([sessionData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar sessão de jogo: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar sessão de jogo:', error);
            throw error;
        }
    }

    /**
     * Criar notificação enviada
     */
    async createNotificationSent(notificationData) {
        try {
            const { data, error } = await this.supabase
                .from('notifications_sent')
                .insert([notificationData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar notificação enviada: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar notificação enviada:', error);
            throw error;
        }
    }

    /**
     * Criar entrada na lista de espera
     */
    async createWaitingListEntry(waitingListData) {
        try {
            const { data, error } = await this.supabase
                .from('waiting_list')
                .insert([waitingListData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar entrada na lista de espera: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar entrada na lista de espera:', error);
            throw error;
        }
    }

    /**
     * Atualizar jogador
     */
    async updatePlayer(playerId, updateData) {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .update(updateData)
                .eq('id', playerId)
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao atualizar jogador: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    }

    // =====================================================
    // 🔐 OPERAÇÕES DE ADMINISTRADORES
    // =====================================================

    /**
     * Buscar números de administradores
     */
    async getAdminNumbers() {
        try {
            const { data, error } = await this.supabase
                .from('app_users')
                .select('phone_number')
                .eq('is_admin', true)
                .eq('is_active', true);

            if (error) {
                throw new Error(`Erro ao buscar administradores: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar administradores:', error);
            return [];
        }
    }

    // =====================================================
    // 📊 OPERAÇÕES DE CONFIRMAÇÃO
    // =====================================================

    /**
     * Buscar jogadores confirmados para uma sessão
     */
    async getConfirmedPlayers(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('participations')
                .select(`
                    *,
                    players(*)
                `)
                .eq('session_id', sessionId)
                .eq('status', 'confirmed');

            if (error) {
                throw new Error(`Erro ao buscar jogadores confirmados: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar jogadores confirmados:', error);
            return [];
        }
    }

    /**
     * Confirmar participação
     */
    async confirmParticipation(sessionId, playerId, status, notes = null) {
        try {
            const participationData = {
                session_id: sessionId,
                player_id: playerId,
                status: status,
                notes: notes,
                updated_at: new Date().toISOString()
            };

            // Se for confirmação, adicionar timestamp de confirmação
            if (status === 'confirmed') {
                participationData.confirmed_at = new Date().toISOString();
            }

            const { data, error } = await this.supabase
                .from('participations')
                .upsert([participationData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao confirmar participação: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao confirmar participação:', error);
            throw error;
        }
    }

    /**
     * Contar jogadores por sessão
     */
    async getPlayerCountForSession(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('participations')
                .select('status')
                .eq('session_id', sessionId);

            if (error) {
                throw new Error(`Erro ao contar jogadores: ${error.message}`);
            }

            const counts = {
                confirmed: 0,
                declined: 0,
                pending: 0
            };

            data.forEach(participation => {
                counts[participation.status] = (counts[participation.status] || 0) + 1;
            });

            return counts;
        } catch (error) {
            console.error('Erro ao contar jogadores:', error);
            return { confirmed: 0, declined: 0, pending: 0 };
        }
    }

    // =====================================================
    // 📋 OPERAÇÕES DE LISTA DE ESPERA
    // =====================================================

    /**
     * Adicionar à lista de espera
     */
    async addToWaitingList(sessionId, playerId) {
        try {
            // Verificar se o jogador já está na lista de espera
            const { data: existing, error: checkError } = await this.supabase
                .from('waiting_list')
                .select('id')
                .eq('session_id', sessionId)
                .eq('player_id', playerId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw new Error(`Erro ao verificar lista de espera: ${checkError.message}`);
            }

            if (existing) {
                throw new Error('Jogador já está na lista de espera');
            }

            // Buscar próxima posição
            const { data: maxPos, error: maxError } = await this.supabase
                .from('waiting_list')
                .select('position')
                .eq('session_id', sessionId)
                .order('position', { ascending: false })
                .limit(1)
                .single();

            const nextPosition = maxPos ? maxPos.position + 1 : 1;

            const { data, error } = await this.supabase
                .from('waiting_list')
                .insert([{
                    session_id: sessionId,
                    player_id: playerId,
                    position: nextPosition,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao adicionar à lista de espera: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao adicionar à lista de espera:', error);
            throw error;
        }
    }

    /**
     * Remover da lista de espera
     */
    async removeFromWaitingList(sessionId, playerId) {
        try {
            const { error } = await this.supabase
                .from('waiting_list')
                .delete()
                .eq('session_id', sessionId)
                .eq('player_id', playerId);

            if (error) {
                throw new Error(`Erro ao remover da lista de espera: ${error.message}`);
            }

            return true;
        } catch (error) {
            console.error('Erro ao remover da lista de espera:', error);
            throw error;
        }
    }

    /**
     * Buscar lista de espera
     */
    async getWaitingList(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('waiting_list')
                .select(`
                    *,
                    players(*)
                `)
                .eq('session_id', sessionId)
                .order('position', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar lista de espera: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar lista de espera:', error);
            return [];
        }
    }

    // =====================================================
    // 🔧 MÉTODOS AUXILIARES
    // =====================================================

    /**
     * Buscar participação de um jogador em uma sessão
     */
    async getPlayerParticipation(sessionId, playerId) {
        try {
            const { data, error } = await this.supabase
                .from('participations')
                .select('*')
                .eq('session_id', sessionId)
                .eq('player_id', playerId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw new Error(`Erro ao buscar participação: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao buscar participação:', error);
            return null;
        }
    }

    /**
     * Verificar se um jogador está na lista de espera
     */
    async isPlayerInWaitingList(sessionId, playerId) {
        try {
            const { data, error } = await this.supabase
                .from('waiting_list')
                .select('id, position')
                .eq('session_id', sessionId)
                .eq('player_id', playerId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw new Error(`Erro ao verificar lista de espera: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao verificar lista de espera:', error);
            return null;
        }
    }

    /**
     * Buscar todas as participações de uma sessão (todos os status)
     */
    async getAllParticipations(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('participations')
                .select(`
                    *,
                    players(*)
                `)
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar participações: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar participações:', error);
            return [];
        }
    }

    /**
     * Contar registros
     */
    async count(query, params = []) {
        try {
            // Implementar contagem baseada na query
            if (query.includes('FROM players WHERE status = "active"')) {
                const { count, error } = await this.supabase
                    .from('players')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');

                if (error) {
                    throw new Error(`Erro ao contar jogadores: ${error.message}`);
                }

                return { count: count || 0 };
            }

            throw new Error('Query de contagem não suportada');
        } catch (error) {
            console.error('Erro ao contar registros:', error);
            return { count: 0 };
        }
    }

    /**
     * Buscar jogo específico
     */
    async getGame(queryOrId, params = []) {
        try {
            // Se for chamado diretamente com ID (string ou UUID)
            if (typeof queryOrId === 'string' && !queryOrId.includes('SELECT')) {
                const gameId = queryOrId;
                const { data, error } = await this.supabase
                    .from('games')
                    .select('*')
                    .eq('id', gameId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw new Error(`Erro ao buscar jogo: ${error.message}`);
                }

                return data || null;
            }
            
            // Se for chamado com query SQL (compatibilidade)
            if (queryOrId.includes('WHERE id = ?')) {
                const gameId = params[0];
                const { data, error } = await this.supabase
                    .from('games')
                    .select('*')
                    .eq('id', gameId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw new Error(`Erro ao buscar jogo: ${error.message}`);
                }

                return data || null;
            }

            throw new Error('Query de jogo não suportada');
        } catch (error) {
            console.error('Erro ao buscar jogo:', error);
            return null;
        }
    }

    /**
     * Buscar jogador específico
     */
    async getPlayer(query, params = []) {
        try {
            if (query.includes('WHERE phone_number = ?')) {
                const phoneNumber = params[0];
                const { data, error } = await this.supabase
                    .from('players')
                    .select('*')
                    .eq('phone_number', phoneNumber)
                    .eq('status', 'active')
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw new Error(`Erro ao buscar jogador: ${error.message}`);
                }

                return data || null;
            }

            throw new Error('Query de jogador não suportada');
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            return null;
        }
    }

    /**
     * Buscar sessão de jogo específica
     */
    async getGameSession(query, params = []) {
        try {
            if (query.includes('WHERE gs.id = ?')) {
                const sessionId = params[0];
                
                // Para queries que fazem JOIN com games, usar uma abordagem mais simples
                if (query.includes('JOIN games g ON gs.game_id = g.id')) {
                    // Buscar a sessão
                    const { data: session, error: sessionError } = await this.supabase
                        .from('game_sessions')
                        .select('*')
                        .eq('id', sessionId)
                        .single();

                    if (sessionError && sessionError.code !== 'PGRST116') {
                        throw new Error(`Erro ao buscar sessão: ${sessionError.message}`);
                    }

                    if (!session) return null;

                    // Buscar o jogo relacionado
                    const { data: game, error: gameError } = await this.supabase
                        .from('games')
                        .select('*')
                        .eq('id', session.game_id)
                        .single();

                    if (gameError && gameError.code !== 'PGRST116') {
                        throw new Error(`Erro ao buscar jogo: ${gameError.message}`);
                    }

                    // Combinar os dados
                    return {
                        ...session,
                        organization_name: game?.organization_name,
                        location: game?.location,
                        players_per_team: game?.players_per_team,
                        substitutes_per_team: game?.substitutes_per_team,
                        number_of_teams: game?.number_of_teams
                    };
                }
                
                // Para queries simples de game_sessions
                const { data, error } = await this.supabase
                    .from('game_sessions')
                    .select('*')
                    .eq('id', sessionId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw new Error(`Erro ao buscar sessão: ${error.message}`);
                }

                return data || null;
            }

            throw new Error('Query de sessão não suportada');
        } catch (error) {
            console.error('Erro ao buscar sessão:', error);
            return null;
        }
    }

    /**
     * Buscar sessão ativa de um jogo
     */
    async getActiveSession(gameId) {
        try {
            const { data, error } = await this.supabase
                .from('game_sessions')
                .select('*')
                .eq('game_id', gameId)
                .eq('status', 'scheduled')
                .order('session_date', { ascending: true })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error(`Erro ao buscar sessão ativa: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao buscar sessão ativa:', error);
            return null;
        }
    }

    /**
     * Buscar próximas sessões
     */
    async getUpcomingSessions(limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    *,
                    games (
                        organization_name,
                        location,
                        start_time,
                        end_time
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', new Date().toISOString().split('T')[0])
                .order('session_date', { ascending: true })
                .limit(limit);

            if (error) {
                throw new Error(`Erro ao buscar próximas sessões: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar próximas sessões:', error);
            return [];
        }
    }

    /**
     * Criar configuração de notificação
     */
    async createNotificationConfig(configData) {
        try {
            const { data, error } = await this.supabase
                .from('notification_configs')
                .insert([configData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar configuração de notificação: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar configuração de notificação:', error);
            throw error;
        }
    }

    /**
     * Atualizar configuração de notificação
     */
    async updateNotificationConfig(configId, updateData) {
        try {
            const { data, error } = await this.supabase
                .from('notification_configs')
                .update(updateData)
                .eq('id', configId)
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao atualizar configuração de notificação: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao atualizar configuração de notificação:', error);
            throw error;
        }
    }

    /**
     * Buscar configuração de notificação
     */
    async getNotificationConfig(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('notification_configs')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error(`Erro ao buscar configuração de notificação: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao buscar configuração de notificação:', error);
            return null;
        }
    }

    /**
     * Buscar jogadores por tipo
     */
    async getPlayersByType(type) {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('type', type)
                .eq('status', 'active');

            if (error) {
                throw new Error(`Erro ao buscar jogadores: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            return [];
        }
    }

    /**
     * Buscar todos os jogadores ativos
     */
    async getAllActivePlayers() {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('status', 'active');

            if (error) {
                throw new Error(`Erro ao buscar jogadores: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            return [];
        }
    }

    /**
     * Criar participação
     */
    async createParticipation(participationData) {
        try {
            const { data, error } = await this.supabase
                .from('participations')
                .insert([participationData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar participação: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar participação:', error);
            throw error;
        }
    }

    /**
     * Adicionar à lista de espera
     */
    async addToWaitingList(waitingListData) {
        try {
            const { data, error } = await this.supabase
                .from('waiting_list')
                .insert([waitingListData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao adicionar à lista de espera: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao adicionar à lista de espera:', error);
            throw error;
        }
    }

    /**
     * Criar confirmação de participação
     */
    async createParticipationConfirmation(confirmationData) {
        try {
            const { data, error } = await this.supabase
                .from('participation_confirmations')
                .insert([confirmationData])
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar confirmação de participação: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar confirmação de participação:', error);
            throw error;
        }
    }

    /**
     * Atualizar confirmação de participação
     */
    async updateParticipationConfirmation(confirmationId, updateData) {
        try {
            const { data, error } = await this.supabase
                .from('participation_confirmations')
                .update(updateData)
                .eq('id', confirmationId)
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao atualizar confirmação de participação: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao atualizar confirmação de participação:', error);
            throw error;
        }
    }

    /**
     * Buscar confirmação de participação por telefone e sessão
     */
    async getParticipationConfirmation(sessionId, phoneNumber) {
        try {
            const { data, error } = await this.supabase
                .from('participation_confirmations')
                .select('*')
                .eq('session_id', sessionId)
                .eq('player_phone', phoneNumber)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error(`Erro ao buscar confirmação de participação: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao buscar confirmação de participação:', error);
            return null;
        }
    }

    /**
     * Buscar confirmações de uma sessão
     */
    async getSessionConfirmations(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    *,
                    players (
                        name,
                        phone_number,
                        type
                    )
                `)
                .eq('session_id', sessionId)
                .order('position', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar confirmações da sessão: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar confirmações da sessão:', error);
            return [];
        }
    }

    /**
     * Buscar jogador por telefone
     */
    async getPlayerByPhone(phoneNumber) {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('phone_number', phoneNumber)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error(`Erro ao buscar jogador: ${error.message}`);
            }

            return data || null;
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            return null;
        }
    }

    /**
     * Buscar jogadores
     */
    async getPlayers(query, params = []) {
        try {
            if (query.includes('WHERE status = "active"')) {
                return await this.getAllPlayers();
            }

            if (query.includes("WHERE type = 'casual' AND status = 'active'")) {
                return await this.getCasualPlayers();
            }

            if (query.includes("WHERE type = 'monthly' AND status = 'active'")) {
                return await this.getMonthlyPlayers();
            }

            throw new Error('Query de jogadores não suportada');
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            return [];
        }
    }

    /**
     * Buscar jogos
     */
    async getGames(query, params = []) {
        try {
            if (query.includes('WHERE status = "active"')) {
                const { data, error } = await this.supabase
                    .from('games')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw new Error(`Erro ao buscar jogos: ${error.message}`);
                }

                return data || [];
            }

            throw new Error('Query de jogos não suportada');
        } catch (error) {
            console.error('Erro ao buscar jogos:', error);
            return [];
        }
    }

    /**
     * Buscar todos os jogos
     */
    async getAllGames() {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Erro ao buscar todos os jogos: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar todos os jogos:', error);
            return [];
        }
    }

    /**
     * Buscar sessões de um jogo
     */
    async getGameSessions(gameId) {
        try {
            const { data, error } = await this.supabase
                .from('game_sessions')
                .select('*')
                .eq('game_id', gameId)
                .order('session_date', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar sessões do jogo: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar sessões do jogo:', error);
            return [];
        }
    }

    /**
     * Criar sessões automaticamente para um jogo
     */
    async createGameSessions(gameId, gameData) {
        try {
            console.log(`Criando sessões para o jogo ${gameId} com frequência: ${gameData.frequency}`);
            
            // Se for jogo avulso, criar apenas uma sessão
            if (gameData.frequency === 'Jogo Avulso' || !gameData.frequency) {
                const { data, error } = await this.supabase
                    .from('game_sessions')
                    .insert([{
                        game_id: gameId,
                        session_date: gameData.game_date,
                        start_time: gameData.start_time,
                        end_time: gameData.end_time,
                        status: 'scheduled'
                    }])
                    .select();

                if (error) {
                    throw new Error(`Erro ao criar sessão avulsa: ${error.message}`);
                }

                console.log(`Sessão avulsa criada: ${data[0].id}`);
                return data;
            }

            // Para jogos com frequência, criar múltiplas sessões
            const startDate = new Date(gameData.game_date);
            const dayOfWeek = this.getDayOfWeekNumber(gameData.day_of_week);
            let currentDate = new Date(startDate);
            
            // Ajustar para o próximo dia da semana correto
            while (currentDate.getDay() !== dayOfWeek) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            const sessions = [];
            
            // Criar sessões para os próximos 12 meses
            for (let i = 0; i < 52; i++) { // 52 semanas = 1 ano
                const sessionDate = currentDate.toISOString().split('T')[0];
                
                sessions.push({
                    game_id: gameId,
                    session_date: sessionDate,
                    start_time: gameData.start_time,
                    end_time: gameData.end_time,
                    status: 'scheduled'
                });
                
                // Calcular próxima data baseada na frequência
                switch (gameData.frequency) {
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
            
            // Inserir todas as sessões de uma vez
            const { data, error } = await this.supabase
                .from('game_sessions')
                .insert(sessions)
                .select();

            if (error) {
                throw new Error(`Erro ao criar sessões: ${error.message}`);
            }

            console.log(`${data.length} sessões criadas para o jogo ${gameId}`);
            return data;
            
        } catch (error) {
            console.error('Erro ao criar sessões do jogo:', error);
            throw error;
        }
    }

    /**
     * Converter dia da semana para número
     */
    getDayOfWeekNumber(dayOfWeek) {
        const days = {
            'Domingo': 0,
            'Segunda-feira': 1,
            'Terça-feira': 2,
            'Quarta-feira': 3,
            'Quinta-feira': 4,
            'Sexta-feira': 5,
            'Sábado': 6
        };
        return days[dayOfWeek] || 0;
    }

    /**
     * Inserir registro
     */
    async insert(query, params = []) {
        try {
            // Implementar inserção baseada na query
            if (query.includes('INSERT INTO games')) {
                // Extrair dados da query (simplificado)
                const gameData = {
                    organization_name: params[0] || 'Jogo',
                    location: params[1] || 'Local',
                    players_per_team: params[2] || 7,
                    substitutes_per_team: params[3] || 3,
                    number_of_teams: params[4] || 2,
                    start_time: params[5] || '19:00',
                    end_time: params[6] || '21:00',
                    status: 'active',
                    created_at: new Date().toISOString()
                };

                return await this.createGame(gameData);
            }

            if (query.includes('INSERT INTO players')) {
                // Extrair dados da query para jogadores
                const playerData = {
                    name: params[0],
                    phone_number: params[1],
                    type: params[2],
                    birth_date: params[3],
                    primary_position: params[4],
                    secondary_position: params[5],
                    preferred_foot: params[6]
                };

                return await this.createPlayer(playerData);
            }

            if (query.includes('INSERT INTO payments')) {
                // Extrair dados da query para pagamentos
                const paymentData = {
                    player_id: params[0],
                    game_id: params[1],
                    amount: params[2],
                    payment_date: params[3],
                    payment_method: params[4],
                    notes: params[5]
                };

                return await this.createPayment(paymentData);
            }

            if (query.includes('INSERT INTO teams')) {
                // Extrair dados da query para times
                const teamData = {
                    game_id: params[0],
                    team_number: params[1],
                    name: params[2]
                };

                return await this.createTeam(teamData);
            }

            if (query.includes('INSERT INTO team_players')) {
                // Extrair dados da query para jogadores por time
                const teamPlayerData = {
                    team_id: params[0],
                    player_id: params[1],
                    position: params[2],
                    is_starter: params[3] === 1
                };

                return await this.createTeamPlayer(teamPlayerData);
            }

            if (query.includes('INSERT INTO game_sessions')) {
                // Extrair dados da query para sessões de jogo
                const sessionData = {
                    game_id: params[0],
                    session_date: params[1],
                    start_time: params[2],
                    end_time: params[3]
                };

                return await this.createGameSession(sessionData);
            }

            if (query.includes('INSERT INTO notification_configs')) {
                // Extrair dados da query para configurações de notificação
                const configData = {
                    game_id: params[0],
                    session_id: params[1],
                    notification_type: params[2],
                    total_notifications: params[3],
                    first_notification_time: params[4],
                    notification_interval_hours: params[5],
                    mensal_notifications: params[6],
                    group_chat_id: params[7]
                };

                return await this.createNotificationConfig(configData);
            }

            if (query.includes('INSERT INTO notifications_sent')) {
                // Extrair dados da query para notificações enviadas
                const notificationData = {
                    notification_config_id: params[0],
                    notification_number: params[1],
                    target_type: params[2],
                    message_content: params[3]
                };

                return await this.createNotificationSent(notificationData);
            }

            if (query.includes('INSERT INTO waiting_list')) {
                // Extrair dados da query para lista de espera
                const waitingListData = {
                    session_id: params[0],
                    player_id: params[1],
                    position: params[2]
                };

                return await this.createWaitingListEntry(waitingListData);
            }

            throw new Error('Query de inserção não suportada');
        } catch (error) {
            console.error('Erro ao inserir registro:', error);
            throw error;
        }
    }

    /**
     * Atualizar registro
     */
    async update(query, params = []) {
        try {
            if (query.includes('UPDATE games') && query.includes('SET')) {
                // Extrair o ID do jogo (último parâmetro)
                const gameId = params[params.length - 1];
                
                // Construir objeto de atualização baseado nos campos
                const updateData = {};
                
                // Extrair campos da query de forma mais robusta
                const setMatch = query.match(/SET (.+) WHERE/);
                if (setMatch) {
                    const setClause = setMatch[1];
                    
                    // Dividir por vírgula e processar cada campo
                    const fieldParts = setClause.split(',');
                    let paramIndex = 0;
                    
                    fieldParts.forEach(part => {
                        const trimmedPart = part.trim();
                        const fieldMatch = trimmedPart.match(/(\w+) = \?/);
                        
                        if (fieldMatch) {
                            const fieldName = fieldMatch[1];
                            if (fieldName !== 'updated_at' && paramIndex < params.length - 1) {
                                updateData[fieldName] = params[paramIndex];
                            }
                            paramIndex++;
                        }
                    });
                }
                
                // Se não conseguiu extrair campos, usar uma abordagem mais simples
                if (Object.keys(updateData).length === 0) {
                    // Assumir que o primeiro parâmetro é o campo a ser atualizado
                    if (params.length >= 2) {
                        // Para este caso específico, sabemos que é end_time
                        updateData['end_time'] = params[0];
                    }
                }
                return await this.updateGame(gameId, updateData);
            }

            throw new Error('Query de atualização não suportada');
        } catch (error) {
            console.error('Erro ao atualizar registro:', error);
            throw error;
        }
    }

    /**
     * Deletar registro
     */
    async delete(query, params = []) {
        try {
            // Implementar deleção baseada na query
            throw new Error('Query de deleção não suportada');
        } catch (error) {
            console.error('Erro ao deletar registro:', error);
            throw error;
        }
    }
}

module.exports = DatabaseSupabase;
