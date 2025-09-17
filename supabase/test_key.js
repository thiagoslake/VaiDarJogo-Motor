require('dotenv').config();

console.log('🔍 Testando chave do Supabase...');
console.log('URL:', process.env.SUPABASE_URL);
console.log('Chave completa:', process.env.SUPABASE_ANON_KEY);
console.log('Tamanho da chave:', process.env.SUPABASE_ANON_KEY?.length);

// Verificar se a chave está correta
const key = process.env.SUPABASE_ANON_KEY;
if (key && key.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    console.log('✅ Chave parece estar correta');
} else {
    console.log('❌ Chave parece estar incorreta');
}
