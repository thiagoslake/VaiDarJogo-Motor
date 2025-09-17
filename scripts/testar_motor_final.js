#!/usr/bin/env node

/**
 * 🧪 TESTE FINAL DO MOTOR
 * 
 * Este script testa se o motor está funcionando corretamente
 * após a criação das configurações de notificação.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class TesteMotorFinal {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarTeste() {
        try {
            console.log('🧪 ===== TESTE FINAL DO MOTOR =====\n');
            
            // 1. Verificar se as configurações foram criadas
            await this.verificarConfiguracoes();
            
            // 2. Testar consulta do motor
            await this.testarConsultaMotor();
            
            // 3. Simular próximas notificações
            await this.simularProximasNotificacoes();
            
            // 4. Testar lógica de envio
            await this.testarLogicaEnvio();
            
            console.log('\n🧪 ===== TESTE FINAL CONCLUÍDO =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
        }
    }

    /**
     * 1. Verificar se as configurações foram criadas
     */
    async verificarConfiguracoes() {
        try {
            console.log('🔍 1. VERIFICANDO CONFIGURAÇÕES:');
            
            const { count, error } = await this.supabase
                .from('notification_configs')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log('   ❌ Erro ao contar configurações:', error.message);
            } else {
                console.log(`   ✅ Total de configurações: ${count}`);
            }
            
            // Verificar algumas configurações específicas
            const { data: configs, error: configError } = await this.supabase
                .from('notification_configs')
                .select(`
                    id,
                    total_notifications,
                    mensal_notifications,
                    notification_type,
                    is_active,
                    game_sessions!inner(
                        session_date,
                        start_time,
                        games!inner(
                            organization_name
                        )
                    )
                `)
                .limit(3);
            
            if (configError) {
                console.log('   ❌ Erro ao buscar configurações:', configError.message);
            } else {
                console.log(`   📋 Exemplos de configurações:`);
                configs.forEach((config, index) => {
                    console.log(`   ${index + 1}. ${config.game_sessions.games.organization_name} - ${config.game_sessions.session_date} (${config.notification_type}, ativo: ${config.is_active})`);
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar configurações:', error);
        }
    }

    /**
     * 2. Testar consulta do motor
     */
    async testarConsultaMotor() {
        try {
            console.log('\n🔍 2. TESTANDO CONSULTA DO MOTOR:');
            
            const now = moment();
            
            // Consulta exata como o motor faz
            const { data: games, error } = await this.supabase
                .from('games')
                .select(`
                    id,
                    organization_name,
                    location,
                    game_sessions!inner(
                        id,
                        session_date,
                        start_time,
                        status,
                        notification_configs!inner(
                            id,
                            notification_type,
                            total_notifications,
                            mensal_notifications,
                            whatsapp_group_id,
                            notification_schedule,
                            is_active
                        )
                    )
                `)
                .eq('game_sessions.status', 'scheduled')
                .eq('game_sessions.notification_configs.is_active', true)
                .gte('game_sessions.session_date', now.format('YYYY-MM-DD'));
            
            if (error) {
                console.log('   ❌ Erro na consulta do motor:', error.message);
            } else {
                console.log(`   ✅ Consulta do motor funcionando: ${games.length} jogos encontrados`);
                
                if (games.length > 0) {
                    console.log('   📋 Jogos com notificações configuradas:');
                    games.forEach((game, index) => {
                        console.log(`   ${index + 1}. ${game.organization_name} (${game.game_sessions.length} sessões)`);
                        
                        // Mostrar algumas sessões
                        game.game_sessions.slice(0, 2).forEach((session, sIndex) => {
                            console.log(`      Sessão ${sIndex + 1}: ${session.session_date} ${session.start_time}`);
                            const configs = session.notification_configs || [];
                            if (Array.isArray(configs)) {
                                configs.forEach((config, cIndex) => {
                                    console.log(`         Config ${cIndex + 1}: ${config.notification_type} (${config.total_notifications} notificações)`);
                                });
                            }
                        });
                    });
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar consulta do motor:', error);
        }
    }

    /**
     * 3. Simular próximas notificações
     */
    async simularProximasNotificacoes() {
        try {
            console.log('\n🔍 3. SIMULANDO PRÓXIMAS NOTIFICAÇÕES:');
            
            const now = moment();
            
            // Buscar sessões próximas
            const { data: sessions, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        organization_name,
                        location
                    ),
                    notification_configs!inner(
                        id,
                        notification_schedule,
                        is_active
                    )
                `)
                .eq('status', 'scheduled')
                .eq('notification_configs.is_active', true)
                .gte('session_date', now.format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(5);
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return;
            }
            
            console.log(`   📊 Analisando ${sessions.length} sessões próximas:`);
            
            for (const session of sessions) {
                const sessionDateTime = moment(`${session.session_date} ${session.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                
                console.log(`\n   🎯 ${session.games.organization_name}:`);
                console.log(`      📅 Data: ${sessionDateTime.format('DD/MM/YYYY HH:mm')}`);
                console.log(`      ⏳ Faltam: ${timeUntilSession.toFixed(1)} horas`);
                
                // Verificar cada configuração
                const configs = session.notification_configs || [];
                if (!Array.isArray(configs)) {
                    continue;
                }
                
                for (const config of configs) {
                    try {
                        const schedule = Array.isArray(config.notification_schedule) ? 
                            config.notification_schedule : 
                            JSON.parse(config.notification_schedule);
                        
                        console.log(`      🔔 Configuração (${config.id}):`);
                        
                        for (const item of schedule) {
                            const { hours_before, target, message_type } = item;
                            const notificationTime = sessionDateTime.clone().subtract(hours_before, 'hours');
                            const timeUntilNotification = notificationTime.diff(now, 'hours', true);
                            
                            const status = timeUntilNotification > 0 ? '⏳ Pendente' : 
                                         timeUntilNotification > -1 ? '🔔 Agora!' : '✅ Passou';
                            
                            console.log(`         ${status} ${hours_before}h antes (${target}) - ${notificationTime.format('DD/MM HH:mm')}`);
                        }
                    } catch (error) {
                        console.log(`      ❌ Erro ao processar configuração: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao simular próximas notificações:', error);
        }
    }

    /**
     * 4. Testar lógica de envio
     */
    async testarLogicaEnvio() {
        try {
            console.log('\n🔍 4. TESTANDO LÓGICA DE ENVIO:');
            
            const now = moment();
            
            // Buscar sessões que deveriam ter notificação agora
            const { data: sessions, error } = await this.supabase
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
                        notification_schedule,
                        is_active
                    )
                `)
                .eq('status', 'scheduled')
                .eq('notification_configs.is_active', true)
                .gte('session_date', now.format('YYYY-MM-DD'))
                .limit(3);
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return;
            }
            
            console.log(`   📊 Testando lógica de envio para ${sessions.length} sessões:`);
            
            let notificacoesPendentes = 0;
            
            for (const session of sessions) {
                const sessionDateTime = moment(`${session.session_date} ${session.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                
                console.log(`\n   🎯 ${session.games.organization_name}:`);
                
                const configs = session.notification_configs || [];
                if (!Array.isArray(configs)) {
                    continue;
                }
                
                for (const config of configs) {
                    try {
                        const schedule = Array.isArray(config.notification_schedule) ? 
                            config.notification_schedule : 
                            JSON.parse(config.notification_schedule);
                        
                        for (const item of schedule) {
                            const { hours_before, target, message_type } = item;
                            const timeDiff = Math.abs(timeUntilSession - hours_before);
                            
                            // Se está dentro de 30 minutos do horário programado
                            if (timeDiff <= 0.5) {
                                console.log(`      🔔 NOTIFICAÇÃO DEVERIA SER ENVIADA AGORA!`);
                                console.log(`         ${hours_before}h antes, target: ${target}, tipo: ${message_type}`);
                                notificacoesPendentes++;
                            }
                        }
                    } catch (error) {
                        console.log(`      ❌ Erro ao processar configuração: ${error.message}`);
                    }
                }
            }
            
            if (notificacoesPendentes === 0) {
                console.log(`   📝 Nenhuma notificação pendente no momento`);
            } else {
                console.log(`   🔔 ${notificacoesPendentes} notificação(ões) pendente(s)`);
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao testar lógica de envio:', error);
        }
    }
}

// Executar teste
async function main() {
    const teste = new TesteMotorFinal();
    await teste.executarTeste();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteMotorFinal;
