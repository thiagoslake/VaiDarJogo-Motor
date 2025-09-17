#!/usr/bin/env node

/**
 * 🧪 TESTAR RESPOSTA SIMULADA
 * 
 * Este script simula uma resposta para testar se a lista de confirmações
 * é gerada automaticamente após cada resposta.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TestarRespostaSimulada {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async testarRespostaSimulada() {
        try {
            console.log('🧪 ===== TESTANDO RESPOSTA SIMULADA =====\n');
            
            // 1. Buscar sessão ativa
            const sessao = await this.buscarSessaoAtiva();
            if (!sessao) {
                console.log('❌ Nenhuma sessão ativa encontrada');
                return;
            }
            
            // 2. Buscar confirmação pendente
            const confirmacao = await this.buscarConfirmacaoPendente(sessao.id);
            if (!confirmacao) {
                console.log('❌ Nenhuma confirmação pendente encontrada');
                return;
            }
            
            // 3. Simular resposta "SIM"
            await this.simularRespostaSim(confirmacao);
            
            // 4. Aguardar um pouco e simular resposta "NÃO" de outro jogador
            console.log('\n⏳ Aguardando 3 segundos...');
            await this.aguardar(3000);
            
            // 5. Verificar se há mais confirmações pendentes
            const outraConfirmacao = await this.buscarOutraConfirmacaoPendente(sessao.id, confirmacao.player_id);
            if (outraConfirmacao) {
                await this.simularRespostaNao(outraConfirmacao);
            }
            
            // 6. Exibir lista final
            await this.exibirListaFinal(sessao.id);
            
            console.log('\n🧪 ===== TESTE CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
        }
    }

    /**
     * 1. Buscar sessão ativa
     */
    async buscarSessaoAtiva() {
        try {
            console.log('🔍 1. BUSCANDO SESSÃO ATIVA:');
            
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    games!inner(
                        organization_name,
                        location
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .limit(1);
            
            if (error || !sessoes || sessoes.length === 0) {
                console.log('   ❌ Erro ao buscar sessões:', error?.message);
                return null;
            }
            
            const sessao = sessoes[0];
            console.log(`   ✅ Sessão encontrada: ${sessao.id}`);
            console.log(`   🎮 Jogo: ${sessao.games.organization_name}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar sessão ativa:', error);
            return null;
        }
    }

    /**
     * 2. Buscar confirmação pendente
     */
    async buscarConfirmacaoPendente(sessionId) {
        try {
            console.log('\n🔍 2. BUSCANDO CONFIRMAÇÃO PENDENTE:');
            
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
                .eq('session_id', sessionId)
                .eq('status', 'pending')
                .limit(1);
            
            if (error || !confirmacoes || confirmacoes.length === 0) {
                console.log('   ❌ Erro ao buscar confirmações pendentes:', error?.message);
                return null;
            }
            
            const confirmacao = confirmacoes[0];
            console.log(`   ✅ Confirmação encontrada: ${confirmacao.id}`);
            console.log(`   👤 Jogador: ${confirmacao.players.name} (${confirmacao.players.phone_number})`);
            console.log(`   📱 Telefone: ${confirmacao.player_phone}`);
            console.log(`   🎯 Tipo: ${confirmacao.player_type}`);
            
            return confirmacao;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar confirmação pendente:', error);
            return null;
        }
    }

    /**
     * 3. Simular resposta "SIM"
     */
    async simularRespostaSim(confirmacao) {
        try {
            console.log('\n✅ 3. SIMULANDO RESPOSTA "SIM":');
            
            const status = 'confirmed';
            const now = moment().toISOString();
            
            // Usar UPDATE em vez de UPSERT para evitar constraint única
            const { error } = await this.supabase
                .from('participation_confirmations')
                .update({
                    status: status,
                    confirmed_at: now,
                    updated_at: now
                })
                .eq('session_id', confirmacao.session_id)
                .eq('player_phone', confirmacao.player_phone);
            
            if (error) {
                console.log('   ❌ Erro ao atualizar confirmação:', error.message);
                return;
            }
            
            console.log(`   ✅ ${confirmacao.players.name} confirmou presença!`);
            console.log(`   📝 Status atualizado para: ${status}`);
            console.log(`   ⏰ Confirmado em: ${moment(now).format('DD/MM/YYYY HH:mm:ss')}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao simular resposta SIM:', error);
        }
    }

    /**
     * 4. Buscar outra confirmação pendente
     */
    async buscarOutraConfirmacaoPendente(sessionId, excludePlayerId) {
        try {
            console.log('\n🔍 4. BUSCANDO OUTRA CONFIRMAÇÃO PENDENTE:');
            
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
                .eq('session_id', sessionId)
                .eq('status', 'pending')
                .neq('player_id', excludePlayerId)
                .limit(1);
            
            if (error || !confirmacoes || confirmacoes.length === 0) {
                console.log('   📝 Nenhuma outra confirmação pendente encontrada');
                return null;
            }
            
            const confirmacao = confirmacoes[0];
            console.log(`   ✅ Outra confirmação encontrada: ${confirmacao.id}`);
            console.log(`   👤 Jogador: ${confirmacao.players.name} (${confirmacao.players.phone_number})`);
            
            return confirmacao;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar outra confirmação pendente:', error);
            return null;
        }
    }

    /**
     * 5. Simular resposta "NÃO"
     */
    async simularRespostaNao(confirmacao) {
        try {
            console.log('\n❌ 5. SIMULANDO RESPOSTA "NÃO":');
            
            const status = 'declined';
            const now = moment().toISOString();
            
            // Usar UPDATE em vez de UPSERT para evitar constraint única
            const { error } = await this.supabase
                .from('participation_confirmations')
                .update({
                    status: status,
                    declined_at: now,
                    updated_at: now
                })
                .eq('session_id', confirmacao.session_id)
                .eq('player_phone', confirmacao.player_phone);
            
            if (error) {
                console.log('   ❌ Erro ao atualizar confirmação:', error.message);
                return;
            }
            
            console.log(`   ❌ ${confirmacao.players.name} recusou presença!`);
            console.log(`   📝 Status atualizado para: ${status}`);
            console.log(`   ⏰ Recusado em: ${moment(now).format('DD/MM/YYYY HH:mm:ss')}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao simular resposta NÃO:', error);
        }
    }

    /**
     * 6. Exibir lista final
     */
    async exibirListaFinal(sessionId) {
        try {
            console.log('\n📋 6. LISTA FINAL DE CONFIRMAÇÕES:');
            
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
            console.error('   ❌ Erro ao exibir lista final:', error);
        }
    }

    /**
     * Função auxiliar para aguardar
     */
    aguardar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar teste
async function main() {
    const teste = new TestarRespostaSimulada();
    await teste.testarRespostaSimulada();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestarRespostaSimulada;
