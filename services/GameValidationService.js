const moment = require('moment');
moment.locale('pt-br');

class GameValidationService {
    constructor(database) {
        this.db = database;
    }

    /**
     * Valida os dados de um jogo e suas sessões
     */
    async validateGameAndSessions(gameId) {
        try {
            console.log(`🔍 Iniciando validação do jogo ${gameId}...`);

            // Buscar dados do jogo
            const game = await this.getGameData(gameId);
            if (!game) {
                throw new Error('Jogo não encontrado');
            }

            // Buscar sessões do jogo
            const sessions = await this.getGameSessions(gameId);
            
            const validationResult = {
                game_id: gameId,
                game_data: game,
                validation_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                is_valid: true,
                errors: [],
                warnings: [],
                session_validation: {
                    total_sessions: sessions.length,
                    valid_sessions: 0,
                    invalid_sessions: 0,
                    session_details: []
                }
            };

            // Validar dados do jogo
            await this.validateGameData(game, validationResult);

            // Validar sessões
            await this.validateSessions(game, sessions, validationResult);

            // Determinar se o jogo é válido
            validationResult.is_valid = validationResult.errors.length === 0;

            console.log(`✅ Validação concluída. Válido: ${validationResult.is_valid}`);
            return validationResult;

        } catch (error) {
            console.error('❌ Erro na validação do jogo:', error);
            throw error;
        }
    }

