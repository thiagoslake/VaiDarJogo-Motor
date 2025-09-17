const moment = require('moment');

class PlayerController {
    constructor(database) {
        this.db = database;
    }
    
    // Converter data de DD/MM/AAAA para AAAA-MM-DD
    convertDateFormat(dateString) {
        if (!dateString) return null;
        
        // Se já está no formato correto, retornar como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Converter de DD/MM/AAAA para AAAA-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month}-${day}`;
        }
        
        // Se não conseguir converter, retornar null
        console.warn(`Formato de data inválido: ${dateString}`);
        return null;
    }
    
    async createMonthlyPlayer(playerData) {
        try {
            // Converter data para formato correto
            const convertedBirthDate = this.convertDateFormat(playerData.birthDate);
            
            const result = await this.db.createPlayer({
                name: playerData.playerName,
                phone_number: playerData.phoneNumber,
                type: 'monthly',
                birth_date: convertedBirthDate,
                primary_position: playerData.primaryPosition,
                secondary_position: playerData.secondaryPosition,
                preferred_foot: playerData.preferredFoot
            });
            
            console.log(`Jogador mensalista criado: ${playerData.playerName}`);
            return result;
        } catch (error) {
            console.error('Erro ao criar jogador mensalista:', error);
            throw error;
        }
    }
    
    async createCasualPlayer(playerData) {
        try {
            const result = await this.db.createPlayer({
                name: playerData.playerName,
                phone_number: playerData.phoneNumber,
                type: 'casual',
                birth_date: null,
                primary_position: null,
                secondary_position: null,
                preferred_foot: null
            });
            
            console.log(`Jogador avulso criado: ${playerData.playerName}`);
            return result;
        } catch (error) {
            console.error('Erro ao criar jogador avulso:', error);
            throw error;
        }
    }
    
    async getPlayerById(playerId) {
        try {
            return await this.db.get(`
                SELECT * FROM players WHERE id = ? AND status = 'active'
            `, [playerId]);
        } catch (error) {
            console.error('Erro ao buscar jogador por ID:', error);
            throw error;
        }
    }
    
    async getPlayerByPhone(phoneNumber) {
        try {
            return await this.db.getPlayerByPhone(phoneNumber);
        } catch (error) {
            console.error('Erro ao buscar jogador por telefone:', error);
            throw error;
        }
    }
    
    async getAllPlayers() {
        try {
            return await this.db.all(`
                SELECT * FROM players 
                WHERE status = 'active'
                ORDER BY name ASC
            `);
        } catch (error) {
            console.error('Erro ao buscar todos os jogadores:', error);
            throw error;
        }
    }
    
    async getMonthlyPlayers() {
        try {
            return await this.db.getMonthlyPlayers();
        } catch (error) {
            console.error('Erro ao buscar jogadores mensalistas:', error);
            throw error;
        }
    }
    
    async getCasualPlayers() {
        try {
            return await this.db.getCasualPlayers();
        } catch (error) {
            console.error('Erro ao buscar jogadores avulsos:', error);
            throw error;
        }
    }
    
    async getAvailablePlayers() {
        try {
            return await this.db.all(`
                SELECT * FROM players 
                WHERE status = 'active'
                ORDER BY RANDOM()
            `);
        } catch (error) {
            console.error('Erro ao buscar jogadores disponíveis:', error);
            throw error;
        }
    }
    
    async updatePlayer(playerId, updateData) {
        try {
            const fields = [];
            const values = [];
            
            // Construir query dinamicamente
            Object.keys(updateData).forEach(key => {
                if (key !== 'id' && key !== 'created_at' && key !== 'type') {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });
            
            values.push(moment().format('YYYY-MM-DD HH:mm:ss')); // updated_at
            values.push(playerId);
            
            const result = await this.db.run(`
                UPDATE players 
                SET ${fields.join(', ')}, updated_at = ? 
                WHERE id = ?
            `, values);
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    }
    
    async updatePlayerClassification(playerId, primaryPosition, secondaryPosition, preferredFoot) {
        try {
            const result = await this.db.run(`
                UPDATE players 
                SET primary_position = ?, secondary_position = ?, 
                    preferred_foot = ?, updated_at = ?
                WHERE id = ?
            `, [
                primaryPosition,
                secondaryPosition,
                preferredFoot,
                moment().format('YYYY-MM-DD HH:mm:ss'),
                playerId
            ]);
            
            console.log(`Classificação atualizada para jogador ID: ${playerId}`);
            return result;
        } catch (error) {
            console.error('Erro ao atualizar classificação do jogador:', error);
            throw error;
        }
    }
    
    async deletePlayer(playerId) {
        try {
            // Soft delete - apenas marcar como inativo
            const result = await this.db.run(`
                UPDATE players 
                SET status = 'inactive', updated_at = ? 
                WHERE id = ?
            `, [moment().format('YYYY-MM-DD HH:mm:ss'), playerId]);
            
            return result;
        } catch (error) {
            console.error('Erro ao deletar jogador:', error);
            throw error;
        }
    }
    
    async searchPlayers(query) {
        try {
            const searchTerm = `%${query}%`;
            return await this.db.all(`
                SELECT * FROM players 
                WHERE (name LIKE ? OR phone_number LIKE ?) 
                AND status = 'active'
                ORDER BY name ASC
            `, [searchTerm, searchTerm]);
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
            throw error;
        }
    }
    
    async getPlayersByPosition(position) {
        try {
            return await this.db.all(`
                SELECT * FROM players 
                WHERE (primary_position = ? OR secondary_position = ?) 
                AND status = 'active'
                ORDER BY name ASC
            `, [position, position]);
        } catch (error) {
            console.error('Erro ao buscar jogadores por posição:', error);
            throw error;
        }
    }
    
    async getPlayersByType(type) {
        try {
            return await this.db.all(`
                SELECT * FROM players 
                WHERE type = ? AND status = 'active'
                ORDER BY name ASC
            `, [type]);
        } catch (error) {
            console.error('Erro ao buscar jogadores por tipo:', error);
            throw error;
        }
    }
    
    async getPlayerStats(playerId) {
        try {
            const player = await this.getPlayerById(playerId);
            if (!player) return null;
            
            // Buscar estatísticas de participação em times
            const teamStats = await this.db.get(`
                SELECT 
                    COUNT(DISTINCT t.game_id) as total_games,
                    COUNT(tp.id) as total_team_assignments,
                    SUM(CASE WHEN tp.is_starter = 1 THEN 1 ELSE 0 END) as times_as_starter
                FROM teams t
                JOIN team_players tp ON t.id = tp.team_id
                WHERE tp.player_id = ?
            `, [playerId]);
            
            // Buscar estatísticas de pagamentos
            const paymentStats = await this.db.get(`
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid
                FROM payments 
                WHERE player_id = ?
            `, [playerId]);
            
            return {
                player,
                teams: teamStats,
                payments: paymentStats
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas do jogador:', error);
            throw error;
        }
    }
    
    async getPlayerCount() {
        try {
            const result = await this.db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN type = 'monthly' THEN 1 ELSE 0 END) as monthly,
                    SUM(CASE WHEN type = 'casual' THEN 1 ELSE 0 END) as casual
                FROM players 
                WHERE status = 'active'
            `);
            
            return result;
        } catch (error) {
            console.error('Erro ao buscar contagem de jogadores:', error);
            throw error;
        }
    }
    
    async getPlayersByAgeRange(minAge, maxAge) {
        try {
            const today = moment();
            const minDate = today.subtract(maxAge, 'years').format('YYYY-MM-DD');
            const maxDate = today.subtract(minAge, 'years').format('YYYY-MM-DD');
            
            return await this.db.all(`
                SELECT * FROM players 
                WHERE birth_date BETWEEN ? AND ? 
                AND status = 'active'
                ORDER BY birth_date ASC
            `, [minDate, maxDate]);
        } catch (error) {
            console.error('Erro ao buscar jogadores por faixa etária:', error);
            throw error;
        }
    }
    
    async getPlayersByPreferredFoot(foot) {
        try {
            return await this.db.all(`
                SELECT * FROM players 
                WHERE preferred_foot = ? AND status = 'active'
                ORDER BY name ASC
            `, [foot]);
        } catch (error) {
            console.error('Erro ao buscar jogadores por perna preferida:', error);
            throw error;
        }
    }
    
    async bulkUpdatePlayerStatus(playerIds, status) {
        try {
            const placeholders = playerIds.map(() => '?').join(',');
            const values = [...playerIds, moment().format('YYYY-MM-DD HH:mm:ss')];
            
            const result = await this.db.run(`
                UPDATE players 
                SET status = ?, updated_at = ? 
                WHERE id IN (${placeholders})
            `, [status, ...values]);
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar status de jogadores em lote:', error);
            throw error;
        }
    }
}

module.exports = PlayerController;
