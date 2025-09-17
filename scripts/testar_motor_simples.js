#!/usr/bin/env node

/**
 * 🧪 TESTAR MOTOR SIMPLES
 * 
 * Este script testa se o motor simples está funcionando
 * e se as notificações estão sendo enviadas.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TestarMotorSimples {
    constructor() {
        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async testarMotor() {
        try {
            console.log('🧪 ===== TESTANDO MOTOR SIMPLES =====\n');
            
            // 1. Verificar sessões ativas
            await this.verificarSessoesAtivas();
            
            // 2. Verificar notificações enviadas
            await this.verificarNotificacoesEnviadas();
            
            // 3. Verificar mensalistas
            await this.verificarMensalistas();
            
            // 4. Criar teste se necessário
            await this.criarTesteSeNecessario();
            
            console.log('\n🧪 ===== TESTE CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
        }
    }

    /**
     * 1. Verificar sessões ativas
     */
    async verificarSessoesAtivas() {
        try {
            console.log('🔍 1. VERIFICANDO SESSÕES ATIVAS:');
            
            const now = moment();
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        organization_name
                    ),
                    notification_configs!inner(
                        id,
                        is_active,
                        notification_schedule
                    )
                `)
                .eq('status', 'scheduled')
                .eq('notification_configs.is_active', true)
                .gte('session_date', now.format('YYYY-MM-DD'))
                .order('session_date', { ascending: true });
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return;
            }
            
            if (!sessoes || sessoes.length === 0) {
                console.log('   📝 Nenhuma sessão ativa encontrada');
                return;
            }
            
            console.log(`   📊 Sessões ativas encontradas: ${sessoes.length}`);
            
            sessoes.forEach((sessao, index) => {
                const sessionDateTime = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                
                console.log(`   ${index + 1}. ${sessao.games.organization_name}`);
                console.log(`      📅 ${sessionDateTime.format('DD/MM/YYYY HH:mm')}`);
                console.log(`      ⏰ Tempo restante: ${timeUntilSession.toFixed(2)} horas`);
                console.log(`      🔔 Configurações: ${sessao.notification_configs?.length || 0}`);
                
                // Verificar se está próximo do horário de notificação
                if (timeUntilSession <= 0.5) {
                    console.log(`      🚨 PRÓXIMO DO HORÁRIO DE NOTIFICAÇÃO!`);
                }
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar sessões:', error);
        }
    }

    /**
     * 2. Verificar notificações enviadas
     */
    async verificarNotificacoesEnviadas() {
        try {
            console.log('\n📱 2. VERIFICANDO NOTIFICAÇÕES ENVIADAS:');
            
            // Buscar notificações das últimas 2 horas
            const duasHorasAtras = moment().subtract(2, 'hours').toISOString();
            
            const { data: notifications, error } = await this.supabase
                .from('notifications')
                .select('*')
                .gte('sent_at', duasHorasAtras)
                .order('sent_at', { ascending: false });
            
            if (error) {
                console.log('   ❌ Erro ao buscar notificações:', error.message);
                return;
            }
            
            if (!notifications || notifications.length === 0) {
                console.log('   📝 Nenhuma notificação enviada nas últimas 2 horas');
                return;
            }
            
            console.log(`   📊 Notificações enviadas: ${notifications.length}`);
            
            notifications.forEach((notif, index) => {
                const timestamp = moment(notif.sent_at).format('DD/MM HH:mm:ss');
                console.log(`   ${index + 1}. ${notif.title}`);
                console.log(`      📅 ${timestamp}`);
                console.log(`      📝 ${notif.message}`);
                console.log(`      📊 Status: ${notif.status}`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar notificações:', error);
        }
    }

    /**
     * 3. Verificar mensalistas
     */
    async verificarMensalistas() {
        try {
            console.log('\n👥 3. VERIFICANDO MENSALISTAS:');
            
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
            
            console.log(`   📊 Mensalistas ativos: ${mensalistas.length}`);
            
            mensalistas.forEach((mensalista, index) => {
                console.log(`   ${index + 1}. ${mensalista.name} - ${mensalista.phone_number}`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar mensalistas:', error);
        }
    }

    /**
     * 4. Criar teste se necessário
     */
    async criarTesteSeNecessario() {
        try {
            console.log('\n🔧 4. VERIFICANDO SE PRECISA CRIAR TESTE:');
            
            const now = moment();
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select('id')
                .eq('status', 'scheduled')
                .gte('session_date', now.format('YYYY-MM-DD'))
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro ao verificar sessões:', error.message);
                return;
            }
            
            if (!sessoes || sessoes.length === 0) {
                console.log('   📝 Nenhuma sessão encontrada - criando teste...');
                await this.criarSessaoTeste();
            } else {
                console.log('   ✅ Sessões encontradas - teste não necessário');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar necessidade de teste:', error);
        }
    }

    /**
     * Criar sessão de teste
     */
    async criarSessaoTeste() {
        try {
            console.log('   🔧 Criando sessão de teste...');
            
            // Buscar um jogo existente
            const { data: jogos, error: jogoError } = await this.supabase
                .from('games')
                .select('id, organization_name')
                .limit(1);
            
            if (jogoError || !jogos || jogos.length === 0) {
                console.log('   ❌ Erro ao buscar jogo:', jogoError?.message);
                return;
            }
            
            const jogo = jogos[0];
            const agora = moment();
            
            // Criar sessão para 5 minutos no futuro
            const dataSessao = agora.clone().add(5, 'minutes');
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão de teste - Motor simples'
            };
            
            const { data: sessao, error: sessaoError } = await this.supabase
                .from('game_sessions')
                .insert(sessaoData)
                .select()
                .single();
            
            if (sessaoError) {
                console.log('   ❌ Erro ao criar sessão:', sessaoError.message);
                return;
            }
            
            // Criar configuração de notificação
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
                        "hours_before": 0.08, // 5 minutos antes
                        "target": "mensalistas",
                        "message_type": "confirmation"
                    }
                ],
                is_active: true
            };
            
            const { data: config, error: configError } = await this.supabase
                .from('notification_configs')
                .insert(configData)
                .select()
                .single();
            
            if (configError) {
                console.log('   ❌ Erro ao criar configuração:', configError.message);
                return;
            }
            
            console.log('   ✅ Sessão de teste criada:');
            console.log(`      📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`      🎮 Jogo: ${jogo.organization_name}`);
            console.log(`      🔔 Configuração: ${config.id}`);
            console.log('   📝 O motor deve enviar notificações em ~5 minutos');
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão de teste:', error);
        }
    }
}

// Executar teste
async function main() {
    const teste = new TestarMotorSimples();
    await teste.testarMotor();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestarMotorSimples;

