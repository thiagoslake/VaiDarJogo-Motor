#!/usr/bin/env node

/**
 * 🧪 CRIAR TESTE REAL
 * 
 * Este script cria uma sessão de teste com horário próximo
 * para testar o sistema completo de respostas em tempo real.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class CriarTesteReal {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async criarTesteReal() {
        try {
            console.log('🧪 ===== CRIANDO TESTE REAL =====\n');
            
            // 1. Verificar mensalistas disponíveis
            await this.verificarMensalistas();
            
            // 2. Criar sessão de teste com horário próximo
            const sessaoTeste = await this.criarSessaoTesteReal();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração de teste
            const configTeste = await this.criarConfiguracaoTesteReal(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 4. Mostrar instruções para o teste
            await this.mostrarInstrucoesTeste(sessaoTeste, configTeste);
            
            console.log('\n🧪 ===== TESTE REAL CRIADO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a criação do teste:', error);
        }
    }

    /**
     * 1. Verificar mensalistas disponíveis
     */
    async verificarMensalistas() {
        try {
            console.log('🔍 1. VERIFICANDO MENSALISTAS DISPONÍVEIS:');
            
            // Buscar mensalistas
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
            
            console.log(`   📊 Encontrados ${mensalistas.length} mensalistas:`);
            mensalistas.forEach((mensalista, index) => {
                console.log(`   ${index + 1}. ${mensalista.name} - ${mensalista.phone_number}`);
            });
            
            // Verificar mensalistas por jogo
            console.log('\n   🎮 Mensalistas por jogo:');
            const { data: jogos, error: jogosError } = await this.supabase
                .from('games')
                .select('id, organization_name');
            
            if (jogosError) {
                console.log('   ❌ Erro ao buscar jogos:', jogosError.message);
                return;
            }
            
            for (const jogo of jogos || []) {
                const { data: mensalistasJogo, error: mensalistasError } = await this.supabase
                    .from('game_players')
                    .select(`
                        player_id,
                        players!inner(
                            name,
                            phone_number,
                            type
                        )
                    `)
                    .eq('game_id', jogo.id)
                    .eq('status', 'active')
                    .eq('players.type', 'monthly');
                
                if (mensalistasError) {
                    console.log(`   ❌ Erro ao buscar mensalistas do jogo ${jogo.organization_name}:`, mensalistasError.message);
                    continue;
                }
                
                console.log(`   🏈 ${jogo.organization_name}: ${mensalistasJogo?.length || 0} mensalistas`);
                if (mensalistasJogo && mensalistasJogo.length > 0) {
                    mensalistasJogo.forEach((mensalista, index) => {
                        console.log(`      ${index + 1}. ${mensalista.players.name} - ${mensalista.players.phone_number}`);
                    });
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar mensalistas:', error);
        }
    }

    /**
     * 2. Criar sessão de teste com horário próximo
     */
    async criarSessaoTesteReal() {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO DE TESTE REAL:');
            
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
            
            // Criar sessão para 5 minutos no futuro (para teste imediato)
            const dataSessao = agora.clone().add(5, 'minutes');
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão de TESTE REAL - Sistema de confirmações automáticas'
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
     * 3. Criar configuração de teste
     */
    async criarConfiguracaoTesteReal(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO DE TESTE REAL:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 3,
                mensal_notifications: 2,
                notification_type: 'individual',
                whatsapp_group_id: '120363123456789012@g.us', // ID de grupo de teste
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.08, // 5 minutos antes (para teste imediato)
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.05, // 3 minutos antes
                        "target": "mensalistas",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.02, // 1.2 minutos antes
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
            console.log(`      1. 5 minutos antes (mensalistas) - confirmação`);
            console.log(`      2. 3 minutos antes (mensalistas) - lembrete`);
            console.log(`      3. 1.2 minutos antes (mensalistas) - confirmação final`);
            console.log(`   📱 Grupo WhatsApp: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 4. Mostrar instruções para o teste
     */
    async mostrarInstrucoesTeste(sessao, config) {
        try {
            console.log('\n📋 4. INSTRUÇÕES PARA O TESTE REAL:');
            
            console.log('   🚀 PASSO 1: Iniciar o motor completo');
            console.log('   📝 Execute: node motor_completo_respostas.js');
            console.log('   📝 Aguarde o QR Code aparecer');
            console.log('   📝 Escaneie com o WhatsApp no seu celular');
            
            console.log('\n   📱 PASSO 2: Verificar conexão');
            console.log('   📝 Aguarde a mensagem "WhatsApp conectado e pronto!"');
            console.log('   📝 O motor começará a verificar notificações a cada 10 segundos');
            console.log('   📝 O motor começará a coletar respostas a cada 5 segundos');
            
            console.log('\n   ⏰ PASSO 3: Aguardar notificação (5 minutos)');
            console.log('   📝 O motor verificará se é hora de enviar notificações');
            console.log('   📝 Quando chegar o horário, enviará para cada mensalista');
            console.log('   📝 Verifique se as mensagens chegaram nos telefones');
            
            console.log('\n   📥 PASSO 4: Responder às notificações');
            console.log('   📝 Os mensalistas devem responder com SIM ou NÃO');
            console.log('   📝 O motor coletará as respostas automaticamente');
            console.log('   📝 As confirmações serão atualizadas no banco de dados');
            
            console.log('\n   📋 PASSO 5: Lista no grupo (1 hora antes)');
            console.log('   📝 1 hora antes do jogo, o motor enviará a lista no grupo');
            console.log('   📝 A lista mostrará confirmados, ausentes e pendentes');
            console.log('   📝 Verifique se a mensagem chegou no grupo');
            
            console.log('\n   📊 DADOS DO TESTE:');
            console.log(`   🎮 Jogo: ${sessao.game_id}`);
            console.log(`   📅 Sessão: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   🔔 Configuração: ${config.id}`);
            console.log(`   📱 Grupo: ${config.whatsapp_group_id}`);
            
            console.log('\n   ⚠️ IMPORTANTE:');
            console.log('   📝 Este é um TESTE REAL - as notificações serão enviadas');
            console.log('   📝 Certifique-se de que o WhatsApp está conectado');
            console.log('   📝 Os mensalistas receberão mensagens reais');
            console.log('   📝 Após o teste, execute o script de limpeza');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }
}

// Executar criação do teste
async function main() {
    const teste = new CriarTesteReal();
    await teste.criarTesteReal();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarTesteReal;
