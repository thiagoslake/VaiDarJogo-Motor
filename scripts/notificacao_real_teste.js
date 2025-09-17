#!/usr/bin/env node

/**
 * 🔔 NOTIFICAÇÃO REAL PARA TESTE
 * 
 * Este script cria uma sessão real e envia uma notificação real
 * para testar o sistema completo de notificações.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class NotificacaoRealTeste {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executarNotificacaoReal() {
        try {
            console.log('🔔 ===== NOTIFICAÇÃO REAL PARA TESTE =====\n');
            
            // 1. Buscar um jogo existente
            const jogo = await this.buscarJogoExistente();
            
            if (!jogo) {
                console.log('❌ Nenhum jogo encontrado');
                return;
            }
            
            // 2. Criar sessão real para teste
            const sessaoReal = await this.criarSessaoReal(jogo);
            
            if (!sessaoReal) {
                console.log('❌ Erro ao criar sessão real');
                return;
            }
            
            // 3. Criar configuração real
            const configReal = await this.criarConfiguracaoReal(sessaoReal);
            
            if (!configReal) {
                console.log('❌ Erro ao criar configuração real');
                return;
            }
            
            // 4. Enviar notificação real
            await this.enviarNotificacaoReal(sessaoReal, configReal);
            
            // 5. Verificar resultado
            await this.verificarResultadoReal();
            
            // 6. Mostrar estatísticas atualizadas
            await this.mostrarEstatisticasAtualizadas();
            
            console.log('\n🔔 ===== NOTIFICAÇÃO REAL CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a notificação real:', error);
        }
    }

    /**
     * 1. Buscar um jogo existente
     */
    async buscarJogoExistente() {
        try {
            console.log('🔍 1. BUSCANDO JOGO EXISTENTE:');
            
            const { data: jogos, error } = await this.supabase
                .from('games')
                .select('id, organization_name, location')
                .limit(1);
            
            if (error) {
                console.log('   ❌ Erro ao buscar jogos:', error.message);
                return null;
            }
            
            if (!jogos || jogos.length === 0) {
                console.log('   📝 Nenhum jogo encontrado');
                return null;
            }
            
            const jogo = jogos[0];
            console.log(`   ✅ Jogo encontrado: ${jogo.organization_name}`);
            console.log(`   📍 Local: ${jogo.location}`);
            
            return jogo;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar jogo:', error);
            return null;
        }
    }

    /**
     * 2. Criar sessão real para teste
     */
    async criarSessaoReal(jogo) {
        try {
            console.log('\n🔧 2. CRIANDO SESSÃO REAL PARA TESTE:');
            
            const agora = moment();
            const dataSessao = agora.clone().add(5, 'minutes'); // 5 minutos no futuro
            
            const sessaoData = {
                game_id: jogo.id,
                session_date: dataSessao.format('YYYY-MM-DD'),
                start_time: dataSessao.format('HH:mm:ss'),
                end_time: dataSessao.clone().add(2, 'hours').format('HH:mm:ss'),
                status: 'scheduled',
                attendance_count: 0,
                notes: 'Sessão real para teste de notificação - será removida após o teste'
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
            
            console.log(`   ✅ Sessão real criada: ${sessao.id}`);
            console.log(`   📅 Data: ${sessao.session_date} ${sessao.start_time}`);
            console.log(`   ⏰ Faltam: ${dataSessao.diff(agora, 'minutes', true).toFixed(1)} minutos`);
            
            return sessao;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar sessão real:', error);
            return null;
        }
    }

    /**
     * 3. Criar configuração real
     */
    async criarConfiguracaoReal(sessao) {
        try {
            console.log('\n🔧 3. CRIANDO CONFIGURAÇÃO REAL:');
            
            const configData = {
                session_id: sessao.id,
                game_id: sessao.game_id,
                total_notifications: 3,
                mensal_notifications: 2,
                notification_type: 'group',
                whatsapp_group_id: 'teste-real@group.us', // ID de teste real
                notification_schedule: [
                    {
                        "number": 1,
                        "hours_before": 0.1, // 6 minutos antes (para testar agora)
                        "target": "todos",
                        "message_type": "confirmation"
                    },
                    {
                        "number": 2,
                        "hours_before": 0.05, // 3 minutos antes
                        "target": "todos",
                        "message_type": "reminder"
                    },
                    {
                        "number": 3,
                        "hours_before": 0.02, // 1.2 minutos antes
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
            
            console.log(`   ✅ Configuração real criada: ${config.id}`);
            console.log(`   🔔 3 notificações configuradas:`);
            console.log(`      1. 6 minutos antes (todos) - confirmação`);
            console.log(`      2. 3 minutos antes (todos) - lembrete`);
            console.log(`      3. 1.2 minutos antes (todos) - confirmação final`);
            
            return config;
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configuração real:', error);
            return null;
        }
    }

    /**
     * 4. Enviar notificação real
     */
    async enviarNotificacaoReal(sessao, config) {
        try {
            console.log('\n📤 4. ENVIANDO NOTIFICAÇÃO REAL:');
            
            const agora = moment();
            const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const timeUntilSession = dataSessao.diff(agora, 'hours', true);
            
            console.log(`   ⏳ Tempo até a sessão: ${timeUntilSession.toFixed(3)} horas (${(timeUntilSession * 60).toFixed(1)} minutos)`);
            
            const schedule = Array.isArray(config.notification_schedule) ? 
                config.notification_schedule : 
                JSON.parse(config.notification_schedule);
            
            let notificacoesEnviadas = 0;
            
            for (const item of schedule) {
                const { hours_before, target, message_type } = item;
                const timeDiff = Math.abs(timeUntilSession - hours_before);
                
                console.log(`   🔔 Verificando: ${hours_before}h antes (${target})`);
                console.log(`      Diferença: ${timeDiff.toFixed(3)} horas (${(timeDiff * 60).toFixed(1)} minutos)`);
                
                // Se está dentro de 30 minutos do horário programado
                if (timeDiff <= 0.5) {
                    console.log(`      ✅ NOTIFICAÇÃO REAL ENVIADA!`);
                    
                    // Gerar mensagem real
                    const message = this.gerarMensagemReal(sessao, item);
                    console.log(`      📱 Mensagem real:`);
                    console.log(`      ${message}`);
                    
                    // Enviar para o banco
                    await this.enviarParaBancoReal(sessao, item);
                    notificacoesEnviadas++;
                } else {
                    console.log(`      ⏳ Não é hora ainda (diferença: ${(timeDiff * 60).toFixed(1)} minutos)`);
                }
            }
            
            console.log(`\n   📊 Total de notificações reais enviadas: ${notificacoesEnviadas}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao enviar notificação real:', error);
        }
    }

    /**
     * Gerar mensagem real
     */
    gerarMensagemReal(sessao, item) {
        const { hours_before, target, message_type } = item;
        const dataSessao = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
        const formattedDate = dataSessao.format('DD/MM/YYYY [às] HH:mm');
        
        let message = `🏈 *NOTIFICAÇÃO REAL - TESTE*\n\n`;
        message += `📅 Data: ${formattedDate}\n`;
        message += `📍 Local: Sessão Real de Teste\n`;
        message += `⏰ Faltam: ${(hours_before * 60).toFixed(0)} minutos\n\n`;
        
        if (message_type === 'confirmation') {
            message += `⚽ Confirme sua presença!`;
        } else if (message_type === 'reminder') {
            message += `⏰ Lembrete: Jogo em ${(hours_before * 60).toFixed(0)} minutos!`;
        } else if (message_type === 'final_confirmation') {
            message += `🔥 Última chamada! Jogo em ${(hours_before * 60).toFixed(0)} minutos!`;
        }
        
        message += `\n\n🔔 Esta é uma notificação REAL do sistema de teste.`;
        message += `\n📱 Enviada em: ${moment().format('DD/MM/YYYY HH:mm:ss')}`;
        
        return message;
    }

    /**
     * Enviar para o banco real
     */
    async enviarParaBancoReal(sessao, item) {
        try {
            const { hours_before, target, message_type } = item;
            
            // Criar log de notificação real
            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    game_id: sessao.game_id,
                    title: `[REAL] Lembrete: Sessão Real de Teste`,
                    message: `[REAL] Jogo agendado para ${moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY [às] HH:mm')} - ${hours_before}h antes (${target})`,
                    type: 'game_reminder_real',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });

            if (error) {
                console.log(`      ❌ Erro ao salvar no banco: ${error.message}`);
            } else {
                console.log(`      ✅ Notificação real salva no banco`);
            }
            
        } catch (error) {
            console.error(`      ❌ Erro ao enviar para banco real:`, error);
        }
    }

    /**
     * 5. Verificar resultado real
     */
    async verificarResultadoReal() {
        try {
            console.log('\n✅ 5. VERIFICANDO RESULTADO REAL:');
            
            // Contar notificações reais
            const { count, error } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'game_reminder_real');
            
            if (error) {
                console.log('   ❌ Erro ao contar notificações reais:', error.message);
            } else {
                console.log(`   📊 Total de notificações reais: ${count}`);
            }
            
            // Mostrar últimas notificações reais
            const { data: notifications, error: notifError } = await this.supabase
                .from('notifications')
                .select(`
                    id,
                    title,
                    message,
                    sent_at,
                    games!inner(
                        organization_name
                    )
                `)
                .eq('type', 'game_reminder_real')
                .order('sent_at', { ascending: false })
                .limit(3);
            
            if (notifError) {
                console.log('   ❌ Erro ao buscar notificações reais:', notifError.message);
            } else if (notifications && notifications.length > 0) {
                console.log(`   📋 Últimas notificações reais:`);
                notifications.forEach((notification, index) => {
                    const sentTime = moment(notification.sent_at).format('DD/MM HH:mm:ss');
                    console.log(`   ${index + 1}. [${sentTime}] ${notification.games.organization_name} - ${notification.title}`);
                });
            } else {
                console.log('   📝 Nenhuma notificação real encontrada');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar resultado real:', error);
        }
    }

    /**
     * 6. Mostrar estatísticas atualizadas
     */
    async mostrarEstatisticasAtualizadas() {
        try {
            console.log('\n📊 6. ESTATÍSTICAS ATUALIZADAS:');
            
            // Contar todas as notificações
            const { count: totalNotif, error: totalError } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true });
            
            if (totalError) {
                console.log('   ❌ Erro ao contar notificações totais:', totalError.message);
            } else {
                console.log(`   📊 Total de notificações no sistema: ${totalNotif}`);
            }
            
            // Contar notificações da última hora
            const umaHoraAtras = moment().subtract(1, 'hour').toISOString();
            const { count: ultimaHora, error: horaError } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .gte('sent_at', umaHoraAtras);
            
            if (horaError) {
                console.log('   ❌ Erro ao contar notificações da última hora:', horaError.message);
            } else {
                console.log(`   📊 Notificações da última hora: ${ultimaHora}`);
            }
            
            // Mostrar resumo por tipo
            const { data: tipos, error: tiposError } = await this.supabase
                .from('notifications')
                .select('type')
                .order('sent_at', { ascending: false })
                .limit(10);
            
            if (tiposError) {
                console.log('   ❌ Erro ao buscar tipos de notificação:', tiposError.message);
            } else if (tipos && tipos.length > 0) {
                console.log(`   📋 Tipos de notificação recentes:`);
                const tiposUnicos = [...new Set(tipos.map(n => n.type))];
                tiposUnicos.forEach((tipo, index) => {
                    const count = tipos.filter(n => n.type === tipo).length;
                    console.log(`   ${index + 1}. ${tipo}: ${count} notificação(ões)`);
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar estatísticas:', error);
        }
    }
}

// Executar notificação real
async function main() {
    const notificacao = new NotificacaoRealTeste();
    await notificacao.executarNotificacaoReal();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = NotificacaoRealTeste;
