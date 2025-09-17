#!/usr/bin/env node

/**
 * 📱 ATUALIZAR GRUPO WHATSAPP
 * 
 * Este script permite atualizar o ID do grupo WhatsApp
 * para testar notificações reais.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class AtualizarGrupoWhatsApp {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async atualizarGrupo() {
        try {
            console.log('📱 ===== ATUALIZAR GRUPO WHATSAPP =====\n');
            
            // 1. Listar configurações existentes
            await this.listarConfiguracoes();
            
            // 2. Criar sessão de teste
            const sessaoTeste = await this.criarSessaoTeste();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração com ID de grupo
            const configTeste = await this.criarConfiguracaoComGrupo(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração');
                return;
            }
            
            // 4. Instruções para obter ID real
            await this.instrucoesObterId();
            
            // 5. Aguardar atualização manual
            await this.aguardarAtualizacao(configTeste);
            
            console.log('\n📱 ===== ATUALIZAÇÃO CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a atualização:', error);
        }
    }

    /**
     * 1. Listar configurações existentes
     */
    async listarConfiguracoes() {
        try {
            console.log('🔍 1. CONFIGURAÇÕES EXISTENTES:');
            
            const { data: configs, error } = await this.supabase
                .from('notification_configs')
                .select(`
                    id,
                    whatsapp_group_id,
                    is_active,
                    game_sessions!inner(
                        session_date,
                        start_time,
                        games!inner(
                            organization_name
                        )
                    )
                `)
                .eq('is_active', true)
                .limit(5);
            
            if (error) {
                console.log('   ❌ Erro ao buscar configurações:', error.message);
                return;
            }
            
            if (!configs || configs.length === 0) {
                console.log('   📝 Nenhuma configuração encontrada');
                return;
            }
            
            console.log(`   📊 Encontradas ${configs.length} configurações:`);
            configs.forEach((config, index) => {
                console.log(`   ${index + 1}. ${config.game_sessions.games.organization_name}`);
                console.log(`      📅 ${config.game_sessions.session_date} ${config.game_sessions.start_time}`);
                console.log(`      📱 Group ID: ${config.whatsapp_group_id || 'Não configurado'}`);
                console.log(`      🔔 Ativo: ${config.is_active}`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao listar configurações:', error);
        }
    }

    /**
     * 2. Criar sessão de teste
     */
    async criarSessaoTeste() {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO DE TESTE:');
            
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
            const dataSessao = agora.clone().add(15, 'minutes'); // 15 minutos no futuro
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão para teste WhatsApp - ID do grupo será atualizado'
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
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão:', error);
            return null;
        }
    }

    /**
     * 3. Criar configuração com ID de grupo
     */
    async criarConfiguracaoComGrupo(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO COM GRUPO:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 3,
                mensal_notifications: 2,
                notification_type: 'group',
                whatsapp_group_id: 'AGUARDANDO_ID_REAL@g.us', // Placeholder
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.2, // 12 minutos antes
                        "target": "todos",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.15, // 9 minutos antes
                        "target": "todos",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.1, // 6 minutos antes
                        "target": "todos",
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
            console.log(`      1. 12 minutos antes (todos) - confirmação`);
            console.log(`      2. 9 minutos antes (todos) - lembrete`);
            console.log(`      3. 6 minutos antes (todos) - confirmação final`);
            console.log(`   📱 Group ID: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 4. Instruções para obter ID real
     */
    async instrucoesObterId() {
        try {
            console.log('\n📋 4. INSTRUÇÕES PARA OBTER ID REAL:');
            
            console.log('   🚀 PASSO 1: Iniciar o motor');
            console.log('   📝 Execute: node motor_com_stats.js');
            console.log('   📝 Aguarde o QR Code aparecer');
            console.log('   📝 Escaneie com o WhatsApp no seu celular');
            
            console.log('\n   👥 PASSO 2: Configurar grupo de teste');
            console.log('   📝 Crie um grupo no WhatsApp para teste');
            console.log('   📝 Adicione o bot ao grupo');
            console.log('   📝 O bot irá mapear os membros automaticamente');
            
            console.log('\n   🔧 PASSO 3: Obter ID do grupo');
            console.log('   📝 Quando o bot for adicionado, ele mostrará o ID do grupo');
            console.log('   📝 O ID será exibido no console do motor');
            console.log('   📝 Formato: 120363123456789012@g.us');
            
            console.log('\n   ⚙️ PASSO 4: Atualizar configuração');
            console.log('   📝 Copie o ID do grupo do console');
            console.log('   📝 Execute: node atualizar_grupo_whatsapp.js --id SEU_ID_AQUI');
            console.log('   📝 Ou atualize manualmente no Supabase');
            
            console.log('\n   ⏰ PASSO 5: Aguardar notificação');
            console.log('   📝 O motor verificará a cada 10 segundos');
            console.log('   📝 Quando chegar o horário, enviará a notificação');
            console.log('   📝 Verifique se a mensagem chegou no grupo');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }

    /**
     * 5. Aguardar atualização manual
     */
    async aguardarAtualizacao(config) {
        try {
            console.log('\n⏳ 5. AGUARDANDO ATUALIZAÇÃO:');
            
            console.log('   📝 Para atualizar o ID do grupo, execute:');
            console.log(`   📝 node atualizar_grupo_whatsapp.js --id SEU_ID_AQUI`);
            console.log(`   📝 Configuração ID: ${config.id}`);
            console.log(`   📝 Sessão ID: ${config.session_id}`);
            
            console.log('\n   📝 Ou atualize manualmente no Supabase:');
            console.log('   📝 1. Acesse o painel do Supabase');
            console.log('   📝 2. Vá para a tabela notification_configs');
            console.log('   📝 3. Encontre o registro com ID:', config.id);
            console.log('   📝 4. Atualize o campo whatsapp_group_id');
            console.log('   📝 5. Salve as alterações');
            
        } catch (error) {
            console.error('   ❌ Erro ao aguardar atualização:', error);
        }
    }

    /**
     * Atualizar ID do grupo
     */
    async atualizarIdGrupo(configId, novoIdGrupo) {
        try {
            console.log(`\n🔧 ATUALIZANDO ID DO GRUPO: ${novoIdGrupo}`);
            
            const { data, error } = await this.supabase
                .from('notification_configs')
                .update({ whatsapp_group_id: novoIdGrupo })
                .eq('id', configId)
                .select();
            
            if (error) {
                console.log('   ❌ Erro ao atualizar:', error.message);
                return false;
            }
            
            if (data && data.length > 0) {
                console.log('   ✅ ID do grupo atualizado com sucesso!');
                console.log(`   📱 Novo ID: ${data[0].whatsapp_group_id}`);
                return true;
            } else {
                console.log('   ❌ Configuração não encontrada');
                return false;
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao atualizar ID do grupo:', error);
            return false;
        }
    }
}

// Executar atualização
async function main() {
    const atualizador = new AtualizarGrupoWhatsApp();
    
    // Verificar argumentos da linha de comando
    const args = process.argv.slice(2);
    const idIndex = args.indexOf('--id');
    
    if (idIndex !== -1 && args[idIndex + 1]) {
        // Atualizar ID específico
        const novoId = args[idIndex + 1];
        const configId = '2a864800-7ec7-45ba-8b1c-cb15b4550d76'; // ID da configuração de teste
        
        console.log('🔧 Atualizando ID do grupo...');
        await atualizador.atualizarIdGrupo(configId, novoId);
    } else {
        // Executar fluxo normal
        await atualizador.atualizarGrupo();
    }
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = AtualizarGrupoWhatsApp;
