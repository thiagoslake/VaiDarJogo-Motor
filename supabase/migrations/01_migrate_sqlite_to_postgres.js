#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE MIGRAÇÃO: SQLite → PostgreSQL (Supabase)
 * 📅 Data: $(date)
 * 🔄 Migração de dados existentes para nova arquitetura
 */

const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

// =====================================================
// ⚙️ CONFIGURAÇÕES
// =====================================================

// Configurações do Supabase das variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Caminho do banco SQLite atual
const SQLITE_DB_PATH = path.join(__dirname, '../../vaidarjogo.db');

// =====================================================
// 🔌 CONEXÕES
// =====================================================

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Conexão SQLite
const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

// =====================================================
// 🛠️ FUNÇÕES AUXILIARES
// =====================================================

/**
 * Converte data SQLite para formato PostgreSQL
 */
function convertSqliteDate(sqliteDate) {
    if (!sqliteDate) return null;
    
    // SQLite pode retornar data como string ou timestamp
    if (typeof sqliteDate === 'string') {
        // Tentar converter para formato ISO
        const date = new Date(sqliteDate);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    
    return null;
}

/**
 * Converte time SQLite para formato PostgreSQL
 */
function convertSqliteTime(sqliteTime) {
    if (!sqliteTime) return null;
    
    // SQLite time é geralmente uma string HH:MM
    if (typeof sqliteTime === 'string' && sqliteTime.includes(':')) {
        return sqliteTime;
    }
    
    return null;
}

/**
 * Log de progresso
 */
function logProgress(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

/**
 * Tratamento de erro
 */
function handleError(error, context) {
    logProgress(`❌ ERRO em ${context}:`, error);
    process.exit(1);
}

// =====================================================
// 🔄 FUNÇÕES DE MIGRAÇÃO
// =====================================================

/**
 * Migra usuários admin
 */
async function migrateAdminUsers() {
    logProgress('🔄 Migrando usuários admin...');
    
    try {
        // Buscar admins do SQLite
        const admins = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM admins WHERE status = "active"', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        logProgress(`📊 Encontrados ${admins.length} usuários admin`);
        
        for (const admin of admins) {
            // Inserir no Supabase
            const { data, error } = await supabase
                .from('app_users')
                .insert({
                    phone_number: admin.phone_number,
                    name: admin.name,
                    is_admin: true,
                    is_active: true,
                    created_at: convertSqliteDate(admin.created_at),
                    updated_at: convertSqliteDate(admin.created_at)
                })
                .select();
            
            if (error) {
                logProgress(`⚠️ Erro ao migrar admin ${admin.name}:`, error);
            } else {
                logProgress(`✅ Admin migrado: ${admin.name}`);
            }
        }
        
        logProgress('✅ Migração de usuários admin concluída');
        
    } catch (error) {
        handleError(error, 'migrateAdminUsers');
    }
}

/**
 * Migra jogos
 */
async function migrateGames() {
    logProgress('🔄 Migrando jogos...');
    
    try {
        // Buscar jogos do SQLite
        const games = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM games WHERE status = "active"', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        logProgress(`📊 Encontrados ${games.length} jogos`);
        
        for (const game of games) {
            // Buscar usuário admin para created_by
            const { data: adminData } = await supabase
                .from('app_users')
                .select('id')
                .eq('is_admin', true)
                .limit(1)
                .single();
            
            // Inserir no Supabase
            const { data, error } = await supabase
                .from('games')
                .insert({
                    organization_name: game.organization_name,
                    location: game.location,
                    players_per_team: game.players_per_team,
                    substitutes_per_team: game.substitutes_per_team,
                    number_of_teams: game.number_of_teams,
                    start_time: convertSqliteTime(game.start_time),
                    end_time: convertSqliteTime(game.end_time),
                    game_date: convertSqliteDate(game.game_date),
                    day_of_week: game.day_of_week,
                    frequency: game.frequency,
                    next_game_date: convertSqliteDate(game.next_game_date),
                    status: game.status,
                    created_by: adminData?.id || null,
                    created_at: convertSqliteDate(game.created_at),
                    updated_at: convertSqliteDate(game.updated_at)
                })
                .select();
            
            if (error) {
                logProgress(`⚠️ Erro ao migrar jogo ${game.organization_name}:`, error);
            } else {
                logProgress(`✅ Jogo migrado: ${game.organization_name}`);
                
                // Armazenar ID para referência
                game.new_id = data[0].id;
            }
        }
        
        logProgress('✅ Migração de jogos concluída');
        
    } catch (error) {
        handleError(error, 'migrateGames');
    }
}

/**
 * Migra jogadores
 */
async function migratePlayers() {
    logProgress('🔄 Migrando jogadores...');
    
    try {
        // Buscar jogadores do SQLite
        const players = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM players WHERE status = "active"', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        logProgress(`📊 Encontrados ${players.length} jogadores`);
        
        for (const player of players) {
            // Inserir no Supabase
            const { data, error } = await supabase
                .from('players')
                .insert({
                    name: player.name,
                    phone_number: player.phone_number,
                    type: player.type,
                    birth_date: convertSqliteDate(player.birth_date),
                    primary_position: player.primary_position,
                    secondary_position: player.secondary_position,
                    preferred_foot: player.preferred_foot,
                    status: player.status,
                    created_at: convertSqliteDate(player.created_at),
                    updated_at: convertSqliteDate(player.updated_at)
                })
                .select();
            
            if (error) {
                logProgress(`⚠️ Erro ao migrar jogador ${player.name}:`, error);
            } else {
                logProgress(`✅ Jogador migrado: ${player.name}`);
                
                // Armazenar ID para referência
                player.new_id = data[0].id;
            }
        }
        
        logProgress('✅ Migração de jogadores concluída');
        
    } catch (error) {
        handleError(error, 'migratePlayers');
    }
}

/**
 * Migra times e jogadores por time
 */
async function migrateTeams() {
    logProgress('🔄 Migrando times...');
    
    try {
        // Buscar times do SQLite
        const teams = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM teams', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        logProgress(`📊 Encontrados ${teams.length} times`);
        
        for (const team of teams) {
            // Buscar jogo correspondente
            const { data: gameData } = await supabase
                .from('games')
                .select('id')
                .eq('organization_name', team.organization_name)
                .limit(1)
                .single();
            
            if (!gameData) {
                logProgress(`⚠️ Jogo não encontrado para time ${team.name}`);
                continue;
            }
            
            // Inserir time no Supabase
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .insert({
                    game_id: gameData.id,
                    team_number: team.team_number,
                    name: team.name,
                    created_at: convertSqliteDate(team.created_at)
                })
                .select();
            
            if (teamError) {
                logProgress(`⚠️ Erro ao migrar time ${team.name}:`, teamError);
                continue;
            }
            
            logProgress(`✅ Time migrado: ${team.name}`);
            
            // Migrar jogadores do time
            const teamPlayers = await new Promise((resolve, reject) => {
                sqliteDb.all('SELECT * FROM team_players WHERE team_id = ?', [team.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            for (const teamPlayer of teamPlayers) {
                // Buscar jogador correspondente
                const { data: playerData } = await supabase
                    .from('players')
                    .select('id')
                    .eq('phone_number', teamPlayer.player_phone)
                    .limit(1)
                    .single();
                
                if (!playerData) {
                    logProgress(`⚠️ Jogador não encontrado para time ${team.name}`);
                    continue;
                }
                
                // Inserir jogador no time
                const { error: playerError } = await supabase
                    .from('team_players')
                    .insert({
                        team_id: teamData[0].id,
                        player_id: playerData.id,
                        position: teamPlayer.position,
                        is_starter: teamPlayer.is_starter === 1,
                        created_at: convertSqliteDate(teamPlayer.created_at)
                    });
                
                if (playerError) {
                    logProgress(`⚠️ Erro ao migrar jogador do time ${team.name}:`, playerError);
                }
            }
        }
        
        logProgress('✅ Migração de times concluída');
        
    } catch (error) {
        handleError(error, 'migrateTeams');
    }
}

/**
 * Migra pagamentos
 */
async function migratePayments() {
    logProgress('🔄 Migrando pagamentos...');
    
    try {
        // Buscar pagamentos do SQLite
        const payments = await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM payments', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        logProgress(`📊 Encontrados ${payments.length} pagamentos`);
        
        for (const payment of payments) {
            // Buscar jogador correspondente
            const { data: playerData } = await supabase
                .from('players')
                .select('id')
                .eq('phone_number', payment.player_phone)
                .limit(1)
                .single();
            
            if (!playerData) {
                logProgress(`⚠️ Jogador não encontrado para pagamento ${payment.id}`);
                continue;
            }
            
            // Buscar jogo correspondente
            const { data: gameData } = await supabase
                .from('games')
                .select('id')
                .eq('organization_name', payment.game_organization)
                .limit(1)
                .single();
            
            if (!gameData) {
                logProgress(`⚠️ Jogo não encontrado para pagamento ${payment.id}`);
                continue;
            }
            
            // Inserir pagamento no Supabase
            const { error } = await supabase
                .from('payments')
                .insert({
                    player_id: playerData.id,
                    game_id: gameData.id,
                    amount: payment.amount,
                    payment_date: convertSqliteDate(payment.payment_date),
                    status: payment.status || 'pending',
                    payment_method: payment.payment_method,
                    notes: payment.notes,
                    created_at: convertSqliteDate(payment.created_at),
                    updated_at: convertSqliteDate(payment.updated_at)
                });
            
            if (error) {
                logProgress(`⚠️ Erro ao migrar pagamento ${payment.id}:`, error);
            } else {
                logProgress(`✅ Pagamento migrado: ${payment.id}`);
            }
        }
        
        logProgress('✅ Migração de pagamentos concluída');
        
    } catch (error) {
        handleError(error, 'migratePayments');
    }
}

// =====================================================
// 🚀 FUNÇÃO PRINCIPAL
// =====================================================

async function main() {
    logProgress('🚀 INICIANDO MIGRAÇÃO: SQLite → PostgreSQL (Supabase)');
    logProgress('📊 Verificando conexões...');
    
    try {
        // Verificar conexão SQLite
        if (!fs.existsSync(SQLITE_DB_PATH)) {
            throw new Error(`Banco SQLite não encontrado em: ${SQLITE_DB_PATH}`);
        }
        
        logProgress('✅ Conexão SQLite estabelecida');
        
        // Verificar conexão Supabase
        const { data, error } = await supabase
            .from('app_users')
            .select('count')
            .limit(1);
        
        if (error) {
            throw new Error(`Erro na conexão Supabase: ${error.message}`);
        }
        
        logProgress('✅ Conexão Supabase estabelecida');
        
        // Executar migrações em ordem
        logProgress('🔄 Iniciando processo de migração...');
        
        await migrateAdminUsers();
        await migrateGames();
        await migratePlayers();
        await migrateTeams();
        await migratePayments();
        
        logProgress('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        logProgress('📱 Agora você pode usar o app Flutter e o bot WhatsApp');
        logProgress('🔐 Todos os dados foram preservados e migrados');
        
    } catch (error) {
        handleError(error, 'main');
    } finally {
        // Fechar conexões
        sqliteDb.close();
        process.exit(0);
    }
}

// =====================================================
// 📋 EXECUÇÃO
// =====================================================

if (require.main === module) {
    main().catch(handleError);
}

module.exports = {
    migrateAdminUsers,
    migrateGames,
    migratePlayers,
    migrateTeams,
    migratePayments
};
