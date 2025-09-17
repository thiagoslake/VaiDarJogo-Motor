#!/usr/bin/env node

/**
 * 📱 TESTE WHATSAPP REAL
 * 
 * Este script testa o envio real de notificações via WhatsApp
 * usando o motor completo com conexão real.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TesteWhatsAppReal {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarTesteWhatsApp() {
        try {
            console.log('📱 ===== TESTE WHATSAPP REAL =====\n');
            
            // 1. Verificar se o motor está funcionando
            await this.verificarMotor();
            
            // 2. Criar sessão para teste WhatsApp
            const sessaoTeste = await this.criarSessaoTesteWhatsApp();
            
            if (!sessaoTeste) {
                console.log('❌ Erro ao criar sessão de teste');
                return;
            }
            
            // 3. Criar configuração com ID de grupo real
            const configTeste = await this.criarConfiguracaoTesteWhatsApp(sessaoTeste);
            
            if (!configTeste) {
                console.log('❌ Erro ao criar configuração de teste');
                return;
            }
            
            // 4. Instruções para teste manual
            await this.instrucoesTesteManual(sessaoTeste, configTeste);
            
            // 5. Limpar dados de teste
            await this.limparDadosTesteWhatsApp(sessaoTeste, configTeste);
            
            console.log('\n📱 ===== TESTE WHATSAPP CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste WhatsApp:', error);
        }
    }

    /**
     * 1. Verificar se o motor está funcionando
     */
    async verificarMotor() {
        try {
            console.log('🔍 1. VERIFICANDO MOTOR:');
            
            // Verificar se há configurações ativas
            const { count, error } = await this.supabase
                .from('notification_configs')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            if (error) {
                console.log('   ❌ Erro ao verificar configurações:', error.message);
            } else {
                console.log(`   ✅ Configurações ativas: ${count}`);
            }
            
            // Verificar se há sessões agendadas
            const { count: sessoes, error: sessoesError } = await this.supabase
                .from('game_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'));
            
            if (sessoesError) {
                console.log('   ❌ Erro ao verificar sessões:', sessoesError.message);
            } else {
                console.log(`   ✅ Sessões agendadas: ${sessoes}`);
            }
            
            console.log('   📝 Para testar WhatsApp real, execute:');
            console.log('   📝 node motor_com_stats.js');
            console.log('   📝 Aguarde o QR Code e escaneie com o WhatsApp');
            console.log('   📝 Adicione o bot a um grupo de teste');
            console.log('   📝 Configure o ID do grupo na configuração');
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar motor:', error);
        }
    }

    /**
     * 2. Criar sessão para teste WhatsApp
     */
    async criarSessaoTesteWhatsApp() {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO PARA TESTE WHATSAPP:');
            
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
            const dataSessao = agora.clone().add(10, 'minutes'); // 10 minutos no futuro
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão para teste WhatsApp real - será removida após o teste'
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
     * 3. Criar configuração com ID de grupo real
     */
    async criarConfiguracaoTesteWhatsApp(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO PARA TESTE WHATSAPP:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 3,
                mensal_notifications: 2,
                notification_type: 'group',
                whatsapp_group_id: '120363123456789012@g.us', // ID de exemplo - SUBSTITUA pelo ID real do seu grupo
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.15, // 9 minutos antes
                        "target": "todos",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.1, // 6 minutos antes
                        "target": "todos",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.05, // 3 minutos antes
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
            console.log(`      1. 9 minutos antes (todos) - confirmação`);
            console.log(`      2. 6 minutos antes (todos) - lembrete`);
            console.log(`      3. 3 minutos antes (todos) - confirmação final`);
            console.log(`   📱 WhatsApp Group ID: ${config.whatsapp_group_id}`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração:', error);
            return null;
        }
    }

    /**
     * 4. Instruções para teste manual
     */
    async instrucoesTesteManual(sessao, config) {
        try {
            console.log('\n📋 4. INSTRUÇÕES PARA TESTE MANUAL:');
            
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
            console.log('   📝 Copie o ID do grupo (formato: 120363123456789012@g.us)');
            console.log('   📝 Atualize a configuração no banco com o ID real');
            
            console.log('\n   ⚙️ PASSO 4: Atualizar configuração');
            console.log('   📝 Execute o script de atualização com o ID real');
            console.log('   📝 Ou atualize manualmente no Supabase');
            
            console.log('\n   ⏰ PASSO 5: Aguardar notificação');
            console.log('   📝 O motor verificará a cada 10 segundos');
            console.log('   📝 Quando chegar o horário, enviará a notificação');
            console.log('   📝 Verifique se a mensagem chegou no grupo');
            
            console.log('\n   📊 PASSO 6: Verificar estatísticas');
            console.log('   📝 Execute: node comando_stats.js');
            console.log('   📝 Verifique se a notificação foi registrada');
            
            // Mostrar dados da sessão criada
            console.log('\n   📋 DADOS DA SESSÃO CRIADA:');
            console.log(`   🎮 Jogo: ${sessao.game_id}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   🔔 Configuração: ${config.id}`);
            console.log(`   📱 Group ID: ${config.whatsapp_group_id}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }

    /**
     * 5. Limpar dados de teste
     */
    async limparDadosTesteWhatsApp(sessao, config) {
        try {
            console.log('\n🧹 5. LIMPANDO DADOS DE TESTE:');
            
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

// Executar teste WhatsApp
async function main() {
    const teste = new TesteWhatsAppReal();
    await teste.executarTesteWhatsApp();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteWhatsAppReal;
