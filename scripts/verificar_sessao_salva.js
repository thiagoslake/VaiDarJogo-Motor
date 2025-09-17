#!/usr/bin/env node

/**
 * 🔍 VERIFICAR SESSÃO SALVA
 * 
 * Este script verifica se a sessão do WhatsApp foi salva
 * e testa o motor com a sessão existente.
 */

const fs = require('fs');
const path = require('path');

class VerificarSessaoSalva {
    constructor() {
        this.authPath = './.wwebjs_auth';
    }

    async verificarSessao() {
        try {
            console.log('🔍 ===== VERIFICANDO SESSÃO SALVA =====\n');
            
            // 1. Verificar se o diretório de autenticação existe
            await this.verificarDiretorioAuth();
            
            // 2. Verificar arquivos de sessão
            await this.verificarArquivosSessao();
            
            // 3. Mostrar instruções
            await this.mostrarInstrucoes();
            
            console.log('\n🔍 ===== VERIFICAÇÃO CONCLUÍDA =====\n');
            
        } catch (error) {
            console.error('❌ Erro durante a verificação:', error);
        }
    }

    /**
     * 1. Verificar se o diretório de autenticação existe
     */
    async verificarDiretorioAuth() {
        try {
            console.log('📁 1. VERIFICANDO DIRETÓRIO DE AUTENTICAÇÃO:');
            
            if (fs.existsSync(this.authPath)) {
                console.log('   ✅ Diretório de autenticação existe:', this.authPath);
                
                // Verificar permissões
                try {
                    fs.accessSync(this.authPath, fs.constants.R_OK | fs.constants.W_OK);
                    console.log('   ✅ Permissões de leitura/escrita: OK');
                } catch (permError) {
                    console.log('   ❌ Erro de permissões:', permError.message);
                }
                
            } else {
                console.log('   ❌ Diretório de autenticação não existe:', this.authPath);
                console.log('   📝 Será criado automaticamente na primeira execução');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar diretório:', error);
        }
    }

    /**
     * 2. Verificar arquivos de sessão
     */
    async verificarArquivosSessao() {
        try {
            console.log('\n📄 2. VERIFICANDO ARQUIVOS DE SESSÃO:');
            
            if (!fs.existsSync(this.authPath)) {
                console.log('   📝 Diretório não existe - nenhuma sessão salva');
                return;
            }
            
            // Listar arquivos no diretório de autenticação
            const files = fs.readdirSync(this.authPath);
            
            if (files.length === 0) {
                console.log('   📝 Diretório vazio - nenhuma sessão salva');
                return;
            }
            
            console.log(`   📊 Arquivos encontrados: ${files.length}`);
            
            // Verificar arquivos específicos
            const sessionFiles = files.filter(file => 
                file.includes('session') || 
                file.includes('auth') || 
                file.endsWith('.json') ||
                file.endsWith('.data')
            );
            
            if (sessionFiles.length > 0) {
                console.log('   ✅ Arquivos de sessão encontrados:');
                sessionFiles.forEach((file, index) => {
                    const filePath = path.join(this.authPath, file);
                    const stats = fs.statSync(filePath);
                    const size = (stats.size / 1024).toFixed(2);
                    const modified = stats.mtime.toLocaleString('pt-BR');
                    console.log(`      ${index + 1}. ${file} (${size} KB) - Modificado: ${modified}`);
                });
            } else {
                console.log('   📝 Nenhum arquivo de sessão específico encontrado');
            }
            
            // Verificar subdiretórios
            const subdirs = files.filter(file => {
                const filePath = path.join(this.authPath, file);
                return fs.statSync(filePath).isDirectory();
            });
            
            if (subdirs.length > 0) {
                console.log('   📁 Subdiretórios encontrados:');
                subdirs.forEach((dir, index) => {
                    const dirPath = path.join(this.authPath, dir);
                    const dirFiles = fs.readdirSync(dirPath);
                    console.log(`      ${index + 1}. ${dir}/ (${dirFiles.length} arquivos)`);
                });
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar arquivos:', error);
        }
    }

    /**
     * 3. Mostrar instruções
     */
    async mostrarInstrucoes() {
        try {
            console.log('\n📋 3. INSTRUÇÕES:');
            
            const hasSession = fs.existsSync(this.authPath) && 
                              fs.readdirSync(this.authPath).length > 0;
            
            if (hasSession) {
                console.log('   ✅ Sessão WhatsApp encontrada!');
                console.log('   🚀 Para testar o motor com sessão salva:');
                console.log('   📝 Execute: node motor_completo_respostas.js');
                console.log('   📝 O motor deve conectar automaticamente sem QR Code');
                console.log('   📝 Se aparecer QR Code, a sessão pode estar expirada');
                
                console.log('\n   🔧 Se houver problemas:');
                console.log('   📝 Delete a pasta: ./.wwebjs_auth/');
                console.log('   📝 Execute o motor novamente para gerar nova sessão');
                
            } else {
                console.log('   📝 Nenhuma sessão salva encontrada');
                console.log('   🚀 Para criar uma nova sessão:');
                console.log('   📝 Execute: node motor_completo_respostas.js');
                console.log('   📝 Escaneie o QR Code com o WhatsApp');
                console.log('   📝 A sessão será salva automaticamente');
                
                console.log('\n   💾 Após o primeiro escaneamento:');
                console.log('   📝 A sessão será reutilizada automaticamente');
                console.log('   📝 Não será necessário escanear QR Code novamente');
            }
            
            console.log('\n   ⚠️ IMPORTANTE:');
            console.log('   📝 A sessão é salva localmente no diretório ./.wwebjs_auth/');
            console.log('   📝 Não compartilhe este diretório - contém dados sensíveis');
            console.log('   📝 A sessão pode expirar após inatividade prolongada');
            
        } catch (error) {
            console.error('   ❌ Erro ao mostrar instruções:', error);
        }
    }
}

// Executar verificação
async function main() {
    const verificador = new VerificarSessaoSalva();
    await verificador.verificarSessao();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = VerificarSessaoSalva;

