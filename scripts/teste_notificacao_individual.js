#!/usr/bin/env node

/**
 * 📱 TESTE NOTIFICAÇÃO INDIVIDUAL
 * 
 * Este script testa o envio de notificações individuais
 * para mensalistas usando seus números de telefone.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TesteNotificacaoIndividual {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarTeste() {
        try {
            console.log('📱 ===== TESTE NOTIFICAÇÃO INDIVIDUAL =====\n');
            
            // 1. Verificar mensalistas cadastrados
            await this.verificarMensalistas();
            
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
            
            // 4. Simular notificações individuais
            await this.simularNotificacoesIndividuais(sessaoTeste);
            
            // 5. Mostrar instruções para teste real
            await this.mostrarInstrucoesTesteReal();
            
            // 6. Limpar dados de teste
            await this.limparDadosTeste(sessaoTeste, configTeste);
            
            console.log('\n📱 ===== TESTE CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
        }
    }

    /**
     * 1. Verificar mensalistas cadastrados
     */
    async verificarMensalistas() {
        try {
            console.log('🔍 1. VERIFICANDO MENSALISTAS CADASTRADOS:');
            
            // Buscar todos os mensalistas
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
                console.log('   📝 Nenhum mensalista cadastrado');
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
            const dataSessao = agora.clone().add(20, 'minutes'); // 20 minutos no futuro
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão para teste de notificações individuais'
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
                notification_type: 'individual', // Mudado para individual
                whatsapp_group_id: null, // Não usado para notificações individuais
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.3, // 18 minutos antes
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.2, // 12 minutos antes
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
            console.log(`      1. 18 minutos antes (mensalistas) - confirmação`);
            console.log(`      2. 12 minutos antes (mensalistas) - lembrete`);
            console.log(`      3. 6 minutos antes (mensalistas) - confirmação final`);
            console.log(`   📱 Tipo: Individual (não usa grupo)`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 4. Simular notificações individuais
     */
    async simularNotificacoesIndividuais(sessao) {
        try {
            console.log('\n📤 4. SIMULANDO NOTIFICAÇÕES INDIVIDUAIS:');
            
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
            
            console.log(`   📊 Encontrados ${mensalistas.length} mensalistas para notificar:`);
            
            const agora = moment();
            const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const formattedDate = dataSessao.format('DD/MM/YYYY [às] HH:mm');
            
            for (const mensalista of mensalistas) {
                const { players } = mensalista;
                
                console.log(`\n   👤 ${players.name}:`);
                console.log(`      📱 Telefone: ${players.phone_number}`);
                
                // Formatar número para WhatsApp
                const phoneFormatted = this.formatPhoneForWhatsApp(players.phone_number);
                console.log(`      📱 WhatsApp: ${phoneFormatted}`);
                
                // Gerar mensagem
                const message = this.generateIndividualMessage(players.name, 'Jogo de Teste', formattedDate, 'Local de Teste');
                console.log(`      📱 Mensagem:`);
                console.log(`      ${message}`);
                
                // Simular envio
                console.log(`      ✅ Notificação seria enviada para ${phoneFormatted}`);
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular notificações:', error);
        }
    }

    /**
     * Formatar número de telefone para WhatsApp
     */
    formatPhoneForWhatsApp(phoneNumber) {
        try {
            // Remover caracteres não numéricos
            let cleanNumber = phoneNumber.replace(/\D/g, '');
            
            // Se começar com 55 (Brasil), manter
            if (cleanNumber.startsWith('55')) {
                return cleanNumber + '@c.us';
            }
            
            // Se começar com 0, remover
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }
            
            // Adicionar código do Brasil se não tiver
            if (!cleanNumber.startsWith('55')) {
                cleanNumber = '55' + cleanNumber;
            }
            
            return cleanNumber + '@c.us';
            
        } catch (error) {
            console.error('❌ Erro ao formatar número:', error);
            return null;
        }
    }

    /**
     * Gerar mensagem individual personalizada
     */
    generateIndividualMessage(playerName, gameName, formattedDate, location) {
        const message = `🏈 *Olá ${playerName}!*\n\n` +
                       `📅 *Jogo: ${gameName}*\n` +
                       `📅 Data: ${formattedDate}\n` +
                       `📍 Local: ${location}\n\n` +
                       `⚽ *Confirme sua presença no jogo!*\n\n` +
                       `📱 Responda:\n` +
                       `✅ SIM - para confirmar presença\n` +
                       `❌ NÃO - para informar ausência\n\n` +
                       `🔔 Esta é uma notificação automática do sistema VaiDarJogo.`;
        
        return message;
    }

    /**
     * 5. Mostrar instruções para teste real
     */
    async mostrarInstrucoesTesteReal() {
        try {
            console.log('\n📋 5. INSTRUÇÕES PARA TESTE REAL:');
            
            console.log('   🚀 PASSO 1: Iniciar o motor individual');
            console.log('   📝 Execute: node motor_corrigido_individual.js');
            console.log('   📝 Aguarde o QR Code aparecer');
            console.log('   📝 Escaneie com o WhatsApp no seu celular');
            
            console.log('\n   📱 PASSO 2: Verificar conexão');
            console.log('   📝 Aguarde a mensagem "WhatsApp conectado e pronto!"');
            console.log('   📝 O motor começará a verificar notificações a cada 10 segundos');
            
            console.log('\n   ⏰ PASSO 3: Aguardar notificação');
            console.log('   📝 O motor verificará se é hora de enviar notificações');
            console.log('   📝 Quando chegar o horário, enviará para cada mensalista');
            console.log('   📝 Verifique se as mensagens chegaram nos telefones');
            
            console.log('\n   📊 PASSO 4: Verificar estatísticas');
            console.log('   📝 Execute: node comando_stats.js');
            console.log('   📝 Verifique se as notificações foram registradas');
            
            console.log('\n   🔧 FUNCIONAMENTO:');
            console.log('   📝 O motor busca mensalistas ativos do jogo');
            console.log('   📝 Formata os números de telefone para WhatsApp');
            console.log('   📝 Envia mensagem individual para cada mensalista');
            console.log('   📝 Salva log de cada notificação enviada');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }

    /**
     * 6. Limpar dados de teste
     */
    async limparDadosTeste(sessao, config) {
        try {
            console.log('\n🧹 6. LIMPANDO DADOS DE TESTE:');
            
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
    const teste = new TesteNotificacaoIndividual();
    await teste.executarTeste();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteNotificacaoIndividual;
