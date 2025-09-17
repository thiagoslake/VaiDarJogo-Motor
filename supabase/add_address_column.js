/**
 * 🔧 ADICIONAR COLUNA ADDRESS - VAIDARJOGO
 * 📅 Data: $(date)
 * 🚀 Adiciona coluna address à tabela games no Supabase
 */

require('dotenv').config();
const { supabaseAdmin } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function addAddressColumn() {
    try {
        console.log('🔧 ADICIONANDO COLUNA ADDRESS À TABELA GAMES\n');
        
        // Ler o script SQL
        const sqlPath = path.join(__dirname, 'schema', '03_add_address_column.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📖 Script SQL lido com sucesso');
        
        // Executar comando ALTER TABLE diretamente
        console.log('🔧 Executando comando ALTER TABLE...');
        
        try {
            // Adicionar coluna address à tabela games
            const { data, error } = await supabaseAdmin.rpc('exec_sql', {
                sql: 'ALTER TABLE games ADD COLUMN IF NOT EXISTS address TEXT;'
            });
            
            if (error) {
                console.log(`⚠️ Comando executado com aviso: ${error.message}`);
            } else {
                console.log(`✅ Comando executado com sucesso`);
            }
            
        } catch (error) {
            console.log(`❌ Erro ao executar comando: ${error.message}`);
            
            // Tentar método alternativo usando query direta
            console.log('🔄 Tentando método alternativo...');
            try {
                const { data: alterData, error: alterError } = await supabaseAdmin
                    .from('games')
                    .select('*')
                    .limit(1);
                
                if (alterError) {
                    console.log('❌ Erro ao acessar tabela games:', alterError.message);
                } else {
                    console.log('✅ Tabela games acessível');
                }
            } catch (altError) {
                console.log('❌ Erro no método alternativo:', altError.message);
            }
        }
        
        // Verificar se a coluna foi adicionada
        console.log('\n🔍 Verificando se a coluna address foi adicionada...');
        
        const { data: columns, error: columnsError } = await supabaseAdmin
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'games')
            .eq('column_name', 'address');
        
        if (columnsError) {
            console.log('❌ Erro ao verificar colunas:', columnsError.message);
        } else if (columns && columns.length > 0) {
            console.log('✅ Coluna address adicionada com sucesso!');
            console.log('📋 Detalhes da coluna:');
            columns.forEach(col => {
                console.log(`   - Nome: ${col.column_name}`);
                console.log(`   - Tipo: ${col.data_type}`);
                console.log(`   - Nullable: ${col.is_nullable}`);
            });
        } else {
            console.log('❌ Coluna address não foi encontrada');
        }
        
        console.log('\n🎉 Processo concluído!');
        
    } catch (error) {
        console.error('❌ Erro durante o processo:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addAddressColumn();
}

module.exports = { addAddressColumn };
