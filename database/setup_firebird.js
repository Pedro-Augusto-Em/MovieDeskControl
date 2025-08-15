#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const firebird = require('./firebird_connection');

// ========================================
// Script de Configuração Firebird 5.0
// ========================================

console.log('========================================');
console.log('   Configuração Firebird 5.0');
console.log('   Sistema: Movidesk Control');
console.log('========================================');
console.log('');

async function setupFirebird() {
    try {
        // 1. Verificar se o diretório database existe
        const databaseDir = path.dirname(firebird.firebirdConfig.database);
        if (!fs.existsSync(databaseDir)) {
            console.log('📁 Criando diretório do banco de dados...');
            fs.mkdirSync(databaseDir, { recursive: true });
            console.log('✅ Diretório criado:', databaseDir);
        }

        // 2. Testar conexão com Firebird
        console.log('🔌 Testando conexão com Firebird 5.0...');
        try {
            await firebird.testConnection();
        } catch (error) {
            console.log('⚠️ Erro na conexão. Tentando criar banco...');
            
            // 3. Criar banco de dados se não existir
            console.log('🗄️ Criando banco de dados...');
            await firebird.createDatabase();
            
            // Aguardar um pouco para o banco ser criado
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Testar conexão novamente
            console.log('🔌 Testando conexão novamente...');
            await firebird.testConnection();
        }

        // 4. Inicializar estrutura do banco
        console.log('🔄 Inicializando estrutura do banco...');
        await firebird.initializeDatabase();

        // 5. Verificar se as tabelas foram criadas
        console.log('📊 Verificando tabelas criadas...');
        const tables = await firebird.executeQuery(`
            SELECT RDB$RELATION_NAME 
            FROM RDB$RELATIONS 
            WHERE RDB$VIEW_BLR IS NULL 
            AND (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0)
            AND RDB$RELATION_NAME NOT LIKE 'RDB$%'
            AND RDB$RELATION_NAME NOT LIKE 'MON$%'
        `);

        console.log('✅ Tabelas encontradas:');
        tables.forEach(table => {
            console.log(`   - ${table.RDB$RELATION_NAME.trim()}`);
        });

        // 6. Verificar dados iniciais
        console.log('👤 Verificando usuário padrão...');
        const users = await firebird.executeQuery('SELECT * FROM USERS');
        if (users.length > 0) {
            console.log('✅ Usuário padrão encontrado:', users[0].NAME);
        }

        console.log('📈 Verificando dashboard padrão...');
        const dashboards = await firebird.executeQuery('SELECT * FROM DASHBOARDS');
        if (dashboards.length > 0) {
            console.log('✅ Dashboard padrão encontrado:', dashboards[0].NAME);
        }

        // 7. Testar procedures
        console.log('⚙️ Testando procedures...');
        try {
            const stats = await firebird.getDashboardStats();
            console.log('✅ Procedure GET_DASHBOARD_STATS funcionando');
            console.log('   - Total de tickets:', stats.TOTAL_TICKETS);
        } catch (error) {
            console.log('⚠️ Erro ao testar procedure:', error.message);
        }

        console.log('');
        console.log('🎉 Configuração concluída com sucesso!');
        console.log('');
        console.log('📋 Próximos passos:');
        console.log('   1. Configure as variáveis de ambiente no .env');
        console.log('   2. Execute o backend com: npm start');
        console.log('   3. Acesse o sistema em: http://localhost:3000');
        console.log('');

    } catch (error) {
        console.error('❌ Erro durante a configuração:', error);
        console.log('');
        console.log('🔧 Soluções possíveis:');
        console.log('   1. Verifique se o Firebird 5.0 está instalado');
        console.log('   2. Verifique se o serviço Firebird está rodando');
        console.log('   3. Verifique as credenciais no arquivo .env');
        console.log('   4. Execute como administrador se necessário');
        process.exit(1);
    } finally {
        // Fechar pool de conexões
        await firebird.closePool();
    }
}

// ========================================
// Função para criar arquivo .env
// ========================================

function createEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
        const envContent = `# ========================================
# Configuração Firebird 5.0 - Movidesk Control
# ========================================

# Configurações do Firebird
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:/MovideskControl/database/movidesk_control.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações de Segurança
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Configurações de Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`;

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Arquivo .env criado');
    } else {
        console.log('ℹ️ Arquivo .env já existe');
    }
}

// ========================================
// Função para verificar dependências
// ========================================

function checkDependencies() {
    console.log('📦 Verificando dependências...');
    
    const packagePath = path.join(__dirname, '..', 'backend', 'package.json');
    if (!fs.existsSync(packagePath)) {
        console.error('❌ package.json não encontrado em backend/');
        return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = ['node-firebird', 'express', 'multer', 'xlsx'];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length > 0) {
        console.log('⚠️ Dependências faltando:', missingDeps.join(', '));
        console.log('💡 Execute: cd backend && npm install');
        return false;
    }

    console.log('✅ Todas as dependências estão instaladas');
    return true;
}

// ========================================
// Função principal
// ========================================

async function main() {
    console.log('🔍 Verificando ambiente...');
    
    // Verificar dependências
    if (!checkDependencies()) {
        process.exit(1);
    }

    // Criar arquivo .env
    createEnvFile();
    
    console.log('');
    
    // Executar configuração
    await setupFirebird();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { setupFirebird, createEnvFile, checkDependencies };
