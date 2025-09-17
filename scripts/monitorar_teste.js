#!/usr/bin/env node

/**
 * 📊 MONITORAR TESTE REAL
 * 
 * Este script monitora o progresso do teste real
 * verificando confirmações e notificações.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class MonitorarTeste {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async monitorarTeste() {
        try {
            console.log('📊 ===== MONITORANDO TESTE REAL =====\n');
            
            // 1. Verificar sessão de teste
            await this.verificarSessaoTeste();
            
            // 2. Verificar confirmações
            await this.verificarConfirmacoes();
            
            // 3. Verificar notificações enviadas
            await this.verificarNotificacoes();
            
            // 4. Mostrar status atual
            await this.mostrarStatusAtual();
            
            console.log('\n📊 ===== MONITORAMENTO CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o monitoramento:', error);
        }
    }

    /**
     * 1. Verificar sessão de teste
     */
    async verificarSessaoTeste() {
        try {
            console.log('🔍 1. VERIFICANDO SESSÃO DE TESTE:');
            
            // Buscar sessão mais recente
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    notes,
                    games!inner(
                        organization_name
                    )
                `)
                .eq('status', 'scheduled')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return;
            }
            
            if (!sessoes || sessoes.length === 0) {
                console.log('   📝 Nenhuma sessão de teste encontrada');
                return;
            }
            
            const sessao = sessoes[0];
            const agora = moment();
            const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const tempoRestante = dataSessao.diff(agora, 'minutes', true);
            
            console.log(`   ✅ Sessão encontrada: ${sessao.id}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   ⏰ Tempo restante: ${tempoRestante.toFixed(1)} minutos`);
            console.log(`   🎮 Jogo: ${sessao.games.organization_name}`);
            console.log(`   📝 Notas: ${sessao.notes}`);
            
            if (tempoRestante <= 0) {
                console.log('   ⚠️ Sessão já passou - teste pode ter terminado');
            } else if (tempoRestante <= 5) {
                console.log('   🔔 Sessão próxima - notificações devem ser enviadas em breve');
            } else {
                console.log('   ⏳ Sessão ainda distante - aguardando horário das notificações');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar sessão de teste:', error);
        }
    }

    /**
     * 2. Verificar confirmações
     */
    async verificarConfirmacoes() {
        try {
            console.log('\n📝 2. VERIFICANDO CONFIRMAÇÕES:');
            
            // Buscar confirmações da sessão mais recente
            const { data: confirmations, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    id,
                    status,
                    confirmed_at,
                    declined_at,
                    created_at,
                    players!inner(
                        name,
                        phone_number
                    ),
                    game_sessions!inner(
                        session_date,
                        start_time
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) {
                console.log('   ❌ Erro ao buscar confirmações:', error.message);
                return;
            }
            
            if (!confirmations || confirmations.length === 0) {
                console.log('   📝 Nenhuma confirmação encontrada');
                return;
            }
            
            console.log(`   📊 Total de confirmações: ${confirmations.length}`);
            
            // Separar por status
            const confirmed = confirmations.filter(c => c.status === 'confirmed');
            const declined = confirmations.filter(c => c.status === 'declined');
            const pending = confirmations.filter(c => c.status === 'pending');
            
            console.log(`   ✅ Confirmados: ${confirmed.length}`);
            console.log(`   ❌ Ausentes: ${declined.length}`);
            console.log(`   ⏳ Pendentes: ${pending.length}`);
            
            // Mostrar detalhes das confirmações recentes
            console.log('\n   📋 Confirmações recentes:');
            confirmations.slice(0, 5).forEach((conf, index) => {
                const statusEmoji = conf.status === 'confirmed' ? '✅' : 
                                  conf.status === 'declined' ? '❌' : '⏳';
                const timestamp = moment(conf.created_at).format('HH:mm:ss');
                console.log(`   ${index + 1}. ${statusEmoji} ${conf.players.name} - ${conf.status} (${timestamp})`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar confirmações:', error);
        }
    }

    /**
     * 3. Verificar notificações enviadas
     */
    async verificarNotificacoes() {
        try {
            console.log('\n📱 3. VERIFICANDO NOTIFICAÇÕES ENVIADAS:');
            
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
            
            console.log(`   📊 Total de notificações: ${notifications.length}`);
            
            // Separar por tipo
            const individual = notifications.filter(n => n.type === 'individual_confirmation');
            const gameReminder = notifications.filter(n => n.type === 'game_reminder');
            const outros = notifications.filter(n => !['individual_confirmation', 'game_reminder'].includes(n.type));
            
            console.log(`   📱 Individuais: ${individual.length}`);
            console.log(`   🔔 Lembretes de jogo: ${gameReminder.length}`);
            console.log(`   📋 Outros: ${outros.length}`);
            
            // Mostrar notificações recentes
            console.log('\n   📋 Notificações recentes:');
            notifications.slice(0, 5).forEach((notif, index) => {
                const timestamp = moment(notif.sent_at).format('HH:mm:ss');
                const tipoEmoji = notif.type === 'individual_confirmation' ? '📱' : 
                                notif.type === 'game_reminder' ? '🔔' : '📋';
                console.log(`   ${index + 1}. ${tipoEmoji} ${notif.title} (${timestamp})`);
            });
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar notificações:', error);
        }
    }

    /**
     * 4. Mostrar status atual
     */
    async mostrarStatusAtual() {
        try {
            console.log('\n📊 4. STATUS ATUAL DO TESTE:');
            
            const agora = moment();
            console.log(`   🕐 Hora atual: ${agora.format('DD/MM/YYYY HH:mm:ss')}`);
            
            // Verificar se há sessão ativa
            const { data: sessaoAtiva, error: sessaoError } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    games!inner(organization_name)
                `)
                .eq('status', 'scheduled')
                .gte('session_date', agora.format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .limit(1)
                .single();
            
            if (sessaoError || !sessaoAtiva) {
                console.log('   ⚠️ Nenhuma sessão ativa encontrada');
                return;
            }
            
            const dataSessao = moment(`${sessaoAtiva.session_date} ${sessaoAtiva.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const tempoRestante = dataSessao.diff(agora, 'minutes', true);
            
            console.log(`   🎮 Próxima sessão: ${sessaoAtiva.games.organization_name}`);
            console.log(`   📅 Data: ${dataSessao.format('DD/MM/YYYY HH:mm')}`);
            console.log(`   ⏰ Tempo restante: ${tempoRestante.toFixed(1)} minutos`);
            
            // Verificar configurações de notificação
            const { data: configs, error: configError } = await this.supabase
                .from('notification_configs')
                .select('*')
                .eq('session_id', sessaoAtiva.id)
                .eq('is_active', true);
            
            if (configError || !configs || configs.length === 0) {
                console.log('   ⚠️ Nenhuma configuração de notificação ativa');
                return;
            }
            
            console.log(`   🔔 Configurações ativas: ${configs.length}`);
            
            // Verificar próximas notificações
            const config = configs[0];
            if (config.notification_schedule) {
                const schedule = Array.isArray(config.notification_schedule) ? 
                               config.notification_schedule : 
                               JSON.parse(config.notification_schedule);
                
                console.log(`   📋 Próximas notificações:`);
                schedule.forEach((item, index) => {
                    const horarioNotificacao = dataSessao.clone().subtract(item.hours_before, 'hours');
                    const tempoAteNotificacao = horarioNotificacao.diff(agora, 'minutes', true);
                    
                    if (tempoAteNotificacao > 0) {
                        console.log(`      ${index + 1}. ${item.hours_before * 60} min antes - ${tempoAteNotificacao.toFixed(1)} min restantes`);
                    } else {
                        console.log(`      ${index + 1}. ${item.hours_before * 60} min antes - JÁ ENVIADA`);
                    }
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar status atual:', error);
        }
    }
}

// Executar monitoramento
async function main() {
    const monitor = new MonitorarTeste();
    await monitor.monitorarTeste();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MonitorarTeste;
