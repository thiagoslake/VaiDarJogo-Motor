require('dotenv').config();
const { supabaseAdmin } = require('./supabase/config/supabase');

async function testAddressColumn() {
    try {
        console.log('🔍 TESTANDO COLUNA ADDRESS NA TABELA GAMES\n');
        
        // Testar inserção de um jogo com address
        console.log('🧪 Testando inserção de jogo com address...');
        
        const testGame = {
            organization_name: 'Teste Address Column',
            location: 'Local de Teste',
            players_per_team: 7,
            substitutes_per_team: 3,
            number_of_teams: 4,
            start_time: '19:00:00',
            end_time: '21:00:00',
            game_date: '2024-01-15',
            frequency: 'Jogo Avulso',
            status: 'active',
            address: 'Endereço de Teste - Rua das Flores, 123'
        };
        
        console.log('📝 Tentando inserir jogo com address...');
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('games')
            .insert(testGame)
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ Erro ao inserir jogo de teste:', insertError.message);
            
            // Se o erro for sobre a coluna address, significa que ela não existe
            if (insertError.message.includes('address')) {
                console.log('\n💡 A coluna address ainda não foi adicionada à tabela games');
                console.log('   Execute o script SQL diretamente no Supabase Dashboard');
            }
        } else {
            console.log('✅ Jogo de teste inserido com sucesso!');
            console.log(`   - ID: ${insertData.id}`);
            console.log(`   - Address: ${insertData.address}`);
            
            // Limpar o jogo de teste
            const { error: deleteError } = await supabaseAdmin
                .from('games')
                .delete()
                .eq('id', insertData.id);
            
            if (deleteError) {
                console.log('⚠️ Aviso: Não foi possível deletar o jogo de teste:', deleteError.message);
            } else {
                console.log('🧹 Jogo de teste removido');
            }
        }
        
        // Testar consulta simples para ver se a tabela está acessível
        console.log('\n🔍 Testando consulta simples na tabela games...');
        
        const { data: games, error: selectError } = await supabaseAdmin
            .from('games')
            .select('*')
            .limit(1);
        
        if (selectError) {
            console.error('❌ Erro ao consultar tabela games:', selectError.message);
        } else {
            console.log('✅ Tabela games acessível');
            if (games && games.length > 0) {
                const game = games[0];
                console.log('📋 Colunas disponíveis:');
                Object.keys(game).forEach(key => {
                    console.log(`   - ${key}: ${typeof game[key]}`);
                });
                
                // Verificar especificamente se address existe
                if (game.hasOwnProperty('address')) {
                    console.log('\n✅ Coluna address encontrada na tabela!');
                } else {
                    console.log('\n❌ Coluna address NÃO encontrada na tabela');
                }
            }
        }
        
        console.log('\n🎉 Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

if (require.main === module) {
    testAddressColumn();
}

module.exports = { testAddressColumn };