    /**
     * Busca dados do jogo
     */
    async getGameData(gameId) {
        try {
            const { data, error } = await this.db.supabase
                .from('games')
                .select('*')
                .eq('id', gameId)
                .single();

            if (error) {
                throw new Error(`Erro ao buscar jogo: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar dados do jogo:', error);
            throw error;
        }
    }

    /**
     * Busca sessões do jogo
     */
    async getGameSessions(gameId) {
        try {
            const { data, error } = await this.db.supabase
                .from('game_sessions')
                .select('*')
                .eq('game_id', gameId)
                .order('session_date', { ascending: true });

            if (error) {
                throw new Error(`Erro ao buscar sessões: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar sessões do jogo:', error);
            throw error;
        }
    }

    /**
     * Valida dados básicos do jogo
     */
    async validateGameData(game, validationResult) {
        console.log('📋 Validando dados do jogo...');

        // Validar campos obrigatórios
        const requiredFields = [
            'organization_name',
            'location',
            'players_per_team',
            'substitutes_per_team',
            'number_of_teams',
            'start_time',
            'end_time',
            'frequency'
        ];

        for (const field of requiredFields) {
            if (!game[field] && game[field] !== 0) {
                validationResult.errors.push(`Campo obrigatório ausente: ${field}`);
            }
        }

        // Validar valores numéricos
        if (game.players_per_team && (game.players_per_team < 1 || game.players_per_team > 20)) {
            validationResult.errors.push('Jogadores por time deve estar entre 1 e 20');
        }

        if (game.substitutes_per_team && (game.substitutes_per_team < 0 || game.substitutes_per_team > 10)) {
            validationResult.errors.push('Reservas por time deve estar entre 0 e 10');
        }

        if (game.number_of_teams && (game.number_of_teams < 2 || game.number_of_teams > 8)) {
            validationResult.errors.push('Número de times deve estar entre 2 e 8');
        }

        // Validar horários
        if (game.start_time && game.end_time) {
            const startTime = moment(game.start_time, 'HH:mm');
            const endTime = moment(game.end_time, 'HH:mm');

            if (!startTime.isValid()) {
                validationResult.errors.push('Horário de início inválido');
            }

            if (!endTime.isValid()) {
                validationResult.errors.push('Horário de fim inválido');
            }

            if (startTime.isValid() && endTime.isValid() && endTime.isSameOrBefore(startTime)) {
                validationResult.errors.push('Horário de fim deve ser posterior ao horário de início');
            }
        }

        // Validar frequência
        const validFrequencies = ['Diária', 'Semanal', 'Mensal', 'Anual', 'Jogo Avulso'];
        if (game.frequency && !validFrequencies.includes(game.frequency)) {
            validationResult.errors.push(`Frequência inválida: ${game.frequency}. Deve ser uma de: ${validFrequencies.join(', ')}`);
        }

        // Validar dia da semana para jogos com frequência
        if (game.frequency && game.frequency !== 'Jogo Avulso' && game.frequency !== 'Diária') {
            if (!game.day_of_week) {
                validationResult.errors.push('Dia da semana é obrigatório para jogos com frequência');
            } else {
                const validDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                if (!validDays.includes(game.day_of_week)) {
                    validationResult.errors.push(`Dia da semana inválido: ${game.day_of_week}`);
                }
            }
        }

        console.log(`📋 Validação de dados concluída. Erros: ${validationResult.errors.length}`);
    }

    /**
     * Valida as sessões do jogo
     */
    async validateSessions(game, sessions, validationResult) {
        console.log(`📅 Validando ${sessions.length} sessões...`);

        if (sessions.length === 0) {
            validationResult.warnings.push('Nenhuma sessão encontrada para este jogo');
            return;
        }

        // Para jogos avulsos, deve ter apenas uma sessão
        if (game.frequency === 'Jogo Avulso' && sessions.length > 1) {
            validationResult.errors.push('Jogo avulso deve ter apenas uma sessão');
        }

        // Validar cada sessão
        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            const sessionValidation = await this.validateSingleSession(game, session, i + 1);
            
            validationResult.session_validation.session_details.push(sessionValidation);

            if (sessionValidation.is_valid) {
                validationResult.session_validation.valid_sessions++;
            } else {
                validationResult.session_validation.invalid_sessions++;
                validationResult.errors.push(...sessionValidation.errors);
            }
        }

        // Validar sequência de datas para jogos com frequência
        if (game.frequency && game.frequency !== 'Jogo Avulso') {
            await this.validateSessionSequence(game, sessions, validationResult);
        }

        console.log(`📅 Validação de sessões concluída. Válidas: ${validationResult.session_validation.valid_sessions}/${sessions.length}`);
    }

    /**
     * Valida uma sessão individual
     */
    async validateSingleSession(game, session, sessionNumber) {
        const sessionValidation = {
            session_number: sessionNumber,
            session_id: session.id,
            session_date: session.session_date,
            is_valid: true,
            errors: [],
            warnings: []
        };

        // Validar data da sessão
        const sessionDate = moment(session.session_date);
        if (!sessionDate.isValid()) {
            sessionValidation.errors.push('Data da sessão inválida');
            sessionValidation.is_valid = false;
        } else {
            // Verificar se a data não é no passado (exceto para jogos já realizados)
            if (sessionDate.isBefore(moment(), 'day') && session.status !== 'completed') {
                sessionValidation.warnings.push('Sessão no passado');
            }
        }

        // Validar horários da sessão
        if (session.start_time !== game.start_time) {
            sessionValidation.errors.push(`Horário de início incorreto: ${session.start_time} (esperado: ${game.start_time})`);
            sessionValidation.is_valid = false;
        }

        if (session.end_time !== game.end_time) {
            sessionValidation.errors.push(`Horário de fim incorreto: ${session.end_time} (esperado: ${game.end_time})`);
            sessionValidation.is_valid = false;
        }

        // Validar dia da semana para jogos com frequência
        if (game.frequency && game.frequency !== 'Jogo Avulso' && game.frequency !== 'Diária' && game.day_of_week) {
            const expectedDayOfWeek = this.getDayOfWeekNumber(game.day_of_week);
            const actualDayOfWeek = sessionDate.day();

            if (actualDayOfWeek !== expectedDayOfWeek) {
                sessionValidation.errors.push(`Dia da semana incorreto: ${this.getDayName(actualDayOfWeek)} (esperado: ${game.day_of_week})`);
                sessionValidation.is_valid = false;
            }
        }

        // Validar status da sessão
        const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(session.status)) {
            sessionValidation.errors.push(`Status inválido: ${session.status}`);
            sessionValidation.is_valid = false;
        }

        return sessionValidation;
    }

    /**
     * Valida a sequência de datas das sessões
     */
    async validateSessionSequence(game, sessions, validationResult) {
        console.log('📊 Validando sequência de datas...');

        if (sessions.length < 2) {
            return; // Não há sequência para validar
        }

        const sortedSessions = sessions.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

        for (let i = 1; i < sortedSessions.length; i++) {
            const currentSession = moment(sortedSessions[i].session_date);
            const previousSession = moment(sortedSessions[i - 1].session_date);
            
            const expectedInterval = this.getExpectedInterval(game.frequency);
            const actualInterval = currentSession.diff(previousSession, 'days');

            // Permitir uma tolerância de ±1 dia
            if (Math.abs(actualInterval - expectedInterval) > 1) {
                validationResult.warnings.push(
                    `Intervalo incorreto entre sessões ${i} e ${i + 1}: ${actualInterval} dias (esperado: ${expectedInterval} dias)`
                );
            }
        }
    }

