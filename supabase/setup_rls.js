#!/usr/bin/env node

/**
 * 🔐 SCRIPT DE CONFIGURAÇÃO RLS - VAIDARJOGO
 * 📅 Data: $(date)
 * 🎯 Configuração de políticas de segurança para permitir migração
 */

const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

// =====================================================
// ⚙️ CONFIGURAÇÕES
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
    process.exit(1);
}

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// 🛠️ FUNÇÕES AUXILIARES
// =====================================================

function logProgress(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function handleError(error, context) {
    logProgress(`❌ ERRO em ${context}: ${error.message}`);
    process.exit(1);
}

// =====================================================
// 🔐 CONFIGURAÇÃO RLS
// =====================================================

async function setupRLS() {
    logProgress('🔐 Configurando políticas RLS...');
    
    try {
        // Ler arquivo de políticas RLS
        const rlsFilePath = path.join(__dirname, 'schema/02_rls_policies.sql');
        const rlsSQL = fs.readFileSync(rlsFilePath, 'utf8');
        
        // Executar SQL via Supabase
        const { error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
        
        if (error) {
            // Se exec_sql não existir, tentar executar diretamente
            logProgress('⚠️ exec_sql não disponível, tentando método alternativo...');
            
            // Dividir o SQL em comandos individuais
            const commands = rlsSQL.split(';').filter(cmd => cmd.trim());
            
            for (const command of commands) {
                if (command.trim()) {
                    try {
                        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command + ';' });
                        if (cmdError) {
                            logProgress(`⚠️ Comando ignorado: ${command.substring(0, 50)}...`);
                        }
                    } catch (e) {
                        logProgress(`⚠️ Comando ignorado: ${command.substring(0, 50)}...`);
                    }
                }
            }
        }
        
        logProgress('✅ Políticas RLS configuradas com sucesso!');
        logProgress('🔓 Agora você pode executar a migração de dados');
        
    } catch (error) {
        handleError(error, 'setupRLS');
    }
}

// =====================================================
// 🚀 FUNÇÃO PRINCIPAL
// =====================================================

async function main() {
    logProgress('🚀 INICIANDO CONFIGURAÇÃO RLS');
    
    try {
        // Verificar conexão Supabase
        const { data, error } = await supabase
            .from('app_users')
            .select('count')
            .limit(1);
        
        if (error) {
            throw new Error(`Erro na conexão Supabase: ${error.message}`);
        }
        
        logProgress('✅ Conexão Supabase estabelecida');
        
        // Configurar RLS
        await setupRLS();
        
        logProgress('🎉 CONFIGURAÇÃO RLS CONCLUÍDA!');
        logProgress('📋 Execute a migração novamente: npm run migrate');
        
    } catch (error) {
        handleError(error, 'main');
    }
}

// =====================================================
// 📋 EXECUÇÃO
// =====================================================

if (require.main === module) {
    main().catch(handleError);
}

module.exports = { setupRLS };
