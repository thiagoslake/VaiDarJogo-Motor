const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSchema() {
    try {
        console.log('🚀 Executando schema de configurações de notificações...');
        
        // Ler o arquivo SQL
        const schemaPath = path.join(__dirname, 'schema', '05_notification_configs.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Executar o schema
        const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
        
        if (error) {
            console.error('❌ Erro ao executar schema:', error);
            return false;
        }
        
        console.log('✅ Schema executado com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao executar schema:', error);
        return false;
    }
}

async function checkTable() {
    try {
        console.log('🔍 Verificando se a tabela foi criada...');
        
        // Verificar tabela notification_configs
        const { data, error } = await supabase
            .from('notification_configs')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro ao verificar tabela notification_configs:', error);
            return false;
        }
        
        console.log('✅ Tabela notification_configs criada com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao verificar tabela:', error);
        return false;
    }
}

async function main() {
    console.log('📱 Configurando sistema de notificações...\n');
    
    // Executar schema
    const schemaSuccess = await executeSchema();
    if (!schemaSuccess) {
        console.log('❌ Falha ao executar schema');
        process.exit(1);
    }
    
    console.log('');
    
    // Verificar tabela
    const checkSuccess = await checkTable();
    if (!checkSuccess) {
        console.log('❌ Falha ao verificar tabela');
        process.exit(1);
    }
    
    console.log('\n🎉 Sistema de configurações de notificações configurado com sucesso!');
    console.log('📋 Tabela criada:');
    console.log('   - notification_configs (configurações de notificações)');
    console.log('\n🚀 O bot agora pode configurar notificações automáticas!');
}

main().catch(console.error);

