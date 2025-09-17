#!/usr/bin/env node

/**
 * 🧹 LIMPAR E RECRIAR TESTE
 * 
 * Este script limpa configurações antigas e cria um novo teste
 * com configurações corretas.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class LimparERecriarTeste {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async limparERecriar() {
        try {
            console.log('🧹 ===== LIMPANDO E RECRIANDO TESTE =====\n');
            
            // 1. Limpar configurações antigas
            await this.limparConfiguracoesAntigas();
            
            // 2. Limpar sessões de teste antigas
            await this.limparSessoesTeste();
            
            // 3. Criar nova sessão de teste
            const sessaoTeste = await this.criarNovaSessaoTeste();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar nova sessão de teste');
                return;
            }
            
            // 4. Criar nova configuração de teste
            const configTeste = await this.criarNovaConfiguracaoTeste(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar nova configuração de teste');
                return;
            }
            
            // 5. Mostrar instruções para o novo teste
            await this.mostrarInstrucoesNovoTeste(sessaoTeste, configTeste);
            
            console.log('\n🧹 ===== LIMPEZA E RECRIAÇÃO CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a limpeza e recriação:', error);
        }
    }

    /**
     * 1. Limpar configurações antigas
     */
    async limparConfiguracoesAntigas() {
        try {
            console.log('🧹 1. LIMPANDO CONFIGURAÇÕES ANTIGAS:');
            
            // Limpar configurações sem grupo WhatsApp
            const { data: configsSemGrupo, error: semGrupoError } = await this.supabase
                .from('notification_configs')
                .select('id, notification_type, whatsapp_group_id')
                .eq('is_active', true)
                .or('whatsapp_group_id.is.null,whatsapp_group_id.eq.');
            
            if (semGrupoError) {
                console.log('   ❌ Erro ao buscar configurações sem grupo:', semGrupoError.message);
                return;
            }
            
            if (!configsSemGrupo || configsSemGrupo.length === 0) {
                console.log('   📝 Nenhuma configuração sem grupo encontrada');
                return;
            }
            
            console.log(`   📊 Configurações sem grupo encontradas: ${configsSemGrupo.length}`);
            
            // Desativar configurações antigas
            const { error: updateError } = await this.supabase
                .from('notification_configs')
                .update({ is_active: false })
                .or('whatsapp_group_id.is.null,whatsapp_group_id.eq.');
            
            if (updateError) {
                console.log('   ❌ Erro ao desativar configurações antigas:', updateError.message);
            } else {
                console.log('   ✅ Configurações antigas desativadas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar configurações antigas:', error);
        }
    }

    /**
     * 2. Limpar sessões de teste antigas
     */
    async limparSessoesTeste() {
        try {
            console.log('\n🧹 2. LIMPANDO SESSÕES DE TESTE ANTIGAS:');
            
            // Buscar sessões de teste
            const { data: sessoesTeste, error: sessoesError } = await this.supabase
                .from('game_sessions')
                .select('id, notes')
                .ilike('notes', '%teste%');
            
            if (sessoesError) {
                console.log('   ❌ Erro ao buscar sessões de teste:', sessoesError.message);
                return;
            }
            
            if (!sessoesTeste || sessoesTeste.length === 0) {
                console.log('   📝 Nenhuma sessão de teste encontrada');
                return;
            }
            
            console.log(`   📊 Sessões de teste encontradas: ${sessoesTeste.length}`);
            
            // Remover configurações das sessões de teste
            for (const sessao of sessoesTeste) {
                const { error: configError } = await this.supabase
                    .from('notification_configs')
                    .delete()
                    .eq('session_id', sessao.id);
                
                if (configError) {
                    console.log(`   ⚠️ Erro ao remover configuração da sessão ${sessao.id}:`, configError.message);
                }
            }
            
            // Remover confirmações das sessões de teste
            for (const sessao of sessoesTeste) {
                const { error: confirmError } = await this.supabase
                    .from('participation_confirmations')
                    .delete()
                    .eq('session_id', sessao.id);
                
                if (confirmError) {
                    console.log(`   ⚠️ Erro ao remover confirmações da sessão ${sessao.id}:`, confirmError.message);
                }
            }
            
            // Remover sessões de teste
            const { error: sessoesDeleteError } = await this.supabase
                .from('game_sessions')
                .delete()
                .ilike('notes', '%teste%');
            
            if (sessoesDeleteError) {
                console.log('   ❌ Erro ao remover sessões de teste:', sessoesDeleteError.message);
            } else {
                console.log('   ✅ Sessões de teste removidas');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao limpar sessões de teste:', error);
        }
    }

    /**
     * 3. Criar nova sessão de teste
     */
    async criarNovaSessaoTeste() {
        try {
            console.log('\n🔧 3. CRIANDO NOVA SESSÃO DE TESTE:');
            
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
            
            // Criar sessão para 10 minutos no futuro
            const dataSessao = agora.clone().add(10, 'minutes');
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão de TESTE REAL - Sistema de confirmações automáticas - NOVA'
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
     * 4. Criar nova configuração de teste
     */
    async criarNovaConfiguracaoTeste(sessao) {
        try {
            console.log('\n🔧 4. CRIANDO NOVA CONFIGURAÇÃO DE TESTE:');
            
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
                        "hours_before": 0.15, // 9 minutos antes
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.1, // 6 minutos antes
                        "target": "mensalistas",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.05, // 3 minutos antes
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
            console.log(`      1. 9 minutos antes (mensalistas) - confirmação`);
            console.log(`      2. 6 minutos antes (mensalistas) - lembrete`);
            console.log(`      3. 3 minutos antes (mensalistas) - confirmação final`);
            console.log(`   📱 Grupo WhatsApp: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 5. Mostrar instruções para o novo teste
     */
    async mostrarInstrucoesNovoTeste(sessao, config) {
        try {
            console.log('\n📋 5. INSTRUÇÕES PARA O NOVO TESTE:');
            
            console.log('   🚀 PASSO 1: Parar motor anterior (se estiver rodando)');
            console.log('   📝 Pressione Ctrl+C no terminal onde o motor está rodando');
            console.log('   📝 Aguarde a mensagem de parada');
            
            console.log('\n   🚀 PASSO 2: Iniciar o motor completo');
            console.log('   📝 Execute: node motor_completo_respostas.js');
            console.log('   📝 Aguarde o QR Code aparecer');
            console.log('   📝 Escaneie com o WhatsApp no seu celular');
            
            console.log('\n   📱 PASSO 3: Verificar conexão');
            console.log('   📝 Aguarde a mensagem "WhatsApp conectado e pronto!"');
            console.log('   📝 O motor começará a verificar notificações a cada 10 segundos');
            console.log('   📝 O motor começará a coletar respostas a cada 5 segundos');
            
            console.log('\n   ⏰ PASSO 4: Aguardar notificação (10 minutos)');
            console.log('   📝 O motor verificará se é hora de enviar notificações');
            console.log('   📝 Quando chegar o horário, enviará para cada mensalista');
            console.log('   📝 Verifique se as mensagens chegaram nos telefones');
            
            console.log('\n   📥 PASSO 5: Responder às notificações');
            console.log('   📝 Os mensalistas devem responder com SIM ou NÃO');
            console.log('   📝 O motor coletará as respostas automaticamente');
            console.log('   📝 As confirmações serão atualizadas no banco de dados');
            
            console.log('\n   📊 DADOS DO NOVO TESTE:');
            console.log(`   🎮 Jogo: ${sessao.game_id}`);
            console.log(`   📅 Sessão: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   🔔 Configuração: ${config.id}`);
            console.log(`   📱 Grupo: ${config.whatsapp_group_id}`);
            
            console.log('\n   ⚠️ IMPORTANTE:');
            console.log('   📝 Este é um NOVO TESTE REAL - as notificações serão enviadas');
            console.log('   📝 Certifique-se de que o WhatsApp está conectado');
            console.log('   📝 Os mensalistas receberão mensagens reais');
            console.log('   📝 Após o teste, execute o script de limpeza');
            
            console.log('\n   🔧 CORREÇÕES APLICADAS:');
            console.log('   📝 Configurações antigas desativadas');
            console.log('   📝 Sessões de teste antigas removidas');
            console.log('   📝 Nova sessão criada com horário correto');
            console.log('   📝 Nova configuração com tipo "individual"');
            console.log('   📝 Erro de iteração corrigido no motor');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }
}

// Executar limpeza e recriação
async function main() {
    const limpeza = new LimparERecriarTeste();
    await limpeza.limparERecriar();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = LimparERecriarTeste;
