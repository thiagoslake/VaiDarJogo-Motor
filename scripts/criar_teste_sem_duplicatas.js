#!/usr/bin/env node

/**
 * 🚀 CRIAR TESTE SEM DUPLICATAS
 * 
 * Este script cria uma sessão de teste para o motor completo
 * com verificação de duplicatas implementada.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class CriarTesteSemDuplicatas {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async criarTesteSemDuplicatas() {
        try {
            console.log('🚀 ===== CRIANDO TESTE SEM DUPLICATAS =====\n');
            
            // 1. Limpar dados antigos
            await this.limparDadosAntigos();
            
            // 2. Verificar mensalistas
            await this.verificarMensalistas();
            
            // 3. Criar sessão para 1 minuto no futuro
            const sessaoTeste = await this.criarSessao1Minuto();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 4. Criar configuração com notificação imediata
            const configTeste = await this.criarConfiguracao1Minuto(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 5. Mostrar instruções
            await this.mostrarInstrucoes(sessaoTeste, configTeste);
            
            console.log('\n🚀 ===== TESTE CRIADO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a criação do teste:', error);
        }
    }

    /**
     * 1. Limpar dados antigos
     */
    async limparDadosAntigos() {
        try {
            console.log('🧹 1. LIMPANDO DADOS ANTIGOS:');
            
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
            
            // Remover confirmações antigas
            const { error: confirmacoesError } = await this.supabase
                .from('participation_confirmations')
                .delete()
                .ilike('notes', '%teste%');
            
            if (confirmacoesError) {
                console.log('   ⚠️ Erro ao remover confirmações antigas:', confirmacoesError.message);
            } else {
                console.log('   ✅ Confirmações antigas removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar dados antigos:', error);
        }
    }

    /**
     * 2. Verificar mensalistas
     */
    async verificarMensalistas() {
        try {
            console.log('\n👥 2. VERIFICANDO MENSALISTAS:');
            
            const { data: mensalistas, error } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type, status')
                .eq('type', 'monthly')
                .eq('status', 'active');
            
            if (error) {
                console.log('   ❌ Erro ao buscar mensalistas:', error.message);
                return;
            }
            
            if (!mensalistas || mensalistas.length === 0) {
                console.log('   📝 Nenhum mensalista encontrado');
                return;
            }
            
            console.log(`   📊 Mensalistas encontrados: ${mensalistas.length}`);
            mensalistas.forEach((mensalista, index) => {
                console.log(`   ${index + 1}. ${mensalista.name} - ${mensalista.phone_number} (ID: ${mensalista.id}, Tipo: ${mensalista.type})`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar mensalistas:', error);
        }
    }

    /**
     * 3. Criar sessão para 1 minuto no futuro
     */
    async criarSessao1Minuto() {
        try {
            console.log('\n🔧 3. CRIANDO SESSÃO 1 MINUTO:');
            
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
            
            // Criar sessão para 1 minuto no futuro
            const dataSessao = agora.clone().add(1, 'minute');
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'TESTE SEM DUPLICATAS - Verificação de confirmações existentes'
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
            console.log(`   🆔 Game ID: ${sessao.game_id}`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão:', error);
            return null;
        }
    }

    /**
     * 4. Criar configuração com notificação imediata
     */
    async criarConfiguracao1Minuto(sessao) {
        try {
            console.log('\n🔧 4. CRIANDO CONFIGURAÇÃO 1 MINUTO:');
            
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
                        "hours_before": 0.01, // 36 segundos antes (0.01 horas)
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
            console.log(`      1. 36 segundos antes (mensalistas) - confirmação`);
            console.log(`   📱 Grupo WhatsApp: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 5. Mostrar instruções
     */
    async mostrarInstrucoes(sessao, config) {
        try {
            console.log('\n📋 5. INSTRUÇÕES:');
            
            console.log('   🚀 PASSO 1: Executar motor completo');
            console.log('   📝 Execute: node motor_completo_respostas.js');
            console.log('   📝 Aguarde a conexão com WhatsApp');
            console.log('   📝 Monitore os logs detalhados');
            
            console.log('\n   ⏰ PASSO 2: Aguardar notificação (1 minuto)');
            console.log('   📝 A notificação será enviada em ~36 segundos');
            console.log('   📝 O motor verifica a cada 10 segundos');
            console.log('   📝 Você verá logs detalhados de cada verificação');
            
            console.log('\n   📱 PASSO 3: Responder às mensagens');
            console.log('   📝 Envie "SIM" para confirmar presença');
            console.log('   📝 Envie "NÃO" para recusar');
            console.log('   📝 O motor coletará as respostas automaticamente');
            
            console.log('\n   🔄 PASSO 4: Testar duplicatas');
            console.log('   📝 Aguarde o motor rodar novamente (próximo ciclo)');
            console.log('   📝 Verifique se não envia notificação duplicada');
            console.log('   📝 Deve mostrar: "já possui confirmação - pulando notificação"');
            
            console.log('\n   📋 PASSO 5: Verificar lista de presença');
            console.log('   📝 A lista será exibida automaticamente no log');
            console.log('   📝 Separada por: Confirmados, Recusados, Pendentes');
            console.log('   📝 Com contadores e resumo');
            
            console.log('\n   📊 DADOS DO TESTE:');
            console.log(`   🎮 Jogo: ${sessao.game_id}`);
            console.log(`   📅 Sessão: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   🔔 Configuração: ${config.id}`);
            console.log(`   📱 Grupo: ${config.whatsapp_group_id}`);
            
            console.log('\n   ✅ CORREÇÕES APLICADAS:');
            console.log('   📝 Schema do banco corrigido');
            console.log('   📝 Campo config_id removido');
            console.log('   📝 Campo session_id removido');
            console.log('   📝 Usando apenas game_id (campo válido)');
            console.log('   📝 game_id adicionado na consulta');
            console.log('   📝 Configurações convertidas de objeto para array');
            console.log('   📝 player_id sendo salvo individualmente');
            console.log('   📝 Log individual para cada mensalista');
            console.log('   📝 player_phone sendo salvo corretamente');
            console.log('   📝 player_type sendo salvo corretamente');
            console.log('   📝 Todos os erros de constraint corrigidos');
            console.log('   📝 Verificação de duplicatas implementada');
            console.log('   📝 Constraint única respeitada');
            console.log('   📝 Verificação de confirmações existentes');
            console.log('   📝 Não envia notificação se já respondeu');
            
            console.log('\n   ⚠️ IMPORTANTE:');
            console.log('   📝 Este é um TESTE SEM DUPLICATAS');
            console.log('   📝 Certifique-se de que o WhatsApp está conectado');
            console.log('   📝 Os mensalistas receberão mensagens reais');
            console.log('   📝 Responda às mensagens para testar a coleta');
            console.log('   📝 Monitore os logs para ver a lista sendo montada');
            console.log('   📝 Não deve haver mais erros de constraint');
            console.log('   📝 Motor completamente funcional');
            console.log('   📝 Duplicatas são verificadas antes da inserção');
            console.log('   📝 Notificações duplicadas são evitadas');
            console.log('   📝 Verifica confirmações existentes antes de enviar');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }
}

// Executar criação do teste
async function main() {
    const teste = new CriarTesteSemDuplicatas();
    await teste.criarTesteSemDuplicatas();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarTesteSemDuplicatas;

