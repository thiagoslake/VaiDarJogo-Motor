/**
 * 🔍 VERIFICADOR DE TABELAS - VAIDARJOGO
 * 📅 Data: $(date)
 * 🚀 Verifica se todas as tabelas foram criadas no Supabase
 */

require('dotenv').config();
const { supabaseAdmin } = require('./config/supabase');

async function checkTables() {
    try {
        console.log('🔍 Verificando tabelas criadas no Supabase...\n');
        
        // Lista de tabelas esperadas
        const expectedTables = [
            'app_users',
            'games',
            'players',
            'teams',
            'team_players',
            'payments',
            'notifications',
            'game_sessions',
            'device_tokens',
            'audit_logs',
            'api_keys'
        ];
        
        let createdTables = 0;
        let missingTables = [];
        
        for (const tableName of expectedTables) {
            try {
                console.log(`🔍 Verificando tabela: ${tableName}`);
                
                // Tentar fazer uma consulta simples na tabela
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Tabela ${tableName}: ${error.message}`);
                    missingTables.push(tableName);
                } else {
                    console.log(`✅ Tabela ${tableName}: Criada com sucesso`);
                    createdTables++;
                }
                
            } catch (tableError) {
                console.log(`❌ Erro ao verificar ${tableName}: ${tableError.message}`);
                missingTables.push(tableName);
            }
        }
        
        console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
        console.log(`✅ Tabelas criadas: ${createdTables}/${expectedTables.length}`);
        console.log(`❌ Tabelas faltando: ${missingTables.length}`);
        
        if (missingTables.length > 0) {
            console.log('\n📋 Tabelas que precisam ser criadas:');
            missingTables.forEach(table => console.log(`   - ${table}`));
            console.log('\n⚠️  Execute o schema novamente no Supabase Dashboard');
        } else {
            console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
            console.log('🚀 Próximo passo: Configurar RLS e migrar dados');
        }
        
        return { success: true, createdTables, missingTables };
        
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error.message);
        return { success: false, error: error.message };
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkTables();
}

module.exports = { checkTables };
