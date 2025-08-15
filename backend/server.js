const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Importar conexão Firebird
const firebird = require('../database/firebird_connection');

// Importar rotas de autenticação
const authRoutes = require('./auth/auth_routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..')));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
            'application/vnd.ms-office'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype) ||
            file.originalname.toLowerCase().endsWith('.xlsx') ||
            file.originalname.toLowerCase().endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos Excel são permitidos'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// ========================================
// ROTAS DA API
// ========================================

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Upload de arquivo Excel
app.post('/api/upload-excel', upload.single('excel'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
        }

        console.log('📁 Arquivo recebido:', req.file.originalname);

        // Ler o arquivo Excel
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length < 2) {
            return res.status(400).json({ 
                success: false, 
                error: 'Arquivo Excel vazio ou sem dados válidos' 
            });
        }

        // Extrair cabeçalhos e dados
        const headers = data[0];
        const rows = data.slice(1);

        console.log('📊 Cabeçalhos encontrados:', headers);

        // Verificar cabeçalhos esperados
        const expectedHeaders = [
            'número', 'aberto em', 'responsável', 'cliente: classificação',
            'cliente (completo)', 'cliente (organização)', 'assunto',
            'tempo de vida (horas corridas)', 'status', 'nr mantis'
        ];

        const missingHeaders = expectedHeaders.filter(header => 
            !headers.some(h => h && h.toString().toLowerCase().includes(header.toLowerCase()))
        );

        if (missingHeaders.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Cabeçalhos ausentes: ${missingHeaders.join(', ')}. Cabeçalhos encontrados: ${headers.join(', ')}. Verifique se o arquivo possui as colunas corretas.`
            });
        }

        // Mapear dados
        const tickets = rows.map(row => {
            const ticket = {};
            headers.forEach((header, index) => {
                if (header && row[index] !== undefined) {
                    ticket[header] = row[index];
                }
            });
            return ticket;
        }).filter(ticket => ticket['número'] || ticket.numero); // Filtrar linhas vazias

        console.log(`📈 Processados ${tickets.length} tickets`);

        // Salvar no banco Firebird
        const dataSourceName = req.file.originalname.replace(/\.[^/.]+$/, '');
        
        // Registrar fonte de dados
        await firebird.registerDataSource({
            name: dataSourceName,
            filename: req.file.originalname,
            fileSize: req.file.size,
            recordsCount: tickets.length
        });

        // Inserir tickets no banco
        const insertedCount = await firebird.insertTickets(tickets, dataSourceName);

        // Limpar arquivo temporário
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Arquivo processado com sucesso! ${insertedCount} tickets importados.`,
            dataSource: dataSourceName,
            totalTickets: insertedCount,
            headers: headers,
            sampleData: tickets.slice(0, 3) // Primeiros 3 registros como exemplo
        });

    } catch (error) {
        console.error('❌ Erro no upload:', error);
        
        // Limpar arquivo temporário se existir
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor: ' + error.message
        });
    }
});

// Estatísticas do dashboard
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = await firebird.getDashboardStats();
        
        // Buscar dados adicionais para gráficos
        const statusStats = await firebird.executeQuery(`
            SELECT STATUS, COUNT(*) as COUNT 
            FROM TICKETS 
            WHERE STATUS IS NOT NULL 
            GROUP BY STATUS 
            ORDER BY COUNT DESC
        `);

        const responsavelStats = await firebird.executeQuery(`
            SELECT RESPONSAVEL, COUNT(*) as COUNT 
            FROM TICKETS 
            WHERE RESPONSAVEL IS NOT NULL 
            GROUP BY RESPONSAVEL 
            ORDER BY COUNT DESC 
            ROWS 10
        `);

        const clienteStats = await firebird.executeQuery(`
            SELECT CLIENTE_COMPLETO, COUNT(*) as COUNT 
            FROM TICKETS 
            WHERE CLIENTE_COMPLETO IS NOT NULL 
            GROUP BY CLIENTE_COMPLETO 
            ORDER BY COUNT DESC 
            ROWS 10
        `);

        const tempoVidaStats = await firebird.executeQuery(`
            SELECT 
                CASE 
                    WHEN TEMPO_VIDA_HORAS <= 24 THEN '0-24h'
                    WHEN TEMPO_VIDA_HORAS <= 48 THEN '24-48h'
                    WHEN TEMPO_VIDA_HORAS <= 72 THEN '48-72h'
                    WHEN TEMPO_VIDA_HORAS <= 168 THEN '72h-1sem'
                    ELSE 'Mais de 1 semana'
                END as FAIXA_TEMPO,
                COUNT(*) as COUNT
            FROM TICKETS 
            WHERE TEMPO_VIDA_HORAS IS NOT NULL 
            GROUP BY FAIXA_TEMPO
            ORDER BY COUNT DESC
        `);

        const dataSourceStats = await firebird.executeQuery(`
            SELECT DATA_SOURCE, COUNT(*) as COUNT 
            FROM TICKETS 
            GROUP BY DATA_SOURCE 
            ORDER BY COUNT DESC
        `);

        res.json({
            success: true,
            stats: {
                ...stats,
                statusDistribution: statusStats,
                topResponsaveis: responsavelStats,
                topClientes: clienteStats,
                tempoVidaDistribution: tempoVidaStats,
                dataSourceDistribution: dataSourceStats
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas: ' + error.message
        });
    }
});

