#!/usr/bin/env node

/**
 * 🚀 CRIAR TESTE IMEDIATO
 * 
 * Este script cria uma sessão de teste com horário muito próximo
 * para testar o envio de notificações em tempo real.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class CriarTesteImediato {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async criarTesteImediato() {
        try {
            console.log('🚀 ===== CRIANDO TESTE IMEDIATO =====\n');
            
            // 1. Limpar sessões antigas
            await this.limparSessoesAntigas();
            
            // 2. Criar sessão com horário muito próximo
            const sessaoTeste = await this.criarSessaoImediata();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração com notificações imediatas
            const configTeste = await this.criarConfiguracaoImediata(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 4. Mostrar instruções
            await this.mostrarInstrucoes(sessaoTeste, configTeste);
            
            console.log('\n🚀 ===== TESTE IMEDIATO CRIADO =====\n');
            
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
            
            // Remover configurações de sessões antigas
            const { error: configError } = await this.supabase
                .from('notification_configs')
                .delete()
                .ilike('session_id', '%');
            
            if (configError) {
                console.log('   ⚠️ Erro ao remover configurações antigas:', configError.message);
            } else {
                console.log('   ✅ Configurações antigas removidas');
            }
            
            // Remover confirmações antigas
            const { error: confirmError } = await this.supabase
                .from('participation_confirmations')
                .delete()
                .ilike('session_id', '%');
            
            if (confirmError) {
                console.log('   ⚠️ Erro ao remover confirmações antigas:', confirmError.message);
            } else {
                console.log('   ✅ Confirmações antigas removidas');
            }
            
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
     * 2. Criar sessão com horário muito próximo
     */
    async criarSessaoImediata() {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO IMEDIATA:');
            
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
            
            // Criar sessão para 2 minutos no futuro
            const dataSessao = agora.clone().add(2, 'minutes');
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'TESTE IMEDIATO - Notificações em tempo real'
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
            console.log(`   ⏰ Faltam: ${dataSessao.diff(agora, 'minutes', true).toFixed(1)} minutos`);
            console.log(`   🎮 Jogo: ${jogo.organization_name}`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão:', error);
            return null;
        }
    }

    /**
     * 3. Criar configuração com notificações imediatas
     */
    async criarConfiguracaoImediata(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO IMEDIATA:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 3,
                mensal_notifications: 2,
                notification_type: 'individual',
                whatsapp_group_id: '120363123456789012@g.us',
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.03, // 1.8 minutos antes
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.02, // 1.2 minutos antes
                        "target": "mensalistas",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.01, // 0.6 minutos antes
                        "target": "mensalistas",
                        "message_type": "final_confirmation"
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
            console.log(`   🔔 3 notificações configuradas:`);
            console.log(`      1. 1.8 minutos antes (mensalistas) - confirmação`);
            console.log(`      2. 1.2 minutos antes (mensalistas) - lembrete`);
            console.log(`      3. 0.6 minutos antes (mensalistas) - confirmação final`);
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
            console.log('\n📋 4. INSTRUÇÕES PARA O TESTE IMEDIATO:');
            
            console.log('   🚀 PASSO 1: Verificar se o motor está rodando');
            console.log('   📝 O motor deve estar rodando em background');
            console.log('   📝 Se não estiver, execute: node motor_completo_respostas.js');
            
            console.log('\n   ⏰ PASSO 2: Aguardar notificações (2 minutos)');
            console.log('   📝 As notificações serão enviadas em:');
            console.log('      - 1.8 minutos antes (em ~20 segundos)');
            console.log('      - 1.2 minutos antes (em ~40 segundos)');
            console.log('      - 0.6 minutos antes (em ~80 segundos)');
            
            console.log('\n   📱 PASSO 3: Verificar mensagens no WhatsApp');
            console.log('   📝 Verifique se as mensagens chegaram nos telefones:');
            console.log('      - Thiago Nogueira (13981645787)');
            console.log('      - Joao Silva (13987544557)');
            
            console.log('\n   📊 DADOS DO TESTE IMEDIATO:');
            console.log(`   🎮 Jogo: ${sessao.game_id}`);
            console.log(`   📅 Sessão: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   🔔 Configuração: ${config.id}`);
            console.log(`   📱 Grupo: ${config.whatsapp_group_id}`);
            
            console.log('\n   ⚠️ IMPORTANTE:');
            console.log('   📝 Este é um TESTE IMEDIATO - as notificações serão enviadas em segundos');
            console.log('   📝 Certifique-se de que o WhatsApp está conectado');
            console.log('   📝 Os mensalistas receberão mensagens reais');
            console.log('   📝 Monitore o console do motor para ver os logs');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }
}

// Executar criação do teste imediato
async function main() {
    const teste = new CriarTesteImediato();
    await teste.criarTesteImediato();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarTesteImediato;
