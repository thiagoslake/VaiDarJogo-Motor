#!/usr/bin/env node

/**
 * 🚀 MOTOR COMPLETO COM RESPOSTAS
 * 
 * Este motor envia notificações individuais e coleta as respostas
 * para montar a lista de presença.
 */

// Suprimir warnings de depreciação específicos
process.removeAllListeners('warning');
process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
        // Suprimir apenas o warning de punycode
        return;
    }
    // Manter outros warnings
    console.warn(warning.name, warning.message);
});

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
const http = require('http');
moment.locale('pt-br');

class MotorCompletoRespostas {
    constructor() {
        // Configuração do Puppeteer otimizada
        const puppeteerConfig = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-pings',
                '--password-store=basic',
                '--use-mock-keychain'
            ]
        };

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "vaidarjogo-motor-completo-respostas",
                dataPath: "./.wwebjs_auth"
            }),
            puppeteer: puppeteerConfig,
            restartOnAuthFail: true
        });

        // Configurar Supabase
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.isReady = false;
        this.respostasColetadas = new Map(); // Para armazenar respostas temporariamente
    }

    async iniciar() {
        try {
            console.log('🚀 Iniciando Motor Completo com Respostas...\n');
            
            // 1. Conectar ao WhatsApp
            await this.conectarWhatsApp();
            
            // 2. Configurar listener de mensagens
            this.configurarListenerMensagens();
            
            // 3. Iniciar agendador
            this.iniciarAgendador();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar motor:', error);
        }
    }

    async conectarWhatsApp() {
        return new Promise((resolve, reject) => {
            // QR Code
            this.client.on('qr', (qr) => {
                console.log('📱 QR Code gerado. Escaneie com o WhatsApp:');
                qrcode.generate(qr, { small: true });
            });

            // Sessão carregada
            this.client.on('authenticated', () => {
                console.log('🔐 Sessão WhatsApp autenticada!');
            });

            // Cliente pronto
            this.client.on('ready', () => {
                console.log('✅ WhatsApp conectado e pronto!');
                this.isReady = true;
                resolve();
            });

            // Erro de autenticação
            this.client.on('auth_failure', (msg) => {
                console.error('❌ Falha na autenticação:', msg);
                reject(new Error('Falha na autenticação'));
            });

            // Cliente desconectado
            this.client.on('disconnected', (reason) => {
                console.log('🔌 Cliente desconectado:', reason);
                this.isReady = false;
            });

            // Inicializar cliente
            this.client.initialize().catch(reject);
        });
    }

    configurarListenerMensagens() {
        console.log('👂 Configurando listener de mensagens...');
        
        this.client.on('message', async (message) => {
            try {
                // Ignorar mensagens do próprio bot
                if (message.from === 'status@broadcast') return;
                
                const messageBody = message.body.toLowerCase().trim();
                const senderNumber = message.from.replace('@c.us', '');
                
                console.log(`📨 Mensagem recebida de ${senderNumber}: "${messageBody}"`);
                
                // Verificar se é uma resposta de confirmação
                if (messageBody === 'sim' || messageBody === 'não' || messageBody === 'nao') {
                    await this.processarResposta(senderNumber, messageBody);
                }
                
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error);
            }
        });
    }

    async processarResposta(phoneNumber, resposta) {
        try {
            console.log(`🔄 Processando resposta: ${phoneNumber} -> ${resposta.toUpperCase()}`);
            
            // Buscar o jogador pelo telefone
            const { data: player, error } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type')
                .eq('phone_number', phoneNumber.replace('55', ''))
                .single();
            
            if (error || !player) {
                console.log(`⚠️ Jogador não encontrado para o telefone: ${phoneNumber}`);
                return;
            }
            
            // Buscar sessão ativa para este jogador
            const { data: sessoes, error: sessaoError } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    games!inner(
                        organization_name,
                        location
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'))
                .order('session_date', { ascending: true })
                .limit(1);
            
            if (sessaoError || !sessoes || sessoes.length === 0) {
                console.log(`⚠️ Nenhuma sessão ativa encontrada para ${player.name}`);
                return;
            }
            
            const sessao = sessoes[0];
            const sessionKey = `${sessao.id}_${player.id}`;
            
            // Armazenar resposta
            this.respostasColetadas.set(sessionKey, {
                player: player,
                sessao: sessao,
                resposta: resposta,
                timestamp: moment().format('DD/MM/YYYY HH:mm:ss')
            });
            
            // Atualizar no banco de dados
            await this.atualizarConfirmacao(sessao.id, player.id, player.phone_number, player.type, resposta);
            
            // Enviar confirmação de volta
            const confirmacaoMsg = resposta === 'sim' 
                ? `✅ Confirmado! Você estará presente no jogo ${sessao.games.organization_name} em ${moment(`${sessao.session_date} ${sessao.start_time}`).format('DD/MM/YYYY [às] HH:mm')}.`
                : `❌ Entendido! Você não poderá comparecer ao jogo ${sessao.games.organization_name}.`;
            
            await this.client.sendMessage(`${phoneNumber}@c.us`, confirmacaoMsg);
            console.log(`📤 Confirmação enviada para ${player.name}`);
            
            // Exibir lista atualizada
            await this.exibirListaPresenca(sessao.id);
            
        } catch (error) {
            console.error('❌ Erro ao processar resposta:', error);
        }
    }

    async atualizarConfirmacao(sessionId, playerId, playerPhone, playerType, resposta) {
        try {
            const status = resposta === 'sim' ? 'confirmed' : 'declined';
            const now = moment().toISOString();
            
            const updateData = {
                status: status,
                updated_at: now
            };
            
            if (status === 'confirmed') {
                updateData.confirmed_at = now;
            } else {
                updateData.declined_at = now;
            }
            
            const { error } = await this.supabase
                .from('participation_confirmations')
                .upsert({
                    session_id: sessionId,
                    player_id: playerId,
                    player_phone: playerPhone,
                    player_type: playerType,
                    status: status,
                    ...updateData
                });
            
            if (error) {
                console.log('⚠️ Erro ao atualizar confirmação:', error.message);
            } else {
                console.log(`✅ Confirmação atualizada no banco: ${status}`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar confirmação:', error);
        }
    }

    async exibirListaPresenca(sessionId) {
        try {
            console.log('\n📋 ===== LISTA DE PRESENÇA =====');
            
            // Buscar confirmações da sessão
            const { data: confirmacoes, error } = await this.supabase
                .from('participation_confirmations')
                .select(`
                    status,
                    confirmed_at,
                    declined_at,
                    players!inner(
                        name,
                        phone_number,
                        type
                    )
                `)
                .eq('session_id', sessionId);
            
            if (error) {
                console.log('⚠️ Erro ao buscar confirmações:', error.message);
                return;
            }
            
            if (!confirmacoes || confirmacoes.length === 0) {
                console.log('📝 Nenhuma confirmação encontrada ainda');
                return;
            }
            
            // Separar por status
            const confirmados = confirmacoes.filter(c => c.status === 'confirmed');
            const recusados = confirmacoes.filter(c => c.status === 'declined');
            const pendentes = confirmacoes.filter(c => c.status === 'pending');
            
            console.log(`\n✅ DENTRO DA PARTIDA (${confirmados.length}):`);
            confirmados.forEach((conf, index) => {
                console.log(`   ${index + 1}. ${conf.players.name} (${conf.players.phone_number}) - ${conf.players.type}`);
            });
            
            console.log(`\n❌ FORA DA PARTIDA (${recusados.length}):`);
            recusados.forEach((conf, index) => {
                console.log(`   ${index + 1}. ${conf.players.name} (${conf.players.phone_number}) - ${conf.players.type}`);
            });
            
            console.log(`\n⏳ PENDENTES (${pendentes.length}):`);
            pendentes.forEach((conf, index) => {
                console.log(`   ${index + 1}. ${conf.players.name} (${conf.players.phone_number}) - ${conf.players.type}`);
            });
            
            console.log(`\n📊 RESUMO:`);
            console.log(`   ✅ Dentro da partida: ${confirmados.length}`);
            console.log(`   ❌ Fora da partida: ${recusados.length}`);
            console.log(`   ⏳ Pendentes: ${pendentes.length}`);
            console.log(`   📝 Total: ${confirmacoes.length}`);
            
            console.log('\n📋 ===== FIM DA LISTA =====\n');
            
        } catch (error) {
            console.error('❌ Erro ao exibir lista de presença:', error);
        }
    }

    iniciarAgendador() {
        console.log('⏰ Iniciando agendador de notificações...');
        
        // Verificar a cada 10 segundos
        setInterval(async () => {
            if (this.isReady) {
                await this.verificarENotificar();
            }
        }, 10000);
        
        console.log('✅ Agendador iniciado (verificação a cada 10 segundos)');
    }

    async verificarENotificar() {
        try {
            console.log('🔍 Verificando notificações...');
            const now = moment();
            
            // Buscar sessões que precisam de notificação
            const { data: sessoes, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    game_id,
                    session_date,
                    start_time,
                    games!inner(
                        id,
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
                .gte('session_date', now.format('YYYY-MM-DD'));
            
            if (error) {
                console.log('⚠️ Erro ao buscar sessões:', error.message);
                return;
            }
            
            if (!sessoes || sessoes.length === 0) {
                console.log('📝 Nenhuma sessão encontrada');
                return;
            }
            
            console.log(`📊 Sessões encontradas: ${sessoes.length}`);
            
            // Processar cada sessão
            for (const sessao of sessoes) {
                const sessionDateTime = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const timeUntilSession = sessionDateTime.diff(now, 'hours', true);
                
                console.log(`\n🎮 Processando sessão: ${sessao.games.organization_name}`);
                console.log(`📅 Data da sessão: ${sessionDateTime.format('DD/MM/YYYY HH:mm:ss')}`);
                console.log(`⏰ Tempo restante: ${timeUntilSession.toFixed(3)} horas`);
                
                // Verificar se precisa enviar notificação
                let configs = sessao.notification_configs || [];
                
                // Se não é array, converter para array
                if (!Array.isArray(configs)) {
                    configs = [configs];
                }
                
                console.log(`🔔 Configurações encontradas: ${configs.length}`);
                
                for (const config of configs) {
                    const shouldSend = this.shouldSendNotification(config, timeUntilSession);
                    console.log(`🔍 Deve enviar notificação: ${shouldSend ? 'SIM' : 'NÃO'}`);
                    
                    if (shouldSend) {
                        console.log('📤 Enviando notificações...');
                        await this.enviarNotificacoes(sessao, config);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar notificações:', error);
        }
    }

    shouldSendNotification(config, timeUntilSession) {
        try {
            const { notification_schedule } = config;
            const schedule = Array.isArray(notification_schedule) ? 
                           notification_schedule : 
                           JSON.parse(notification_schedule);
            
            for (const item of schedule) {
                const { hours_before } = item;
                const timeDiff = Math.abs(timeUntilSession - hours_before);
                
                if (timeDiff <= 0.1) { // 6 minutos de tolerância
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.log('⚠️ Erro ao processar notification_schedule:', error.message);
            return false;
        }
    }

    async enviarNotificacoes(sessao, config) {
        try {
            console.log(`📱 Enviando notificação para sessão: ${sessao.games.organization_name}`);
            
            // Buscar mensalistas do jogo
            const { data: mensalistas, error } = await this.supabase
                .from('game_players')
                .select(`
                    players!inner(
                        id,
                        name,
                        phone_number,
                        type
                    )
                `)
                .eq('game_id', sessao.game_id)
                .eq('players.type', 'monthly')
                .eq('players.status', 'active');
            
            if (error) {
                console.log('❌ Erro ao buscar mensalistas:', error.message);
                return;
            }
            
            if (!mensalistas || mensalistas.length === 0) {
                console.log('📝 Nenhum mensalista encontrado para este jogo');
                return;
            }
            
            const sessionDateTime = moment(`${sessao.session_date} ${sessao.start_time}`, 'YYYY-MM-DD HH:mm:ss');
            const formattedDate = sessionDateTime.format('DD/MM/YYYY [às] HH:mm');
            
            // Enviar para cada mensalista
            for (const mensalista of mensalistas) {
                const success = await this.enviarNotificacaoIndividual(mensalista.players, sessao, formattedDate);
                if (success) {
                    // Log individual da notificação enviada
                    await this.logNotification(sessao, config, mensalista.players);
                    
                    // Criar entrada de confirmação pendente
                    await this.criarConfirmacaoPendente(sessao.id, mensalista.players.id, mensalista.players.phone_number, mensalista.players.type);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar notificações:', error);
        }
    }

    async enviarNotificacaoIndividual(player, sessao, formattedDate) {
        try {
            // Verificar se já existe confirmação para este jogador nesta sessão
            const { data: existingConfirmation, error: checkError } = await this.supabase
                .from('participation_confirmations')
                .select('id, status')
                .eq('session_id', sessao.id)
                .eq('player_phone', player.phone_number)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.log(`⚠️ Erro ao verificar confirmação existente para ${player.name}:`, checkError.message);
                return false;
            }
            
            // Se já existe confirmação (qualquer status), não enviar notificação novamente
            if (existingConfirmation) {
                console.log(`📝 ${player.name} (${player.phone_number}) já possui confirmação (${existingConfirmation.status}) - pulando notificação`);
                return true; // Retorna true pois não é um erro, apenas não precisa enviar
            }

            const phoneNumber = `55${player.phone_number}@c.us`;
            
            const message = `🏈 *CONFIRMAÇÃO DE PRESENÇA*\n\n` +
                          `Olá ${player.name}! 👋\n\n` +
                          `Você tem um jogo agendado:\n` +
                          `🎮 *${sessao.games.organization_name}*\n` +
                          `📍 ${sessao.games.location}\n` +
                          `📅 ${formattedDate}\n\n` +
                          `Por favor, confirme sua presença respondendo:\n` +
                          `✅ *SIM* - Estarei presente\n` +
                          `❌ *NÃO* - Não poderei comparecer\n\n` +
                          `Obrigado! 🙏`;
            
            console.log(`📤 Enviando notificação para: ${player.name} (${player.phone_number})`);
            await this.client.sendMessage(phoneNumber, message);
            console.log(`✅ Notificação enviada para: ${player.name} (${player.phone_number})`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao enviar para ${player.name}:`, error.message);
            return false;
        }
    }

    async criarConfirmacaoPendente(sessionId, playerId, playerPhone, playerType) {
        try {
            // Verificar se já existe uma confirmação para esta sessão e telefone
            const { data: existing, error: checkError } = await this.supabase
                .from('participation_confirmations')
                .select('id')
                .eq('session_id', sessionId)
                .eq('player_phone', playerPhone)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.log('⚠️ Erro ao verificar confirmação existente:', checkError.message);
                return;
            }
            
            // Se já existe, não criar novamente
            if (existing) {
                console.log(`📝 Confirmação já existe para ${playerPhone} na sessão ${sessionId}`);
                return;
            }
            
            // Criar nova confirmação
            const { error } = await this.supabase
                .from('participation_confirmations')
                .insert({
                    session_id: sessionId,
                    player_id: playerId,
                    player_phone: playerPhone,
                    player_type: playerType,
                    status: 'pending'
                });
            
            if (error) {
                console.log('⚠️ Erro ao criar confirmação pendente:', error.message);
            } else {
                console.log(`✅ Confirmação pendente criada para ${playerPhone}`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar confirmação pendente:', error);
        }
    }

    async logNotification(sessao, config, player) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .insert({
                    game_id: sessao.game_id,
                    player_id: player.id,
                    type: 'individual_confirmation',
                    title: `Confirmação de presença - ${sessao.games.organization_name}`,
                    message: `Notificação de confirmação enviada para ${player.name} (${player.phone_number})`,
                    sent_at: new Date().toISOString(),
                    status: 'sent'
                });
            
            if (error) {
                console.log('⚠️ Erro ao registrar notificação:', error.message);
            } else {
                console.log(`📝 Notificação registrada no banco para ${player.name} (ID: ${player.id})`);
            }
            
        } catch (error) {
            console.log('⚠️ Erro ao registrar notificação:', error.message);
        }
    }
}

// Servidor HTTP para healthcheck do Railway
function startHealthCheckServer() {
    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                service: 'VaiDarJogo Motor'
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`🏥 Health check server running on port ${port}`);
        console.log(`🔗 Health check endpoint: http://localhost:${port}/health`);
    });

    return server;
}

// Executar motor
async function main() {
    // Iniciar servidor de healthcheck
    startHealthCheckServer();
    
    const motor = new MotorCompletoRespostas();
    await motor.iniciar();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MotorCompletoRespostas;