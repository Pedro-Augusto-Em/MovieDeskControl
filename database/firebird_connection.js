const Firebird = require('node-firebird');

// ========================================
// Configuração de Conexão Firebird 5.0
// ========================================

const firebirdConfig = {
    host: process.env.FIREBIRD_HOST || 'localhost',
    port: process.env.FIREBIRD_PORT || 3050,
    database: process.env.FIREBIRD_DATABASE || 'C:/AnydeskControl/database/anydesk_control.fdb',
    user: process.env.FIREBIRD_USER || 'SYSDBA',
    password: process.env.FIREBIRD_PASSWORD || 'masterkey',
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
    blobAsText: false,
    encoding: 'UTF-8',
    retryConnectionInterval: 1000,
    blobAsText: false,
    timezone: 'America/Sao_Paulo'
};

// ========================================
// Pool de Conexões
// ========================================

const pool = Firebird.pool(5, firebirdConfig);

// ========================================
// Funções de Conexão
// ========================================

/**
 * Executa uma query com pool de conexões
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<Array>} - Resultado da query
 */
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.get((err, db) => {
            if (err) {
                console.error('Erro ao obter conexão do pool:', err);
                reject(err);
                return;
            }

            db.query(sql, params, (err, result) => {
                db.detach();
                
                if (err) {
                    console.error('Erro na execução da query:', err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    });
}

/**
 * Executa uma query de inserção/atualização/exclusão
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<Object>} - Resultado da operação
 */
function executeTransaction(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.get((err, db) => {
            if (err) {
                console.error('Erro ao obter conexão do pool:', err);
                reject(err);
                return;
            }

            db.transaction(Firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
                if (err) {
                    db.detach();
                    reject(err);
                    return;
                }

                transaction.query(sql, params, (err, result) => {
                    if (err) {
                        transaction.rollback();
                        db.detach();
                        reject(err);
                        return;
                    }

                    transaction.commit((err) => {
                        db.detach();
                        
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(result);
                    });
                });
            });
        });
    });
}

/**
 * Executa múltiplas queries em uma transação
 * @param {Array} queries - Array de objetos {sql, params}
 * @returns {Promise<Array>} - Resultados das queries
 */
function executeMultipleQueries(queries) {
    return new Promise((resolve, reject) => {
        pool.get((err, db) => {
            if (err) {
                console.error('Erro ao obter conexão do pool:', err);
                reject(err);
                return;
            }

            db.transaction(Firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
                if (err) {
                    db.detach();
                    reject(err);
                    return;
                }

                const results = [];
                let currentIndex = 0;

                function executeNext() {
                    if (currentIndex >= queries.length) {
                        transaction.commit((err) => {
                            db.detach();
                            
                            if (err) {
                                reject(err);
                                return;
                            }

                            resolve(results);
                        });
                        return;
                    }

                    const query = queries[currentIndex];
                    
                    transaction.query(query.sql, query.params || [], (err, result) => {
                        if (err) {
                            transaction.rollback();
                            db.detach();
                            reject(err);
                            return;
                        }

                        results.push(result);
                        currentIndex++;
                        executeNext();
                    });
                }

                executeNext();
            });
        });
    });
}

/**
 * Testa a conexão com o banco
 * @returns {Promise<boolean>} - True se conectou com sucesso
 */
function testConnection() {
    return new Promise((resolve, reject) => {
        pool.get((err, db) => {
            if (err) {
                console.error('Erro ao testar conexão:', err);
                reject(err);
                return;
            }

            db.query('SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE', (err, result) => {
                db.detach();
                
                if (err) {
                    console.error('Erro no teste de conexão:', err);
                    reject(err);
                    return;
                }

                console.log('✅ Conexão com Firebird 5.0 estabelecida com sucesso!');
                console.log('📅 Data/Hora do servidor:', result[0].CURRENT_TIMESTAMP);
                resolve(true);
            });
        });
    });
}

/**
 * Cria o banco de dados se não existir
 * @returns {Promise<boolean>} - True se criado com sucesso
 */
function createDatabase() {
    return new Promise((resolve, reject) => {
        const createConfig = {
            host: firebirdConfig.host,
            port: firebirdConfig.port,
            user: firebirdConfig.user,
            password: firebirdConfig.password,
            lowercase_keys: false,
            role: null,
            pageSize: 4096,
            blobAsText: false,
            encoding: 'UTF-8'
        };

        Firebird.attachOrCreate(createConfig, firebirdConfig.database, (err, db) => {
            if (err) {
                console.error('Erro ao criar banco de dados:', err);
                reject(err);
                return;
            }

            console.log('✅ Banco de dados criado com sucesso!');
            db.detach();
            resolve(true);
        });
    });
}

/**
 * Executa o script de criação das tabelas
 * @returns {Promise<boolean>} - True se executado com sucesso
 */
async function initializeDatabase() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const schemaPath = path.join(__dirname, 'firebird_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Dividir o script em comandos individuais
        const commands = schema
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log('🔄 Inicializando banco de dados...');
        
        for (const command of commands) {
            if (command.trim()) {
                try {
                    await executeTransaction(command);
                    console.log('✅ Comando executado:', command.substring(0, 50) + '...');
                } catch (error) {
                    console.warn('⚠️ Erro ao executar comando (pode ser normal):', error.message);
                }
            }
        }
        
        console.log('✅ Banco de dados inicializado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        throw error;
    }
}

