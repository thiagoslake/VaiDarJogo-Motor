#!/usr/bin/env node

/**
 * 🧪 CRIAR CONFIRMAÇÃO DE TESTE
 * 
 * Este script cria uma confirmação pendente para testar
 * os novos termos da lista de confirmações.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class CriarConfirmacaoTeste {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async criarConfirmacaoTeste() {
        try {
            console.log('🧪 ===== CRIANDO CONFIRMAÇÃO DE TESTE =====\n');
            
            // 1. Buscar sessão ativa
            const sessao = await this.buscarSessaoAtiva();
            if (!sessao) {
                console.log('❌ Nenhuma sessão ativa encontrada');
                return;
            }
            
            // 2. Buscar jogador mensalista
            const jogador = await this.buscarJogadorMensalista();
            if (!jogador) {
                console.log('❌ Nenhum jogador mensalista encontrado');
                return;
            }
            
            // 3. Criar confirmação pendente
            await this.criarConfirmacaoPendente(sessao, jogador);
            
            // 4. Testar lista com novos termos
            await this.testarListaNovosTermos(sessao.id);
            
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
     * 2. Buscar jogador mensalista
     */
    async buscarJogadorMensalista() {
        try {
            console.log('\n👥 2. BUSCANDO JOGADOR MENSALISTA:');
            
            const { data: jogadores, error } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type, status')
                .eq('type', 'monthly')
                .eq('status', 'active')
                .limit(1);
            
            if (error || !jogadores || jogadores.length === 0) {
                console.log('   ❌ Erro ao buscar jogadores:', error?.message);
                return null;
            }
            
            const jogador = jogadores[0];
            console.log(`   ✅ Jogador encontrado: ${jogador.name}`);
            console.log(`   📱 Telefone: ${jogador.phone_number}`);
            console.log(`   🎯 Tipo: ${jogador.type}`);
            
            return jogador;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar jogador mensalista:', error);
            return null;
        }
    }

    /**
     * 3. Criar confirmação pendente
     */
    async criarConfirmacaoPendente(sessao, jogador) {
        try {
            console.log('\n📝 3. CRIANDO CONFIRMAÇÃO PENDENTE:');
            
            // Verificar se já existe
            const { data: existing, error: checkError } = await this.supabase
                .from('participation_confirmations')
                .select('id')
                .eq('session_id', sessao.id)
                .eq('player_phone', jogador.phone_number)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.log('   ❌ Erro ao verificar confirmação existente:', checkError.message);
                return;
            }
            
            if (existing) {
                console.log(`   📝 Confirmação já existe para ${jogador.name}`);
                return;
            }
            
            // Criar nova confirmação
            const { error } = await this.supabase
                .from('participation_confirmations')
                .insert({
                    session_id: sessao.id,
                    player_id: jogador.id,
                    player_phone: jogador.phone_number,
                    player_type: jogador.type,
                    status: 'pending'
                });
            
            if (error) {
                console.log('   ❌ Erro ao criar confirmação:', error.message);
                return;
            }
            
            console.log(`   ✅ Confirmação pendente criada para ${jogador.name}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao criar confirmação pendente:', error);
        }
    }

    /**
     * 4. Testar lista com novos termos
     */
    async testarListaNovosTermos(sessionId) {
        try {
            console.log('\n📋 4. TESTANDO LISTA COM NOVOS TERMOS:');
            
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

// Executar teste
async function main() {
    const teste = new CriarConfirmacaoTeste();
    await teste.criarConfirmacaoTeste();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarConfirmacaoTeste;

