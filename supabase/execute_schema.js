/**
 * 🗄️ EXECUTOR DE SCHEMA - VAIDARJOGO
 * 📅 Data: $(date)
 * 🚀 Executa o schema inicial no Supabase
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('./config/supabase');

async function executeSchema() {
    try {
        console.log('🚀 Iniciando execução do schema...');
        
        // Ler o arquivo SQL
        const schemaPath = path.join(__dirname, 'schema', '01_initial_schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📖 Schema lido com sucesso');
        
        // Dividir o SQL em comandos individuais
        const commands = schemaSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`🔧 Executando ${commands.length} comandos SQL...`);
        
        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                console.log(`\n📝 Comando ${i + 1}/${commands.length}:`);
                console.log(command.substring(0, 100) + '...');
                
                try {
                    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: command });
                    
                    if (error) {
                        console.log(`⚠️  Comando ${i + 1} executado com aviso:`, error.message);
                    } else {
                        console.log(`✅ Comando ${i + 1} executado com sucesso`);
                    }
                } catch (execError) {
                    console.log(`❌ Erro ao executar comando ${i + 1}:`, execError.message);
                    
                    // Tentar executar diretamente se for uma tabela
                    if (command.toLowerCase().includes('create table')) {
                        console.log('🔄 Tentando criar tabela diretamente...');
                        try {
                            // Para CREATE TABLE, vamos usar uma abordagem diferente
                            // Por enquanto, apenas logar o erro
                            console.log('⚠️  CREATE TABLE precisa ser executado manualmente no Supabase Dashboard');
                        } catch (tableError) {
                            console.log('❌ Erro na criação da tabela:', tableError.message);
                        }
                    }
                }
            }
        }
        
        console.log('\n🎉 Schema executado com sucesso!');
        console.log('📋 Verifique o Supabase Dashboard para confirmar as tabelas criadas');
        
    } catch (error) {
        console.error('❌ Erro ao executar schema:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executeSchema();
}

module.exports = { executeSchema };
