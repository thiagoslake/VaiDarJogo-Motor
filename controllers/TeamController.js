const moment = require('moment');

class TeamController {
    constructor(database) {
        this.db = database;
    }
    
    async createTeam(gameId, teamNumber, teamName = null) {
        try {
            const result = await this.db.run(`
                INSERT INTO teams (game_id, team_number, name)
                VALUES (?, ?, ?)
            `, [gameId, teamNumber, teamName || `Time ${teamNumber}`]);
            
            console.log(`Time ${teamNumber} criado para jogo ${gameId}`);
            return result;
        } catch (error) {
            console.error('Erro ao criar time:', error);
            throw error;
        }
    }
    
    async getTeamById(teamId) {
        try {
            return await this.db.get(`
                SELECT * FROM teams WHERE id = ?
            `, [teamId]);
        } catch (error) {
            console.error('Erro ao buscar time por ID:', error);
            throw error;
        }
    }
    
    async getTeamsByGame(gameId) {
        try {
            return await this.db.all(`
                SELECT * FROM teams 
                WHERE game_id = ?
                ORDER BY team_number ASC
            `, [gameId]);
        } catch (error) {
            console.error('Erro ao buscar times do jogo:', error);
            throw error;
        }
    }
    
    async getTeamWithPlayers(teamId) {
        try {
            const team = await this.getTeamById(teamId);
            if (!team) return null;
            
            const players = await this.db.all(`
                SELECT 
                    p.*,
                    tp.position as team_position,
                    tp.is_starter
                FROM players p
                JOIN team_players tp ON p.id = tp.player_id
                WHERE tp.team_id = ?
                ORDER BY tp.is_starter DESC, p.name ASC
            `, [teamId]);
            
            return {
                ...team,
                players
            };
        } catch (error) {
            console.error('Erro ao buscar time com jogadores:', error);
            throw error;
        }
    }
    
    async addPlayerToTeam(teamId, playerId, position = null, isStarter = true) {
        try {
            // Verificar se o jogador já está em outro time para este jogo
            const existingAssignment = await this.db.get(`
                SELECT tp.*, t.game_id 
                FROM team_players tp
                JOIN teams t ON tp.team_id = t.id
                WHERE tp.player_id = ? AND t.game_id = (
                    SELECT game_id FROM teams WHERE id = ?
                )
            `, [playerId, teamId]);
            
            if (existingAssignment) {
                throw new Error('Jogador já está em outro time para este jogo');
            }
            
            const result = await this.db.run(`
                INSERT INTO team_players (team_id, player_id, position, is_starter)
                VALUES (?, ?, ?, ?)
            `, [teamId, playerId, position, isStarter ? 1 : 0]);
            
            console.log(`Jogador ${playerId} adicionado ao time ${teamId}`);
            return result;
        } catch (error) {
            console.error('Erro ao adicionar jogador ao time:', error);
            throw error;
        }
    }
    
    async removePlayerFromTeam(teamId, playerId) {
        try {
            const result = await this.db.run(`
                DELETE FROM team_players 
                WHERE team_id = ? AND player_id = ?
            `, [teamId, playerId]);
            
            console.log(`Jogador ${playerId} removido do time ${teamId}`);
            return result;
        } catch (error) {
            console.error('Erro ao remover jogador do time:', error);
            throw error;
        }
    }
    
    async updatePlayerPosition(teamId, playerId, position, isStarter) {
        try {
            const result = await this.db.run(`
                UPDATE team_players 
                SET position = ?, is_starter = ?, updated_at = ?
                WHERE team_id = ? AND player_id = ?
            `, [position, isStarter ? 1 : 0, moment().format('YYYY-MM-DD HH:mm:ss'), teamId, playerId]);
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar posição do jogador:', error);
            throw error;
        }
    }
    
    async drawTeams(game, players) {
        try {
            const { id: gameId, players_per_team, number_of_teams, substitutes_per_team } = game;
            
            // Limpar times existentes para este jogo
            await this.clearTeamsForGame(gameId);
            
            // Criar novos times
            const teams = [];
            for (let i = 1; i <= number_of_teams; i++) {
                const team = await this.createTeam(gameId, i);
                teams.push({ id: team.id, teamNumber: i, players: [] });
            }
            
            // Algoritmo de sorteio balanceado
            const balancedTeams = await this.balancedTeamDraw(teams, players, players_per_team, substitutes_per_team);
            
            // Salvar jogadores nos times
            for (const team of balancedTeams) {
                for (const player of team.players) {
                    await this.addPlayerToTeam(
                        team.id, 
                        player.id, 
                        player.primary_position, 
                        player.isStarter
                    );
                }
            }
            
            return balancedTeams;
        } catch (error) {
            console.error('Erro ao sortear times:', error);
            throw error;
        }
    }
    