// Perfil do usuário
app.get('/api/profile', async (req, res) => {
    try {
        const username = req.query.username || 'admin';
        const profile = await firebird.getUserProfile(username);
        
        if (profile) {
            res.json({
                success: true,
                profile: {
                    username: profile.USERNAME,
                    name: profile.NAME,
                    role: profile.ROLE,
                    avatar: profile.AVATAR,
                    email: profile.EMAIL
                }
            });
        } else {
            res.json({
                success: true,
                profile: {
                    username: 'admin',
                    name: 'Administrador',
                    role: 'Administrador',
                    avatar: null,
                    email: 'admin@movideskcontrol.com'
                }
            });
        }
    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar perfil: ' + error.message
        });
    }
});

app.put('/api/profile', async (req, res) => {
    try {
        const profile = req.body;
        
        if (!profile.username) {
            return res.status(400).json({
                success: false,
                error: 'Username é obrigatório'
            });
        }

        const savedProfile = await firebird.saveUserProfile(profile);
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            profile: savedProfile
        });

    } catch (error) {
        console.error('❌ Erro ao salvar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao salvar perfil: ' + error.message
        });
    }
});

// Listar fontes de dados
app.get('/api/data-sources', async (req, res) => {
    try {
        const dataSources = await firebird.listDataSources();
        
        res.json({
            success: true,
            dataSources: dataSources.map(ds => ({
                id: ds.ID,
                name: ds.NAME,
                filename: ds.FILENAME,
                fileSize: ds.FILE_SIZE,
                uploadDate: ds.UPLOAD_DATE,
                recordsCount: ds.RECORDS_COUNT
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao listar fontes de dados:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar fontes de dados: ' + error.message
        });
    }
});

// Buscar tickets por fonte de dados
app.get('/api/tickets', async (req, res) => {
    try {
        const { dataSource, limit = 100, offset = 0 } = req.query;
        
        let sql = 'SELECT * FROM TICKETS';
        let params = [];
        
        if (dataSource) {
            sql += ' WHERE DATA_SOURCE = ?';
            params.push(dataSource);
        }
        
        sql += ' ORDER BY CREATED_AT DESC';
        sql += ` ROWS ${offset} TO ${parseInt(offset) + parseInt(limit) - 1}`;
        
        const tickets = await firebird.executeQuery(sql, params);
        
        res.json({
            success: true,
            tickets: tickets,
            total: tickets.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar tickets: ' + error.message
        });
    }
});

// Editar Data Source
app.put('/api/data-sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Nome é obrigatório'
            });
        }

        const sql = 'UPDATE DATA_SOURCES SET NAME = ?, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?';
        await firebird.executeTransaction(sql, [name, id]);
        
        res.json({
            success: true,
            message: 'Data Source atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar data source:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar data source: ' + error.message
        });
    }
});

// Excluir Data Source
app.delete('/api/data-sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Primeiro excluir todos os tickets associados
        const deleteTicketsSQL = 'DELETE FROM TICKETS WHERE DATA_SOURCE = (SELECT NAME FROM DATA_SOURCES WHERE ID = ?)';
        await firebird.executeTransaction(deleteTicketsSQL, [id]);
        
        // Depois excluir o data source
        const deleteDataSourceSQL = 'DELETE FROM DATA_SOURCES WHERE ID = ?';
        await firebird.executeTransaction(deleteDataSourceSQL, [id]);
        
        res.json({
            success: true,
            message: 'Data Source excluído com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao excluir data source:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao excluir data source: ' + error.message
        });
    }
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

async function startServer() {
    try {
        // Testar conexão com Firebird
        console.log('🔌 Testando conexão com Firebird 5.0...');
        await firebird.testConnection();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('========================================');
            console.log('   Sistema Movidesk Control');
            console.log('   Backend iniciado com sucesso!');
            console.log('========================================');
            console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}`);
            console.log(`🗄️ Banco: Firebird 5.0`);
            console.log('========================================');
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        console.log('');
        console.log('🔧 Soluções possíveis:');
        console.log('   1. Execute: npm run setup');
        console.log('   2. Verifique se o Firebird 5.0 está rodando');
        console.log('   3. Verifique as configurações no .env');
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Encerrando servidor...');
    await firebird.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Encerrando servidor...');
    await firebird.closePool();
    process.exit(0);
});

// Iniciar servidor
startServer();
