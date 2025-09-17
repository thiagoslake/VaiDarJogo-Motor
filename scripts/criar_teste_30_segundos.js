#!/usr/bin/env node

/**
 * 🚀 CRIAR TESTE 30 SEGUNDOS
 * 
 * Este script cria uma sessão de teste com horário muito próximo
 * para testar o motor imediatamente.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class CriarTeste30Segundos {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async criarTeste30Segundos() {
        try {
            console.log('🚀 ===== CRIANDO TESTE 30 SEGUNDOS =====\n');
            
            // 1. Limpar sessões antigas
            await this.limparSessoesAntigas();
            
            // 2. Criar sessão para 30 segundos no futuro
            const sessaoTeste = await this.criarSessao30Segundos();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração com notificação imediata
            const configTeste = await this.criarConfiguracao30Segundos(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 4. Mostrar instruções
            await this.mostrarInstrucoes(sessaoTeste, configTeste);
            
            console.log('\n🚀 ===== TESTE CRIADO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a criação do teste:', error);
        }
    }

    /**
     * 1. Limpar sessões antigas
     */
    async limparSessoesAntigas() {
        try {
            console.log('🧹 1. LIMPANDO SESSÕES ANTIGAS:');
            
            // Remover sessões antigas
            const { error: sessoesError } = await this.supabase
                .from('game_sessions')
                .delete()
                .ilike('notes', '%teste%');
            
            if (sessoesError) {
                console.log('   ⚠️ Erro ao remover sessões antigas:', sessoesError.message);
            } else {
                console.log('   ✅ Sessões antigas removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar sessões antigas:', error);
        }
    }

    /**
     * 2. Criar sessão para 30 segundos no futuro
     */
    async criarSessao30Segundos() {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO 30 SEGUNDOS:');
            
            // Buscar um jogo existente
            const { data: jogos, error: jogoError } = await this.supabase
                .from('games')
                .select('id, organization_name')
                .limit(1);
            
            if (jogoError || !jogos || jogos.length === 0) {
                console.log('   ❌ Erro ao buscar jogo:', jogoError?.message);
                return null;
            }
            
            const jogo = jogos[0];
            const agora = moment();
            
            // Criar sessão para 30 segundos no futuro
            const dataSessao = agora.clone().add(30, 'seconds');
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'TESTE 30 SEGUNDOS - Notificação imediata'
            };
            
            const { data: sessao, error } = await this.supabase
                .from('game_sessions')
                .insert(sessaoData)
                .select()
                .single();
            
            if (error) {
                console.log('   ❌ Erro ao criar sessão:', error.message);
                return null;
            }
            
            console.log(`   ✅ Sessão criada: ${sessao.id}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   ⏰ Faltam: ${dataSessao.diff(agora, 'seconds', true).toFixed(0)} segundos`);
            console.log(`   🎮 Jogo: ${jogo.organization_name}`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão:', error);
            return null;
        }
    }

    /**
     * 3. Criar configuração com notificação imediata
     */
    async criarConfiguracao30Segundos(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO 30 SEGUNDOS:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 1,
                mensal_notifications: 1,
                notification_type: 'individual',
                whatsapp_group_id: '120363123456789012@g.us',
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.005, // 18 segundos antes (0.005 horas)
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    }
                ],
                is_active: true
            };
            
            const { data: config, error } = await this.supabase
                .from('notification_configs')
                .insert(configData)
                .select()
                .single();
            
            if (error) {
                console.log('   ❌ Erro ao criar configuração:', error.message);
                return null;
            }
            
            console.log(`   ✅ Configuração criada: ${config.id}`);
            console.log(`   🔔 1 notificação configurada:`);
            console.log(`      1. 18 segundos antes (mensalistas) - confirmação`);
            console.log(`   📱 Grupo WhatsApp: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 4. Mostrar instruções
     */
    async mostrarInstrucoes(sessao, config) {
        try {
            console.log('\n📋 4. INSTRUÇÕES:');
            
            console.log('   🚀 PASSO 1: Executar motor com logs');
            console.log('   📝 Execute: node motor_simples_notificacoes.js');
            console.log('   📝 Aguarde a conexão com WhatsApp');
            console.log('   📝 Monitore os logs detalhados');
            
            console.log('\n   ⏰ PASSO 2: Aguardar notificação (30 segundos)');
            console.log('   📝 A notificação será enviada em ~18 segundos');
            console.log('   📝 O motor verifica a cada 10 segundos');
            console.log('   📝 Você verá logs detalhados de cada verificação');
            
            console.log('\n   📱 PASSO 3: Verificar mensagens no WhatsApp');
            console.log('   📝 Verifique se as mensagens chegaram nos telefones:');
            console.log('      - Thiago Nogueira (13981645787)');
            console.log('      - Joao Silva (13987544557)');
            
            console.log('\n   📊 DADOS DO TESTE:');
            console.log(`   🎮 Jogo: ${sessao.game_id}`);
            console.log(`   📅 Sessão: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   🔔 Configuração: ${config.id}`);
            console.log(`   📱 Grupo: ${config.whatsapp_group_id}`);
            
            console.log('\n   ⚠️ IMPORTANTE:');
            console.log('   📝 Este é um TESTE IMEDIATO - a notificação será enviada em segundos');
            console.log('   📝 Certifique-se de que o WhatsApp está conectado');
            console.log('   📝 Os mensalistas receberão mensagens reais');
            console.log('   📝 Monitore os logs detalhados para debug');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }
}

// Executar criação do teste
async function main() {
    const teste = new CriarTeste30Segundos();
    await teste.criarTeste30Segundos();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarTeste30Segundos;

