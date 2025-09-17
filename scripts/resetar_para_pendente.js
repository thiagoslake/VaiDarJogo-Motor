#!/usr/bin/env node

/**
 * 🔄 RESETAR PARA PENDENTE
 * 
 * Este script reseta uma confirmação para status "pending"
 * para testar os novos termos da lista.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class ResetarParaPendente {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async resetarParaPendente() {
        try {
            console.log('🔄 ===== RESETANDO PARA PENDENTE =====\n');
            
            // 1. Buscar confirmação existente
            const confirmacao = await this.buscarConfirmacaoExistente();
            if (!confirmacao) {
                console.log('❌ Nenhuma confirmação encontrada');
                return;
            }
            
            // 2. Resetar para pendente
            await this.resetarStatus(confirmacao);
            
            // 3. Testar lista com novos termos
            await this.testarListaNovosTermos(confirmacao.session_id);
            
            console.log('\n🔄 ===== RESET CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o reset:', error);
        }
    }

    /**
     * 1. Buscar confirmação existente
     */
    async buscarConfirmacaoExistente() {
        try {
            console.log('🔍 1. BUSCANDO CONFIRMAÇÃO EXISTENTE:');
            
            const { data: confirmacoes, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    id,
                    session_id,
                    player_id,
                    player_phone,
                    player_type,
                    status,
                    players!inner(
                        name,
                        phone_number,
                        type
                    )
                `)
                .limit(1);
            
            if (error || !confirmacoes || confirmacoes.length === 0) {
                console.log('   ❌ Erro ao buscar confirmações:', error?.message);
                return null;
            }
            
            const confirmacao = confirmacoes[0];
            console.log(`   ✅ Confirmação encontrada: ${confirmacao.id}`);
            console.log(`   👤 Jogador: ${confirmacao.players.name} (${confirmacao.players.phone_number})`);
            console.log(`   📱 Telefone: ${confirmacao.player_phone}`);
            console.log(`   🎯 Status atual: ${confirmacao.status}`);
            
            return confirmacao;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar confirmação existente:', error);
            return null;
        }
    }

    /**
     * 2. Resetar status para pendente
     */
    async resetarStatus(confirmacao) {
        try {
            console.log('\n🔄 2. RESETANDO STATUS PARA PENDENTE:');
            
            const { error } = await this.supabase
                .from('participation_confirmations')
                .update({
                    status: 'pending',
                    confirmed_at: null,
                    declined_at: null,
                    updated_at: moment().toISOString()
                })
                .eq('session_id', confirmacao.session_id)
                .eq('player_phone', confirmacao.player_phone);
            
            if (error) {
                console.log('   ❌ Erro ao resetar status:', error.message);
                return;
            }
            
            console.log(`   ✅ Status resetado para "pending" para ${confirmacao.players.name}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao resetar status:', error);
        }
    }

    /**
     * 3. Testar lista com novos termos
     */
    async testarListaNovosTermos(sessionId) {
        try {
            console.log('\n📋 3. TESTANDO LISTA COM NOVOS TERMOS:');
            
            const { data: confirmacoes, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    status,
                    confirmed_at,
                    declined_at,
                    players!inner(
                        name,
                        phone_number,
                        type
                    )
                `)
                .eq('session_id', sessionId);
            
            if (error) {
                console.log('   ❌ Erro ao buscar confirmações:', error.message);
                return;
            }
            
            if (!confirmacoes || confirmacoes.length === 0) {
                console.log('   📝 Nenhuma confirmação encontrada');
                return;
            }
            
            // Separar por status
            const confirmados = confirmacoes.filter(c => c.status === 'confirmed');
            const recusados = confirmacoes.filter(c => c.status === 'declined');
            const pendentes = confirmacoes.filter(c => c.status === 'pending');
            
            console.log(`\n   ✅ DENTRO DA PARTIDA (${confirmados.length}):`);
            confirmados.forEach((conf, index) => {
                console.log(`      ${index + 1}. ${conf.players.name} (${conf.players.phone_number}) - ${conf.players.type}`);
            });
            
            console.log(`\n   ❌ FORA DA PARTIDA (${recusados.length}):`);
            recusados.forEach((conf, index) => {
                console.log(`      ${index + 1}. ${conf.players.name} (${conf.players.phone_number}) - ${conf.players.type}`);
            });
            
            console.log(`\n   ⏳ PENDENTES (${pendentes.length}):`);
            pendentes.forEach((conf, index) => {
                console.log(`      ${index + 1}. ${conf.players.name} (${conf.players.phone_number}) - ${conf.players.type}`);
            });
            
            console.log(`\n   📊 RESUMO:`);
            console.log(`      ✅ Dentro da partida: ${confirmados.length}`);
            console.log(`      ❌ Fora da partida: ${recusados.length}`);
            console.log(`      ⏳ Pendentes: ${pendentes.length}`);
            console.log(`      📝 Total: ${confirmacoes.length}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao testar lista com novos termos:', error);
        }
    }
}

// Executar reset
async function main() {
    const reset = new ResetarParaPendente();
    await reset.resetarParaPendente();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ResetarParaPendente;