    /**
     * Retorna o intervalo esperado em dias para cada frequência
     */
    getExpectedInterval(frequency) {
        switch (frequency) {
            case 'Diária': return 1;
            case 'Semanal': return 7;
            case 'Mensal': return 30;
            case 'Anual': return 365;
            default: return 0;
        }
    }

    /**
     * Converte dia da semana para número
     */
    getDayOfWeekNumber(dayName) {
        const days = {
            'Domingo': 0,
            'Segunda': 1,
            'Terça': 2,
            'Quarta': 3,
            'Quinta': 4,
            'Sexta': 5,
            'Sábado': 6
        };
        return days[dayName] !== undefined ? days[dayName] : -1;
    }

    /**
     * Converte número do dia da semana para nome
     */
    getDayName(dayNumber) {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return days[dayNumber] || 'Desconhecido';
    }

    /**
     * Gera relatório de validação em formato legível
     */
    generateValidationReport(validationResult) {
        let report = `🔍 *RELATÓRIO DE VALIDAÇÃO DO JOGO*\n\n`;
        
        report += `🏆 *Jogo:* ${validationResult.game_data.organization_name}\n`;
        report += `📍 *Local:* ${validationResult.game_data.location}\n`;
        report += `📅 *Data da Validação:* ${validationResult.validation_date}\n\n`;

        // Status geral
        const statusIcon = validationResult.is_valid ? '✅' : '❌';
        report += `${statusIcon} *Status Geral:* ${validationResult.is_valid ? 'VÁLIDO' : 'INVÁLIDO'}\n\n`;

        // Resumo das sessões
        report += `📊 *RESUMO DAS SESSÕES:*\n`;
        report += `• Total: ${validationResult.session_validation.total_sessions}\n`;
        report += `• Válidas: ${validationResult.session_validation.valid_sessions}\n`;
        report += `• Inválidas: ${validationResult.session_validation.invalid_sessions}\n\n`;

        // Erros
        if (validationResult.errors.length > 0) {
            report += `❌ *ERROS ENCONTRADOS:*\n`;
            validationResult.errors.forEach((error, index) => {
                report += `${index + 1}. ${error}\n`;
            });
            report += `\n`;
        }

        // Avisos
        if (validationResult.warnings.length > 0) {
            report += `⚠️ *AVISOS:*\n`;
            validationResult.warnings.forEach((warning, index) => {
                report += `${index + 1}. ${warning}\n`;
            });
            report += `\n`;
        }

        // Detalhes das sessões
        if (validationResult.session_validation.session_details.length > 0) {
            report += `📅 *DETALHES DAS SESSÕES:*\n`;
            validationResult.session_validation.session_details.forEach((session, index) => {
                const sessionIcon = session.is_valid ? '✅' : '❌';
                report += `${sessionIcon} *Sessão ${session.session_number}* (${session.session_date})\n`;
                
                if (session.errors.length > 0) {
                    session.errors.forEach(error => {
                        report += `   • ${error}\n`;
                    });
                }
                
                if (session.warnings.length > 0) {
                    session.warnings.forEach(warning => {
                        report += `   ⚠️ ${warning}\n`;
                    });
                }
                
                report += `\n`;
            });
        }

        return report;
    }

    /**
     * Valida todos os jogos ativos
     */
    async validateAllActiveGames() {
        try {
            console.log('🔍 Iniciando validação de todos os jogos ativos...');

            const { data: games, error } = await this.db.supabase
                .from('games')
                .select('id, organization_name, location')
                .eq('status', 'active');

            if (error) {
                throw new Error(`Erro ao buscar jogos ativos: ${error.message}`);
            }

            const results = [];
            let totalValid = 0;
            let totalInvalid = 0;

            for (const game of games) {
                try {
                    const validation = await this.validateGameAndSessions(game.id);
                    results.push(validation);
                    
                    if (validation.is_valid) {
                        totalValid++;
                    } else {
                        totalInvalid++;
                    }
                } catch (error) {
                    console.error(`Erro ao validar jogo ${game.id}:`, error);
                    results.push({
                        game_id: game.id,
                        is_valid: false,
                        errors: [`Erro na validação: ${error.message}`]
                    });
                    totalInvalid++;
                }
            }

            return {
                total_games: games.length,
                valid_games: totalValid,
                invalid_games: totalInvalid,
                results: results,
                validation_date: moment().format('YYYY-MM-DD HH:mm:ss')
            };

        } catch (error) {
            console.error('❌ Erro na validação de todos os jogos:', error);
            throw error;
        }
    }
}

module.exports = GameValidationService;
