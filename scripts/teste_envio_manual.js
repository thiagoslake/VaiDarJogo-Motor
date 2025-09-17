#!/usr/bin/env node

/**
 * 🧪 TESTE DE ENVIO MANUAL
 * 
 * Este script testa o envio manual de mensagens
 * para verificar se o WhatsApp está funcionando.
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

class TesteEnvioManual {
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
                clientId: "vaidarjogo-teste-manual",
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
    }

    async testarEnvioManual() {
        try {
            console.log('🧪 ===== TESTE DE ENVIO MANUAL =====\n');
            
            // 1. Conectar ao WhatsApp
            await this.conectarWhatsApp();
            
            // 2. Buscar mensalistas
            const mensalistas = await this.buscarMensalistas();
            
            // 3. Enviar mensagem de teste
            await this.enviarMensagemTeste(mensalistas);
            
            // 4. Finalizar
            await this.finalizar();
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error);
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

    async buscarMensalistas() {
        try {
            console.log('\n👥 Buscando mensalistas...');
            
            const { data: mensalistas, error } = await this.supabase
                .from('players')
                .select('id, name, phone_number, type, status')
                .eq('type', 'monthly')
                .eq('status', 'active');
            
            if (error) {
                console.log('❌ Erro ao buscar mensalistas:', error.message);
                return [];
            }
            
            if (!mensalistas || mensalistas.length === 0) {
                console.log('📝 Nenhum mensalista encontrado');
                return [];
            }
            
            console.log(`📊 Mensalistas encontrados: ${mensalistas.length}`);
            mensalistas.forEach((mensalista, index) => {
                console.log(`   ${index + 1}. ${mensalista.name} - ${mensalista.phone_number}`);
            });
            
            return mensalistas;
            
        } catch (error) {
            console.error('❌ Erro ao buscar mensalistas:', error);
            return [];
        }
    }

    async enviarMensagemTeste(mensalistas) {
        try {
            console.log('\n📤 Enviando mensagem de teste...');
            
            if (mensalistas.length === 0) {
                console.log('📝 Nenhum mensalista para enviar');
                return;
            }
            
            // Enviar para o primeiro mensalista
            const mensalista = mensalistas[0];
            const phoneNumber = `55${mensalista.phone_number}@c.us`;
            
            const message = `🧪 *TESTE DE ENVIO MANUAL*\n\n` +
                          `Olá ${mensalista.name}! 👋\n\n` +
                          `Esta é uma mensagem de teste do sistema VaiDarJogo.\n\n` +
                          `✅ Se você recebeu esta mensagem, o WhatsApp está funcionando!\n\n` +
                          `🕐 Enviada em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                          `🔔 Esta é apenas uma mensagem de teste.`;
            
            console.log(`📱 Enviando para: ${mensalista.name} (${phoneNumber})`);
            
            try {
                await this.client.sendMessage(phoneNumber, message);
                console.log('✅ Mensagem enviada com sucesso!');
                console.log('📱 Verifique se a mensagem chegou no WhatsApp');
            } catch (sendError) {
                console.error('❌ Erro ao enviar mensagem:', sendError.message);
                
                // Tentar com formato diferente
                console.log('🔄 Tentando com formato alternativo...');
                const phoneNumberAlt = `${mensalista.phone_number}@c.us`;
                try {
                    await this.client.sendMessage(phoneNumberAlt, message);
                    console.log('✅ Mensagem enviada com formato alternativo!');
                } catch (altError) {
                    console.error('❌ Erro com formato alternativo:', altError.message);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem de teste:', error);
        }
    }

    async finalizar() {
        console.log('\n🧪 ===== TESTE CONCLUÍDO =====\n');
        
        if (this.isReady) {
            console.log('✅ WhatsApp está conectado e funcionando!');
            console.log('📱 Verifique se a mensagem chegou no telefone');
        } else {
            console.log('❌ WhatsApp não está conectado');
        }
        
        // Manter conexão por mais 10 segundos
        console.log('⏳ Mantendo conexão por 10 segundos...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Desconectar
        await this.client.destroy();
        console.log('🔌 Conexão encerrada');
    }
}

// Executar teste
async function main() {
    const teste = new TesteEnvioManual();
    await teste.testarEnvioManual();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TesteEnvioManual;

