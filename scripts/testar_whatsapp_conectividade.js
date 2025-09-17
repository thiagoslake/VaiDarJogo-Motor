#!/usr/bin/env node

/**
 * 📱 TESTAR WHATSAPP CONECTIVIDADE
 * 
 * Este script testa se o motor está conectado ao WhatsApp
 * e se consegue enviar mensagens reais.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class TestarWhatsAppConectividade {
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
                clientId: "vaidarjogo-teste-conectividade"
            }),
            puppeteer: puppeteerConfig
        });

        this.isReady = false;
    }

    async testarConectividade() {
        try {
            console.log('📱 ===== TESTANDO CONECTIVIDADE WHATSAPP =====\n');
            
            // Configurar eventos do WhatsApp
            this.setupWhatsAppEvents();
            
            // Inicializar cliente WhatsApp
            await this.client.initialize();
            
            // Aguardar conexão
            await this.aguardarConexao();
            
            // Testar envio de mensagem
            await this.testarEnvioMensagem();
            
            // Finalizar
            await this.finalizar();
            
        } catch (error) {
            console.error('❌ Erro durante o teste de conectividade:', error);
        }
    }

    setupWhatsAppEvents() {
        // QR Code
        this.client.on('qr', (qr) => {
            console.log('📱 QR Code gerado. Escaneie com o WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log('\n⏳ Aguardando conexão...\n');
        });

        // Cliente pronto
        this.client.on('ready', () => {
            console.log('✅ WhatsApp conectado e pronto!');
            this.isReady = true;
        });

        // Bot adicionado a grupo
        this.client.on('group_join', async (notification) => {
            console.log('👥 Bot adicionado ao grupo:', notification.id._serialized);
        });

        // Mensagem recebida
        this.client.on('message', async (message) => {
            if (!message.fromMe) {
                console.log(`📥 Mensagem recebida de ${message.from}: ${message.body.substring(0, 50)}...`);
            }
        });

        // Erro de autenticação
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
        });

        // Cliente desconectado
        this.client.on('disconnected', (reason) => {
            console.log('🔌 Cliente desconectado:', reason);
            this.isReady = false;
        });
    }

    async aguardarConexao() {
        console.log('⏳ Aguardando conexão com WhatsApp...');
        
        // Aguardar até 60 segundos pela conexão
        let tentativas = 0;
        while (!this.isReady && tentativas < 60) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            tentativas++;
            
            if (tentativas % 10 === 0) {
                console.log(`⏳ Aguardando conexão... (${tentativas}s)`);
            }
        }
        
        if (!this.isReady) {
            throw new Error('Timeout: Não foi possível conectar ao WhatsApp em 60 segundos');
        }
    }

    async testarEnvioMensagem() {
        try {
            console.log('\n📤 TESTANDO ENVIO DE MENSAGEM:');
            
            // Número de teste (substitua pelo seu número)
            const numeroTeste = '5513981645787@c.us'; // Thiago
            
            console.log(`📱 Enviando mensagem de teste para: ${numeroTeste}`);
            
            const mensagem = `🧪 *TESTE DE CONECTIVIDADE*\n\n` +
                           `📱 Esta é uma mensagem de teste do sistema VaiDarJogo.\n\n` +
                           `✅ Se você recebeu esta mensagem, o WhatsApp está funcionando!\n\n` +
                           `🕐 Enviada em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                           `🔔 Esta é apenas uma mensagem de teste.`;
            
            // Enviar mensagem
            await this.client.sendMessage(numeroTeste, mensagem);
            
            console.log('✅ Mensagem de teste enviada com sucesso!');
            console.log('📱 Verifique se a mensagem chegou no WhatsApp');
            
            // Aguardar 5 segundos
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem de teste:', error);
        }
    }

    async finalizar() {
        console.log('\n📱 ===== TESTE DE CONECTIVIDADE CONCLUÍDO =====\n');
        
        if (this.isReady) {
            console.log('✅ WhatsApp está conectado e funcionando!');
            console.log('📱 O motor pode enviar notificações normalmente');
        } else {
            console.log('❌ WhatsApp não está conectado');
            console.log('📱 Verifique a conexão e tente novamente');
        }
        
        // Manter conexão por mais 10 segundos para verificar mensagens
        console.log('⏳ Mantendo conexão por 10 segundos para verificar mensagens...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Desconectar
        await this.client.destroy();
        console.log('🔌 Conexão encerrada');
    }
}

// Executar teste de conectividade
async function main() {
    const teste = new TestarWhatsAppConectividade();
    await teste.testarConectividade();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestarWhatsAppConectividade;