    async balancedTeamDraw(teams, players, playersPerTeam, substitutesPerTeam) {
        try {
            // Separar jogadores por posição
            const goalkeepers = players.filter(p => p.primary_position === 'Goleiro');
            const defenders = players.filter(p => p.primary_position === 'Zagueiro');
            const midfielders = players.filter(p => p.primary_position === 'Meio-campo');
            const forwards = players.filter(p => p.primary_position === 'Atacante');
            const unclassified = players.filter(p => !p.primary_position);
            
            // Distribuir goleiros primeiro (1 por time)
            for (let i = 0; i < Math.min(goalkeepers.length, teams.length); i++) {
                const player = goalkeepers[i];
                player.isStarter = true;
                teams[i].players.push(player);
            }
            
            // Distribuir jogadores de linha de forma balanceada
            const linePlayers = [...defenders, ...midfielders, ...forwards, ...unclassified];
            let teamIndex = 0;
            
            for (const player of linePlayers) {
                if (teams[teamIndex].players.length < playersPerTeam) {
                    player.isStarter = true;
                    teams[teamIndex].players.push(player);
                } else if (teams[teamIndex].players.length < playersPerTeam + substitutesPerTeam) {
                    player.isStarter = false;
                    teams[teamIndex].players.push(player);
                } else {
                    // Procurar próximo time com vaga
                    let found = false;
                    for (let i = 0; i < teams.length; i++) {
                        const nextIndex = (teamIndex + i) % teams.length;
                        if (teams[nextIndex].players.length < playersPerTeam + substitutesPerTeam) {
                            teamIndex = nextIndex;
                            player.isStarter = teams[nextIndex].players.length < playersPerTeam;
                            teams[nextIndex].players.push(player);
                            found = true;
                            break;
                        }
                    }
                    if (!found) break; // Todos os times estão cheios
                }
                
                teamIndex = (teamIndex + 1) % teams.length;
            }
            
            return teams;
        } catch (error) {
            console.error('Erro no sorteio balanceado:', error);
            throw error;
        }
    }
    
    async clearTeamsForGame(gameId) {
        try {
            // Remover jogadores dos times
            await this.db.run(`
                DELETE FROM team_players 
                WHERE team_id IN (SELECT id FROM teams WHERE game_id = ?)
            `, [gameId]);
            
            // Remover times
            await this.db.run(`
                DELETE FROM teams WHERE game_id = ?
            `, [gameId]);
            
            console.log(`Times limpos para jogo ${gameId}`);
        } catch (error) {
            console.error('Erro ao limpar times:', error);
            throw error;
        }
    }
    
    async getTeamBalance(gameId) {
        try {
            const teams = await this.db.all(`
                SELECT 
                    t.id,
                    t.team_number,
                    t.name,
                    COUNT(tp.player_id) as total_players,
                    SUM(CASE WHEN tp.is_starter = 1 THEN 1 ELSE 0 END) as starters,
                    SUM(CASE WHEN tp.is_starter = 0 THEN 1 ELSE 0 END) as substitutes,
                    GROUP_CONCAT(p.primary_position) as positions
                FROM teams t
                LEFT JOIN team_players tp ON t.id = tp.team_id
                LEFT JOIN players p ON tp.player_id = p.id
                WHERE t.game_id = ?
                GROUP BY t.id, t.team_number, t.name
                ORDER BY t.team_number
            `, [gameId]);
            
            return teams;
        } catch (error) {
            console.error('Erro ao buscar balanceamento dos times:', error);
            throw error;
        }
    }
    
    async swapPlayers(team1Id, player1Id, team2Id, player2Id) {
        try {
            // Verificar se os times são do mesmo jogo
            const team1 = await this.getTeamById(team1Id);
            const team2 = await this.getTeamById(team2Id);
            
            if (team1.game_id !== team2.game_id) {
                throw new Error('Times devem ser do mesmo jogo');
            }
            
            // Fazer a troca
            await this.db.run('BEGIN TRANSACTION');
            
            try {
                // Remover jogadores dos times atuais
                await this.removePlayerFromTeam(team1Id, player1Id);
                await this.removePlayerFromTeam(team2Id, player2Id);
                
                // Adicionar jogadores nos novos times
                await this.addPlayerToTeam(team2Id, player1Id);
                await this.addPlayerToTeam(team1Id, player2Id);
                
                await this.db.run('COMMIT');
                console.log('Troca de jogadores realizada com sucesso');
            } catch (error) {
                await this.db.run('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Erro ao trocar jogadores:', error);
            throw error;
        }
    }
    
    async getTeamStats(teamId) {
        try {
            const team = await this.getTeamById(teamId);
            if (!team) return null;
            
            const stats = await this.db.get(`
                SELECT 
                    COUNT(tp.player_id) as total_players,
                    SUM(CASE WHEN tp.is_starter = 1 THEN 1 ELSE 0 END) as starters,
                    SUM(CASE WHEN tp.is_starter = 0 THEN 1 ELSE 0 END) as substitutes,
                    COUNT(DISTINCT p.primary_position) as unique_positions
                FROM team_players tp
                JOIN players p ON tp.player_id = p.id
                WHERE tp.team_id = ?
            `, [teamId]);
            
            return {
                ...team,
                stats
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas do time:', error);
            throw error;
        }
    }
    
    async updateTeamName(teamId, newName) {
        try {
            const result = await this.db.run(`
                UPDATE teams 
                SET name = ? 
                WHERE id = ?
            `, [newName, teamId]);
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar nome do time:', error);
            throw error;
        }
    }
}

module.exports = TeamController;
