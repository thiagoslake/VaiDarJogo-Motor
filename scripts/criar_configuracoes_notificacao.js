#!/usr/bin/env node

/**
 * 🔔 CRIAR CONFIGURAÇÕES DE NOTIFICAÇÃO
 * 
 * Este script cria configurações de notificação para todas as sessões
 * que não possuem configuração, permitindo que o motor funcione.
 */

const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');
moment.locale('pt-br');

class CriarConfiguracoesNotificacao {
    constructor() {
        // Configurar Supabase com as MESMAS configurações do Flutter
        const supabaseUrl = 'https://ddlxamlaoumhbbrnmasj.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHhhbWxhb3VtaGJicm5tYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDAwMzcsImV4cCI6MjA3MjUxNjAzN30.VrTmCTDl0zkzP1GQ8YHAqFLbtCUlaYIp7v_4rUHbSMo';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async executar() {
        try {
            console.log('🔔 ===== CRIANDO CONFIGURAÇÕES DE NOTIFICAÇÃO =====\n');
            
            // 1. Buscar sessões sem configuração
            await this.buscarSessoesSemConfiguracao();
            
            // 2. Criar configurações para as sessões
            await this.criarConfiguracoes();
            
            // 3. Verificar resultado
            await this.verificarResultado();
            
            console.log('\n🔔 ===== CONFIGURAÇÕES CRIADAS =====\n');
            
        } catch (error) {
            console.error('❌ Erro ao criar configurações:', error);
        }
    }

    /**
     * 1. Buscar sessões sem configuração
     */
    async buscarSessoesSemConfiguracao() {
        try {
            console.log('🔍 1. BUSCANDO SESSÕES SEM CONFIGURAÇÃO:');
            
            // Buscar sessões que não têm configuração de notificação
            const { data: sessions, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        id,
                        organization_name,
                        location
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'))
                .not('id', 'in', 
                    this.supabase
                        .from('notification_configs')
                        .select('session_id')
                );
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return [];
            }
            
            console.log(`   📊 Encontradas ${sessions.length} sessões sem configuração:`);
            sessions.forEach((session, index) => {
                console.log(`   ${index + 1}. ${session.games.organization_name} - ${session.session_date} ${session.start_time}`);
            });
            
            return sessions;
            
        } catch (error) {
            console.error('   ❌ Erro ao buscar sessões:', error);
            return [];
        }
    }

    /**
     * 2. Criar configurações para as sessões
     */
    async criarConfiguracoes() {
        try {
            console.log('\n🔧 2. CRIANDO CONFIGURAÇÕES:');
            
            // Buscar todas as sessões agendadas
            const { data: sessions, error } = await this.supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_date,
                    start_time,
                    status,
                    games!inner(
                        id,
                        organization_name,
                        location
                    )
                `)
                .eq('status', 'scheduled')
                .gte('session_date', moment().format('YYYY-MM-DD'));
            
            if (error) {
                console.log('   ❌ Erro ao buscar sessões:', error.message);
                return;
            }
            
            console.log(`   📊 Processando ${sessions.length} sessões...`);
            
            let configsCriadas = 0;
            
            for (const session of sessions) {
                try {
                    // Verificar se já existe configuração para esta sessão
                    const { data: existingConfig, error: checkError } = await this.supabase
                        .from('notification_configs')
                        .select('id')
                        .eq('session_id', session.id)
                        .limit(1);
                    
                    if (checkError) {
                        console.log(`   ⚠️ Erro ao verificar sessão ${session.id}:`, checkError.message);
                        continue;
                    }
                    
                    if (existingConfig && existingConfig.length > 0) {
                        console.log(`   ⏭️ Sessão ${session.id} já tem configuração, pulando...`);
                        continue;
                    }
                    
                    // Criar configuração padrão
                    const configData = {
                        session_id: session.id,
                        game_id: session.games.id,
                        total_notifications: 3,
                        mensal_notifications: 2,
                        notification_type: 'group',
                        whatsapp_group_id: null, // Será configurado depois
                        notification_schedule: [
                            {
                                "number": 1,
                                "hours_before": 24,
                                "target": "mensalistas",
                                "message_type": "confirmation"
                            },
                            {
                                "number": 2,
                                "hours_before": 12,
                                "target": "mensalistas",
                                "message_type": "reminder"
                            },
                            {
                                "number": 3,
                                "hours_before": 6,
                                "target": "todos",
                                "message_type": "final_confirmation"
                            }
                        ],
                        is_active: true
                    };
                    
                    const { data: newConfig, error: insertError } = await this.supabase
                        .from('notification_configs')
                        .insert(configData)
                        .select();
                    
                    if (insertError) {
                        console.log(`   ❌ Erro ao criar configuração para sessão ${session.id}:`, insertError.message);
                    } else {
                        console.log(`   ✅ Configuração criada para: ${session.games.organization_name} - ${session.session_date}`);
                        configsCriadas++;
                    }
                    
                } catch (error) {
                    console.log(`   ❌ Erro ao processar sessão ${session.id}:`, error.message);
                }
            }
            
            console.log(`\n   📊 Total de configurações criadas: ${configsCriadas}`);
            
        } catch (error) {
            console.error('   ❌ Erro ao criar configurações:', error);
        }
    }

    /**
     * 3. Verificar resultado
     */
    async verificarResultado() {
        try {
            console.log('\n✅ 3. VERIFICANDO RESULTADO:');
            
            // Contar configurações criadas
            const { count, error } = await this.supabase
                .from('notification_configs')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log('   ❌ Erro ao contar configurações:', error.message);
            } else {
                console.log(`   📊 Total de configurações no banco: ${count}`);
            }
            
            // Testar consulta do motor
            const now = moment();
            const { data: games, error: motorError } = await this.supabase
                .from('games')
                .select(`
                    id,
                    organization_name,
                    location,
                    game_sessions!inner(
                        id,
                        session_date,
                        start_time,
                        status,
                        notification_configs!inner(
                            id,
                            notification_type,
                            total_notifications,
                            mensal_notifications,
                            whatsapp_group_id,
                            notification_schedule,
                            is_active
                        )
                    )
                `)
                .eq('game_sessions.status', 'scheduled')
                .eq('game_sessions.notification_configs.is_active', true)
                .gte('game_sessions.session_date', now.format('YYYY-MM-DD'));
            
            if (motorError) {
                console.log('   ❌ Erro na consulta do motor:', motorError.message);
            } else {
                console.log(`   ✅ Consulta do motor funcionando: ${games.length} jogos encontrados`);
                
                if (games.length > 0) {
                    console.log('   📋 Jogos com notificações configuradas:');
                    games.forEach((game, index) => {
                        console.log(`   ${index + 1}. ${game.organization_name} (${game.game_sessions.length} sessões)`);
                    });
                }
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar resultado:', error);
        }
    }
}

// Executar criação de configurações
async function main() {
    const criador = new CriarConfiguracoesNotificacao();
    await criador.executar();
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CriarConfiguracoesNotificacao;
