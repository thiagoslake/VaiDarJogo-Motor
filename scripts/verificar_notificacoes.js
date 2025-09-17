#!/usr/bin/env node

/**
 * 🔍 VERIFICAR NOTIFICAÇÕES
 * 
 * Este script verifica se as notificações estão sendo salvas
 * corretamente com o player_id.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class VerificarNotificacoes {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async verificarNotificacoes() {
        try {
            console.log('🔍 ===== VERIFICANDO NOTIFICAÇÕES =====\n');
            
            // 1. Verificar notificações recentes
            await this.verificarNotificacoesRecentes();
            
            // 2. Verificar notificações com player_id
            await this.verificarNotificacoesComPlayerId();
            
            // 3. Verificar notificações sem player_id
            await this.verificarNotificacoesSemPlayerId();
            
            console.log('\n🔍 ===== VERIFICAÇÃO CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a verificação:', error);
        }
    }

    /**
     * 1. Verificar notificações recentes
     */
    async verificarNotificacoesRecentes() {
        try {
            console.log('📊 1. NOTIFICAÇÕES RECENTES (últimas 2 horas):');
            
            const duasHorasAtras = moment().subtract(2, 'hours').toISOString();
            
            const { data: notificacoes, error } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    game_id,
                    player_id,
                    type,
                    title,
                    message,
                    status,
                    sent_at,
                    created_at,
                    players!inner(
                        id,
                        name,
                        phone_number
                    )
                `)
                .gte('created_at', duasHorasAtras)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.log('   ❌ Erro ao buscar notificações:', error.message);
                return;
            }
            
            if (!notificacoes || notificacoes.length === 0) {
                console.log('   📝 Nenhuma notificação encontrada nas últimas 2 horas');
                return;
            }
            
            console.log(`   📊 Notificações encontradas: ${notificacoes.length}`);
            notificacoes.forEach((notif, index) => {
                const sentAt = notif.sent_at ? moment(notif.sent_at).format('DD/MM/YYYY HH:mm:ss') : 'Não enviada';
                console.log(`   ${index + 1}. ${notif.players.name} (${notif.players.phone_number})`);
                console.log(`      🆔 Player ID: ${notif.player_id}`);
                console.log(`      🎮 Game ID: ${notif.game_id}`);
                console.log(`      📝 Tipo: ${notif.type}`);
                console.log(`      📅 Enviada: ${sentAt}`);
                console.log(`      📄 Mensagem: ${notif.message.substring(0, 50)}...`);
                console.log('');
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar notificações recentes:', error);
        }
    }

    /**
     * 2. Verificar notificações com player_id
     */
    async verificarNotificacoesComPlayerId() {
        try {
            console.log('\n✅ 2. NOTIFICAÇÕES COM PLAYER_ID:');
            
            const { data: notificacoes, error } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    player_id,
                    type,
                    title,
                    players!inner(
                        name,
                        phone_number
                    )
                `)
                .not('player_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) {
                console.log('   ❌ Erro ao buscar notificações com player_id:', error.message);
                return;
            }
            
            if (!notificacoes || notificacoes.length === 0) {
                console.log('   📝 Nenhuma notificação com player_id encontrada');
                return;
            }
            
            console.log(`   📊 Notificações com player_id: ${notificacoes.length}`);
            notificacoes.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.players.name} - ID: ${notif.player_id}`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar notificações com player_id:', error);
        }
    }

    /**
     * 3. Verificar notificações sem player_id
     */
    async verificarNotificacoesSemPlayerId() {
        try {
            console.log('\n❌ 3. NOTIFICAÇÕES SEM PLAYER_ID:');
            
            const { data: notificacoes, error } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    player_id,
                    type,
                    title,
                    created_at
                `)
                .is('player_id', null)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) {
                console.log('   ❌ Erro ao buscar notificações sem player_id:', error.message);
                return;
            }
            
            if (!notificacoes || notificacoes.length === 0) {
                console.log('   ✅ Nenhuma notificação sem player_id encontrada');
                return;
            }
            
            console.log(`   📊 Notificações sem player_id: ${notificacoes.length}`);
            notificacoes.forEach((notif, index) => {
                const createdAt = moment(notif.created_at).format('DD/MM/YYYY HH:mm:ss');
                console.log(`   ${index + 1}. ID: ${notif.id} - ${notif.type} - ${createdAt}`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar notificações sem player_id:', error);
        }
    }
}

// Executar verificação
async function main() {
    const verificador = new VerificarNotificacoes();
    await verificador.verificarNotificacoes();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = VerificarNotificacoes;

