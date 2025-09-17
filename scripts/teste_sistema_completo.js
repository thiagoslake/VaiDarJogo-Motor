#!/usr/bin/env node

/**
 * 🧪 TESTE SISTEMA COMPLETO DE RESPOSTAS
 * 
 * Este script testa o sistema completo de:
 * 1. Envio de notificações individuais
 * 2. Coleta de respostas
 * 3. Atualização da tabela de confirmação
 * 4. Envio da lista no grupo
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TesteSistemaCompleto {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarTeste() {
        try {
            console.log('🧪 ===== TESTE SISTEMA COMPLETO DE RESPOSTAS =====\n');
            
            // 1. Verificar estrutura do banco
            await this.verificarEstruturaBanco();
            
            // 2. Criar sessão de teste
            const sessaoTeste = await this.criarSessaoTeste();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração de teste
            const configTeste = await this.criarConfiguracaoTeste(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 4. Simular confirmações pendentes
            await this.simularConfirmacoesPendentes(sessaoTeste);
            
            // 5. Simular respostas dos jogadores
            await this.simularRespostasJogadores(sessaoTeste);
            
            // 6. Simular envio da lista no grupo
            await this.simularEnvioListaGrupo(sessaoTeste);
            
            // 7. Mostrar instruções para teste real
            await this.mostrarInstrucoesTesteReal();
            
            // 8. Limpar dados de teste
            await this.limparDadosTeste(sessaoTeste, configTeste);
            
            console.log('\n🧪 ===== TESTE CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
        }
    }

    /**
     * 1. Verificar estrutura do banco
     */
    async verificarEstruturaBanco() {
        try {
            console.log('🔍 1. VERIFICANDO ESTRUTURA DO BANCO:');
            
            // Verificar tabela participation_confirmations
            const { data: confirmations, error: confirmationsError } = await this.supabase
                .from('participation_confirmations')
                .select('*')
                .limit(1);
            
            if (confirmationsError) {
                console.log('   ❌ Erro ao acessar participation_confirmations:', confirmationsError.message);
            } else {
                console.log('   ✅ Tabela participation_confirmations: OK');
            }
            
            // Verificar mensalistas
            const { data: mensalistas, error: mensalistasError } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type')
                .eq('type', 'monthly')
                .eq('status', 'active');
            
            if (mensalistasError) {
                console.log('   ❌ Erro ao buscar mensalistas:', mensalistasError.message);
            } else {
                console.log(`   ✅ Mensalistas encontrados: ${mensalistas?.length || 0}`);
                if (mensalistas && mensalistas.length > 0) {
                    mensalistas.forEach((mensalista, index) => {
                        console.log(`      ${index + 1}. ${mensalista.name} - ${mensalista.phone_number}`);
                    });
                }
            }
            
            // Verificar jogos
            const { data: jogos, error: jogosError } = await this.supabase
                .from('games')
                .select('id, organization_name, whatsapp_group_id');
            
            if (jogosError) {
                console.log('   ❌ Erro ao buscar jogos:', jogosError.message);
            } else {
                console.log(`   ✅ Jogos encontrados: ${jogos?.length || 0}`);
                if (jogos && jogos.length > 0) {
                    jogos.forEach((jogo, index) => {
                        console.log(`      ${index + 1}. ${jogo.organization_name} - Grupo: ${jogo.whatsapp_group_id || 'Não configurado'}`);
                    });
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar estrutura do banco:', error);
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
            const dataSessao = agora.clone().add(30, 'minutes'); // 30 minutos no futuro
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão para teste do sistema completo de respostas'
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
     * 3. Criar configuração de teste
     */
    async criarConfiguracaoTeste(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO DE TESTE:');
            
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
                        "hours_before": 0.5, // 30 minutos antes
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.25, // 15 minutos antes
                        "target": "mensalistas",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.1, // 6 minutos antes
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
            console.log(`      1. 30 minutos antes (mensalistas) - confirmação`);
            console.log(`      2. 15 minutos antes (mensalistas) - lembrete`);
            console.log(`      3. 6 minutos antes (mensalistas) - confirmação final`);
            console.log(`   📱 Grupo WhatsApp: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 4. Simular confirmações pendentes
     */
    async simularConfirmacoesPendentes(sessao) {
        try {
            console.log('\n📝 4. SIMULANDO CONFIRMAÇÕES PENDENTES:');
            
            // Buscar mensalistas do jogo
            const { data: mensalistas, error } = await this.supabase
                .from('game_players')
                .select(`
                    player_id,
                    players!inner(
                        id,
                        name,
                        phone_number,
                        type,
                        status
                    )
                `)
                .eq('game_id', sessao.game_id)
                .eq('status', 'active')
                .eq('players.type', 'monthly')
                .eq('players.status', 'active');
            
            if (error) {
                console.log('   ❌ Erro ao buscar mensalistas:', error.message);
                return;
            }
            
            if (!mensalistas || mensalistas.length === 0) {
                console.log('   📝 Nenhum mensalista encontrado para este jogo');
                return;
            }
            
            console.log(`   📊 Criando confirmações pendentes para ${mensalistas.length} mensalistas:`);
            
            for (const mensalista of mensalistas) {
                const { players } = mensalista;
                
                // Verificar se já existe confirmação
                const { data: existingConfirmation, error: checkError } = await this.supabase
                    .from('participation_confirmations')
                    .select('id')
                    .eq('session_id', sessao.id)
                    .eq('player_phone', players.phone_number)
                    .single();
                
                if (existingConfirmation) {
                    console.log(`   ⚠️ Confirmação já existe para ${players.name}`);
                    continue;
                }
                
                // Criar confirmação pendente
                const { data: confirmation, error: insertError } = await this.supabase
                    .from('participation_confirmations')
                    .insert({
                        session_id: sessao.id,
                        player_id: players.id,
                        player_phone: players.phone_number,
                        status: 'pending',
                        player_type: players.type,
                        notes: 'Aguardando confirmação via WhatsApp'
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    console.log(`   ❌ Erro ao criar confirmação para ${players.name}:`, insertError.message);
                } else {
                    console.log(`   ✅ Confirmação pendente criada para ${players.name} (${players.phone_number})`);
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular confirmações pendentes:', error);
        }
    }

    /**
     * 5. Simular respostas dos jogadores
     */
    async simularRespostasJogadores(sessao) {
        try {
            console.log('\n📱 5. SIMULANDO RESPOSTAS DOS JOGADORES:');
            
            // Buscar confirmações pendentes
            const { data: confirmations, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    id,
                    player_phone,
                    players!inner(
                        name,
                        phone_number
                    )
                `)
                .eq('session_id', sessao.id)
                .eq('status', 'pending');
            
            if (error) {
                console.log('   ❌ Erro ao buscar confirmações pendentes:', error.message);
                return;
            }
            
            if (!confirmations || confirmations.length === 0) {
                console.log('   📝 Nenhuma confirmação pendente encontrada');
                return;
            }
            
            console.log(`   📊 Simulando respostas para ${confirmations.length} confirmações:`);
            
            // Simular respostas (50% confirmam, 30% declinam, 20% não respondem)
            for (let i = 0; i < confirmations.length; i++) {
                const confirmation = confirmations[i];
                const { players } = confirmation;
                
                let response;
                let responseText;
                
                if (i < Math.floor(confirmations.length * 0.5)) {
                    // 50% confirmam
                    response = 'confirmed';
                    responseText = 'SIM';
                } else if (i < Math.floor(confirmations.length * 0.8)) {
                    // 30% declinam
                    response = 'declined';
                    responseText = 'NÃO';
                } else {
                    // 20% não respondem (permanecem pendentes)
                    console.log(`   ⏳ ${players.name}: Não respondeu (permanece pendente)`);
                    continue;
                }
                
                // Atualizar confirmação
                const updateData = {
                    status: response,
                    updated_at: new Date().toISOString()
                };
                
                if (response === 'confirmed') {
                    updateData.confirmed_at = new Date().toISOString();
                } else if (response === 'declined') {
                    updateData.declined_at = new Date().toISOString();
                }
                
                const { error: updateError } = await this.supabase
                    .from('participation_confirmations')
                    .update(updateData)
                    .eq('id', confirmation.id);
                
                if (updateError) {
                    console.log(`   ❌ Erro ao atualizar confirmação para ${players.name}:`, updateError.message);
                } else {
                    console.log(`   ✅ ${players.name}: Respondeu "${responseText}" (${response})`);
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular respostas dos jogadores:', error);
        }
    }

    /**
     * 6. Simular envio da lista no grupo
     */
    async simularEnvioListaGrupo(sessao) {
        try {
            console.log('\n📋 6. SIMULANDO ENVIO DA LISTA NO GRUPO:');
            
            // Buscar todas as confirmações da sessão
            const { data: confirmations, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    id,
                    status,
                    confirmed_at,
                    declined_at,
                    players!inner(
                        name,
                        phone_number
                    )
                `)
                .eq('session_id', sessao.id)
                .order('confirmed_at', { ascending: true });
            
            if (error) {
                console.log('   ❌ Erro ao buscar confirmações:', error.message);
                return;
            }
            
            if (!confirmations || confirmations.length === 0) {
                console.log('   📝 Nenhuma confirmação encontrada para esta sessão');
                return;
            }
            
            // Separar confirmações por status
            const confirmed = confirmations.filter(c => c.status === 'confirmed');
            const declined = confirmations.filter(c => c.status === 'declined');
            const pending = confirmations.filter(c => c.status === 'pending');
            
            console.log(`   📊 Confirmações encontradas:`);
            console.log(`      ✅ Confirmados: ${confirmed.length}`);
            console.log(`      ❌ Ausentes: ${declined.length}`);
            console.log(`      ⏳ Pendentes: ${pending.length}`);
            console.log(`      📱 Total: ${confirmations.length}`);
            
            // Gerar mensagem da lista
            const listMessage = this.generateConfirmationListMessage(confirmed, declined, pending);
            
            console.log(`\n   📱 MENSAGEM QUE SERIA ENVIADA NO GRUPO:`);
            console.log(`   ${listMessage}`);
            
            // Simular envio no grupo
            console.log(`\n   ✅ Lista seria enviada no grupo: 120363123456789012@g.us`);
            
        } catch (error) {
            console.error('   ❌ Erro ao simular envio da lista no grupo:', error);
        }
    }

    /**
     * Gerar mensagem da lista de confirmações
     */
    generateConfirmationListMessage(confirmed, declined, pending) {
        let message = `🏈 *LISTA DE CONFIRMAÇÕES*\n\n`;
        
        // Confirmados
        if (confirmed.length > 0) {
            message += `✅ *CONFIRMADOS (${confirmed.length}):*\n`;
            confirmed.forEach((conf, index) => {
                message += `${index + 1}. ${conf.players.name}\n`;
            });
            message += `\n`;
        }
        
        // Ausentes
        if (declined.length > 0) {
            message += `❌ *AUSENTES (${declined.length}):*\n`;
            declined.forEach((conf, index) => {
                message += `${index + 1}. ${conf.players.name}\n`;
            });
            message += `\n`;
        }
        
        // Pendentes
        if (pending.length > 0) {
            message += `⏳ *PENDENTES (${pending.length}):*\n`;
            pending.forEach((conf, index) => {
                message += `${index + 1}. ${conf.players.name}\n`;
            });
            message += `\n`;
        }
        
        message += `📊 *RESUMO:*\n`;
        message += `✅ Confirmados: ${confirmed.length}\n`;
        message += `❌ Ausentes: ${declined.length}\n`;
        message += `⏳ Pendentes: ${pending.length}\n`;
        message += `📱 Total: ${confirmed.length + declined.length + pending.length}\n\n`;
        message += `🔔 Lista atualizada automaticamente pelo sistema VaiDarJogo`;
        
        return message;
    }

    /**
     * 7. Mostrar instruções para teste real
     */
    async mostrarInstrucoesTesteReal() {
        try {
            console.log('\n📋 7. INSTRUÇÕES PARA TESTE REAL:');
            
            console.log('   🚀 PASSO 1: Iniciar o motor completo');
            console.log('   📝 Execute: node motor_completo_respostas.js');
            console.log('   📝 Aguarde o QR Code aparecer');
            console.log('   📝 Escaneie com o WhatsApp no seu celular');
            
            console.log('\n   📱 PASSO 2: Verificar conexão');
            console.log('   📝 Aguarde a mensagem "WhatsApp conectado e pronto!"');
            console.log('   📝 O motor começará a verificar notificações a cada 10 segundos');
            console.log('   📝 O motor começará a coletar respostas a cada 5 segundos');
            
            console.log('\n   ⏰ PASSO 3: Aguardar notificação');
            console.log('   📝 O motor verificará se é hora de enviar notificações');
            console.log('   📝 Quando chegar o horário, enviará para cada mensalista');
            console.log('   📝 Verifique se as mensagens chegaram nos telefones');
            
            console.log('\n   📥 PASSO 4: Responder às notificações');
            console.log('   📝 Os mensalistas devem responder com SIM ou NÃO');
            console.log('   📝 O motor coletará as respostas automaticamente');
            console.log('   📝 As confirmações serão atualizadas no banco de dados');
            
            console.log('\n   📋 PASSO 5: Lista no grupo');
            console.log('   📝 1 hora antes do jogo, o motor enviará a lista no grupo');
            console.log('   📝 A lista mostrará confirmados, ausentes e pendentes');
            console.log('   📝 Verifique se a mensagem chegou no grupo');
            
            console.log('\n   🔧 FUNCIONAMENTO COMPLETO:');
            console.log('   📝 1. Motor envia notificações individuais para mensalistas');
            console.log('   📝 2. Mensalistas respondem com SIM/NÃO');
            console.log('   📝 3. Motor coleta respostas e atualiza banco de dados');
            console.log('   📝 4. Motor envia lista consolidada no grupo do jogo');
            console.log('   📝 5. Sistema funciona automaticamente sem intervenção');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }

    /**
     * 8. Limpar dados de teste
     */
    async limparDadosTeste(sessao, config) {
        try {
            console.log('\n🧹 8. LIMPANDO DADOS DE TESTE:');
            
            // Remover confirmações de teste
            const { error: confirmationsError } = await this.supabase
                .from('participation_confirmations')
                .delete()
                .eq('session_id', sessao.id);
            
            if (confirmationsError) {
                console.log('   ❌ Erro ao remover confirmações:', confirmationsError.message);
            } else {
                console.log('   ✅ Confirmações removidas');
            }
            
            // Remover configuração
            const { error: configError } = await this.supabase
                .from('notification_configs')
                .delete()
                .eq('id', config.id);
            
            if (configError) {
                console.log('   ❌ Erro ao remover configuração:', configError.message);
            } else {
                console.log('   ✅ Configuração removida');
            }
            
            // Remover sessão
            const { error: sessaoError } = await this.supabase
                .from('game_sessions')
                .delete()
                .eq('id', sessao.id);
            
            if (sessaoError) {
                console.log('   ❌ Erro ao remover sessão:', sessaoError.message);
            } else {
                console.log('   ✅ Sessão removida');
            }
            
            console.log('   📝 Dados de teste removidos');
            console.log('   📝 Sistema limpo para uso normal');
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar dados:', error);
        }
    }
}

// Executar teste
async function main() {
    const teste = new TesteSistemaCompleto();
    await teste.executarTeste();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteSistemaCompleto;
