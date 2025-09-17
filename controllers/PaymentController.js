const moment = require('moment');

class PaymentController {
    constructor(database) {
        this.db = database;
    }
    
    async createPayment(paymentData) {
        try {
            const result = await this.db.run(`
                INSERT INTO payments (
                    player_id, game_id, amount, payment_date, 
                    payment_method, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                paymentData.player_id,
                paymentData.game_id,
                paymentData.amount,
                paymentData.payment_date || moment().format('YYYY-MM-DD'),
                paymentData.payment_method || 'Dinheiro',
                paymentData.notes || null
            ]);
            
            console.log(`Pagamento criado: R$ ${paymentData.amount} para jogador ${paymentData.player_id}`);
            return result;
        } catch (error) {
            console.error('Erro ao criar pagamento:', error);
            throw error;
        }
    }
    
    async getPaymentById(paymentId) {
        try {
            return await this.db.get(`
                SELECT 
                    p.*,
                    pl.name as player_name,
                    pl.phone_number as player_phone,
                    g.organization_name as game_organization
                FROM payments p
                JOIN players pl ON p.player_id = pl.id
                JOIN games g ON p.game_id = g.id
                WHERE p.id = ?
            `, [paymentId]);
        } catch (error) {
            console.error('Erro ao buscar pagamento por ID:', error);
            throw error;
        }
    }
    
    async getPaymentsByGame(gameId) {
        try {
            return await this.db.all(`
                SELECT 
                    p.*,
                    pl.name as player_name,
                    pl.phone_number as player_phone,
                    pl.type as player_type
                FROM payments p
                JOIN players pl ON p.player_id = pl.id
                WHERE p.game_id = ?
                ORDER BY p.created_at DESC
            `, [gameId]);
        } catch (error) {
            console.error('Erro ao buscar pagamentos do jogo:', error);
            throw error;
        }
    }
    
    async getPaymentsByPlayer(playerId) {
        try {
            return await this.db.all(`
                SELECT 
                    p.*,
                    g.organization_name as game_organization,
                    g.game_date
                FROM payments p
                JOIN games g ON p.game_id = g.id
                WHERE p.player_id = ?
                ORDER BY p.created_at DESC
            `, [playerId]);
        } catch (error) {
            console.error('Erro ao buscar pagamentos do jogador:', error);
            throw error;
        }
    }
    
    async getPendingPayments(gameId = null) {
        try {
            let query = `
                SELECT 
                    p.*,
                    pl.name as player_name,
                    pl.phone_number as player_phone,
                    pl.type as player_type,
                    g.organization_name as game_organization,
                    g.game_date
                FROM payments p
                JOIN players pl ON p.player_id = pl.id
                JOIN games g ON p.game_id = g.id
                WHERE p.status = 'pending'
            `;
            
            const params = [];
            if (gameId) {
                query += ' AND p.game_id = ?';
                params.push(gameId);
            }
            
            query += ' ORDER BY p.created_at ASC';
            
            return await this.db.all(query, params);
        } catch (error) {
            console.error('Erro ao buscar pagamentos pendentes:', error);
            throw error;
        }
    }
    
    async getPaidPayments(gameId = null) {
        try {
            let query = `
                SELECT 
                    p.*,
                    pl.name as player_name,
                    pl.phone_number as player_phone,
                    pl.type as player_type,
                    g.organization_name as game_organization,
                    g.game_date
                FROM payments p
                JOIN players pl ON p.player_id = pl.id
                JOIN games g ON p.game_id = g.id
                WHERE p.status = 'paid'
            `;
            
            const params = [];
            if (gameId) {
                query += ' AND p.game_id = ?';
                params.push(gameId);
            }
            
            query += ' ORDER BY p.payment_date DESC';
            
            return await this.db.all(query, params);
        } catch (error) {
            console.error('Erro ao buscar pagamentos realizados:', error);
            throw error;
        }
    }
    
    async updatePaymentStatus(paymentId, status, paymentDate = null) {
        try {
            const result = await this.db.run(`
                UPDATE payments 
                SET status = ?, payment_date = ?, updated_at = ?
                WHERE id = ?
            `, [
                status,
                paymentDate || moment().format('YYYY-MM-DD'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
                paymentId
            ]);
            
            console.log(`Status do pagamento ${paymentId} atualizado para: ${status}`);
            return result;
        } catch (error) {
            console.error('Erro ao atualizar status do pagamento:', error);
            throw error;
        }
    }
    
    async markPaymentAsPaid(paymentId, paymentMethod = null, notes = null) {
        try {
            const result = await this.db.run(`
                UPDATE payments 
                SET status = 'paid', 
                    payment_date = ?, 
                    payment_method = ?,
                    notes = ?,
                    updated_at = ?
                WHERE id = ?
            `, [
                moment().format('YYYY-MM-DD'),
                paymentMethod || 'Dinheiro',
                notes,
                moment().format('YYYY-MM-DD HH:mm:ss'),
                paymentId
            ]);
            
            return result;
        } catch (error) {
            console.error('Erro ao marcar pagamento como pago:', error);
            throw error;
        }
    }
    
    async cancelPayment(paymentId, reason = null) {
        try {
            const result = await this.db.run(`
                UPDATE payments 
                SET status = 'cancelled', 
                    notes = ?, 
                    updated_at = ?
                WHERE id = ?
            `, [
                reason || 'Pagamento cancelado',
                moment().format('YYYY-MM-DD HH:mm:ss'),
                paymentId
            ]);
            
            return result;
        } catch (error) {
            console.error('Erro ao cancelar pagamento:', error);
            throw error;
        }
    }
    
    async getPaymentStats(gameId = null) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_payments,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
                    AVG(CASE WHEN status = 'paid' THEN amount ELSE NULL END) as average_payment
                FROM payments
            `;
            
            const params = [];
            if (gameId) {
                query += ' WHERE game_id = ?';
                params.push(gameId);
            }
            
            return await this.db.get(query, params);
        } catch (error) {
            console.error('Erro ao buscar estatísticas de pagamentos:', error);
            throw error;
        }
    }
    
    async generatePaymentReport(gameId, startDate = null, endDate = null) {
        try {
            let query = `
                SELECT 
                    p.*,
                    pl.name as player_name,
                    pl.phone_number as player_phone,
                    pl.type as player_type,
                    g.organization_name as game_organization,
                    g.game_date,
                    pc.monthly_player_price,
                    pc.casual_player_price
                FROM payments p
                JOIN players pl ON p.player_id = pl.id
                JOIN games g ON p.game_id = g.id
                -- price_config agora está na tabela games como JSONB
                WHERE p.game_id = ?
            `;
            
            const params = [gameId];
            
            if (startDate) {
                query += ' AND p.created_at >= ?';
                params.push(startDate);
            }
            
            if (endDate) {
                query += ' AND p.created_at <= ?';
                params.push(endDate);
            }
            
            query += ' ORDER BY p.created_at ASC';
            
            const payments = await this.db.all(query, params);
            
            // Calcular totais
            const totals = {
                total_payments: payments.length,
                paid_amount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
                pending_amount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
                cancelled_amount: payments.filter(p => p.status === 'cancelled').reduce((sum, p) => sum + p.amount, 0),
                monthly_players: payments.filter(p => p.player_type === 'monthly').length,
                casual_players: payments.filter(p => p.player_type === 'casual').length
            };
            
            return {
                payments,
                totals,
                summary: {
                    game: await this.db.get('SELECT * FROM games WHERE id = ?', [gameId]),
                    price_config: (await this.db.get('SELECT price_config FROM games WHERE id = ?', [gameId]))?.price_config
                }
            };
        } catch (error) {
            console.error('Erro ao gerar relatório de pagamentos:', error);
            throw error;
        }
    }
    
    async createBulkPayments(gameId, playerIds, amounts) {
        try {
            await this.db.run('BEGIN TRANSACTION');
            
            try {
                const results = [];
                for (let i = 0; i < playerIds.length; i++) {
                    const result = await this.createPayment({
                        player_id: playerIds[i],
                        game_id: gameId,
                        amount: amounts[i] || 0,
                        payment_date: moment().format('YYYY-MM-DD')
                    });
                    results.push(result);
                }
                
                await this.db.run('COMMIT');
                console.log(`${results.length} pagamentos criados em lote`);
                return results;
            } catch (error) {
                await this.db.run('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Erro ao criar pagamentos em lote:', error);
            throw error;
        }
    }
    
    async getPaymentMethods() {
        try {
            const result = await this.db.all(`
                SELECT DISTINCT payment_method 
                FROM payments 
                WHERE payment_method IS NOT NULL
                ORDER BY payment_method
            `);
            
            return result.map(r => r.payment_method);
        } catch (error) {
            console.error('Erro ao buscar métodos de pagamento:', error);
            return ['Dinheiro', 'PIX', 'Cartão', 'Transferência'];
        }
    }
    
    async getPaymentHistory(limit = 50) {
        try {
            return await this.db.all(`
                SELECT 
                    p.*,
                    pl.name as player_name,
                    pl.phone_number as player_phone,
                    g.organization_name as game_organization,
                    g.game_date
                FROM payments p
                JOIN players pl ON p.player_id = pl.id
                JOIN games g ON p.game_id = g.id
                ORDER BY p.created_at DESC
                LIMIT ?
            `, [limit]);
        } catch (error) {
            console.error('Erro ao buscar histórico de pagamentos:', error);
            throw error;
        }
    }
    
    async getPlayerPaymentSummary(playerId) {
        try {
            const summary = await this.db.get(`
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
                    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
                    AVG(CASE WHEN status = 'paid' THEN amount ELSE NULL END) as average_payment
                FROM payments 
                WHERE player_id = ?
            `, [playerId]);
            
            const recentPayments = await this.db.all(`
                SELECT 
                    p.*,
                    g.organization_name as game_organization,
                    g.game_date
                FROM payments p
                JOIN games g ON p.game_id = g.id
                WHERE p.player_id = ?
                ORDER BY p.created_at DESC
                LIMIT 5
            `, [playerId]);
            
            return {
                summary,
                recentPayments
            };
        } catch (error) {
            console.error('Erro ao buscar resumo de pagamentos do jogador:', error);
            throw error;
        }
    }
    
    async deletePayment(paymentId) {
        try {
            const result = await this.db.run(`
                DELETE FROM payments WHERE id = ?
            `, [paymentId]);
            
            console.log(`Pagamento ${paymentId} deletado`);
            return result;
        } catch (error) {
            console.error('Erro ao deletar pagamento:', error);
            throw error;
        }
    }
}

module.exports = PaymentController;