/**
 * Fecha o pool de conexões
 */
function closePool() {
    return new Promise((resolve) => {
        pool.destroy();
        console.log('🔒 Pool de conexões fechado');
        resolve();
    });
}

// ========================================
// Funções Específicas do Sistema
// ========================================

/**
 * Insere tickets no banco
 * @param {Array} tickets - Array de tickets
 * @param {string} dataSource - Nome da fonte de dados
 * @returns {Promise<number>} - Número de tickets inseridos
 */
async function insertTickets(tickets, dataSource) {
    const insertSQL = `
        INSERT INTO TICKETS (
            NUMERO_TICKET, ABERTO_EM, RESPONSAVEL, CLIENTE_CLASSIFICACAO,
            CLIENTE_COMPLETO, CLIENTE_ORGANIZACAO, ASSUNTO, TEMPO_VIDA_HORAS,
            STATUS, NR_MANTIS, DATA_SOURCE
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const queries = tickets.map(ticket => ({
        sql: insertSQL,
        params: [
            ticket.numero || ticket['número'],
            ticket.abertoEm || ticket['aberto em'],
            ticket.responsavel || ticket['responsável'],
            ticket.clienteClassificacao || ticket['cliente: classificação'],
            ticket.clienteCompleto || ticket['cliente (completo)'],
            ticket.clienteOrganizacao || ticket['cliente (organização)'],
            ticket.assunto,
            ticket.tempoVida || ticket['tempo de vida (horas corridas)'],
            ticket.status,
            ticket.nrMantis || ticket['nr mantis'],
            dataSource
        ]
    }));

    const results = await executeMultipleQueries(queries);
    return results.length;
}

/**
 * Busca estatísticas do dashboard
 * @returns {Promise<Object>} - Estatísticas
 */
async function getDashboardStats() {
    try {
        const result = await executeQuery('EXECUTE PROCEDURE GET_DASHBOARD_STATS');
        return result[0] || {
            TOTAL_TICKETS: 0,
            TICKETS_ABERTOS: 0,
            TICKETS_FECHADOS: 0,
            MEDIA_TEMPO_VIDA: 0,
            TOP_RESPONSAVEL: null,
            TOP_CLIENTE: null
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
            TOTAL_TICKETS: 0,
            TICKETS_ABERTOS: 0,
            TICKETS_FECHADOS: 0,
            MEDIA_TEMPO_VIDA: 0,
            TOP_RESPONSAVEL: null,
            TOP_CLIENTE: null
        };
    }
}

/**
 * Salva ou atualiza perfil do usuário
 * @param {Object} profile - Dados do perfil
 * @returns {Promise<Object>} - Perfil salvo
 */
async function saveUserProfile(profile) {
    const checkSQL = 'SELECT ID FROM USERS WHERE USERNAME = ?';
    const existingUser = await executeQuery(checkSQL, [profile.username]);

    if (existingUser.length > 0) {
        // Atualizar usuário existente
        const updateSQL = `
            UPDATE USERS 
            SET NAME = ?, ROLE = ?, AVATAR = ?, EMAIL = ?, UPDATED_AT = CURRENT_TIMESTAMP
            WHERE USERNAME = ?
        `;
        await executeTransaction(updateSQL, [
            profile.name,
            profile.role,
            profile.avatar,
            profile.email,
            profile.username
        ]);
    } else {
        // Inserir novo usuário
        const insertSQL = `
            INSERT INTO USERS (USERNAME, NAME, ROLE, AVATAR, EMAIL)
            VALUES (?, ?, ?, ?, ?)
        `;
        await executeTransaction(insertSQL, [
            profile.username,
            profile.name,
            profile.role,
            profile.avatar,
            profile.email
        ]);
    }

    return profile;
}

/**
 * Busca perfil do usuário
 * @param {string} username - Nome do usuário
 * @returns {Promise<Object>} - Perfil do usuário
 */
async function getUserProfile(username) {
    const sql = 'SELECT * FROM USERS WHERE USERNAME = ?';
    const result = await executeQuery(sql, [username]);
    return result[0] || null;
}

/**
 * Registra fonte de dados
 * @param {Object} dataSource - Dados da fonte
 * @returns {Promise<Object>} - Fonte registrada
 */
async function registerDataSource(dataSource) {
    const sql = `
        INSERT INTO DATA_SOURCES (NAME, FILENAME, FILE_SIZE, RECORDS_COUNT, USER_ID)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    await executeTransaction(sql, [
        dataSource.name,
        dataSource.filename,
        dataSource.fileSize,
        dataSource.recordsCount,
        dataSource.userId || 1
    ]);

    return dataSource;
}

/**
 * Lista todas as fontes de dados
 * @returns {Promise<Array>} - Lista de fontes de dados
 */
async function listDataSources() {
    const sql = 'SELECT * FROM DATA_SOURCES ORDER BY UPLOAD_DATE DESC';
    return await executeQuery(sql);
}

// ========================================
// Exportação das Funções
// ========================================

module.exports = {
    // Configuração
    firebirdConfig,
    
    // Conexão
    executeQuery,
    executeTransaction,
    executeMultipleQueries,
    testConnection,
    createDatabase,
    initializeDatabase,
    closePool,
    
    // Funções específicas
    insertTickets,
    getDashboardStats,
    saveUserProfile,
    getUserProfile,
    registerDataSource,
    listDataSources
};
