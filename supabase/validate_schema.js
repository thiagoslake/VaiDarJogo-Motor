/**
 * 🔍 VALIDADOR DE SCHEMA - VAIDARJOGO
 * 📅 Data: $(date)
 * 🚀 Valida o schema SQL antes da execução
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function validateSchema() {
    try {
        console.log('🔍 Validando schema SQL...');
        
        // Ler o arquivo SQL
        const schemaPath = path.join(__dirname, 'schema', '01_initial_schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📖 Schema lido com sucesso');
        
        // Dividir o SQL em comandos individuais
        const commands = schemaSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`🔧 Encontrados ${commands.length} comandos SQL válidos`);
        
        // Validar comandos
        let validCommands = 0;
        let invalidCommands = 0;
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                try {
                    // Verificar se é um comando válido
                    if (command.toLowerCase().includes('create table') ||
                        command.toLowerCase().includes('create index') ||
                        command.toLowerCase().includes('alter table') ||
                        command.toLowerCase().includes('insert into')) {
                        validCommands++;
                        console.log(`✅ Comando ${i + 1}: ${command.substring(0, 80)}...`);
                    } else {
                        invalidCommands++;
                        console.log(`⚠️  Comando ${i + 1} (tipo não reconhecido): ${command.substring(0, 80)}...`);
                    }
                } catch (error) {
                    invalidCommands++;
                    console.log(`❌ Comando ${i + 1} inválido: ${error.message}`);
                }
            }
        }
        
        console.log('\n📊 RESUMO DA VALIDAÇÃO:');
        console.log(`✅ Comandos válidos: ${validCommands}`);
        console.log(`⚠️  Comandos com aviso: ${invalidCommands}`);
        console.log(`📝 Total de comandos: ${commands.length}`);
        
        if (invalidCommands === 0) {
            console.log('\n🎉 Schema validado com sucesso!');
            console.log('📋 Próximo passo: Executar no Supabase Dashboard');
        } else {
            console.log('\n⚠️  Schema tem comandos que precisam de atenção');
        }
        
    } catch (error) {
        console.error('❌ Erro ao validar schema:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    validateSchema();
}

module.exports = { validateSchema };
