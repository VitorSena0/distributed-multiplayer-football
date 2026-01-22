import { Router, Request, Response } from 'express'; // Importa o roteador do Express e os tipos Request e Response
import { AuthService } from '../services/authService'; // Importa o serviço de autenticação

// Cria um roteador Express para gerenciar as rotas de autenticação
const router = Router();

// Rota de registro
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuário e senha são obrigatórios'
            });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Usuário deve ter entre 3 e 50 caracteres'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter no mínimo 6 caracteres'
            });
        }

        const result = await AuthService.register(username, password);
        
        if (result.success) {
            return res.status(201).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Erro na rota de registro:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota de login, recebe de auth.js os dados do formulário
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuário e senha são obrigatórios'
            });
        }

        const result = await AuthService.login(username, password);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(401).json(result);
        }
    } catch (error) {
        console.error('Erro na rota de login:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para verificar token
router.post('/verify', (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const result = AuthService.verifyToken(token);
        
        if (result.valid) {
            return res.status(200).json({
                success: true,
                userId: result.userId,
                username: result.username
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
    } catch (error) {
        console.error('Erro na rota de verificação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar estatísticas de um usuário
router.get('/stats/:userId', async (req: Request, res: Response) => {
    try {
        const userIdParam = req.params.userId;
        const userIdStr = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam; // Verifica se o id do parâmetro do usuário é uma string ou um array de strings
        const userId = Number.parseInt(userIdStr ?? '', 10);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuário inválido'
            });
        }

        const stats = await AuthService.getUserStats(userId);
        
        if (stats) {
            return res.status(200).json({
                success: true,
                stats
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Estatísticas não encontradas'
            });
        }
    } catch (error) {
        console.error('Erro na rota de estatísticas:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar ranking global
router.get('/ranking', async (req: Request, res: Response) => {
    try {
        const limitParam = req.query.limit;
        const limitStr =
            typeof limitParam === 'string'
                ? limitParam
                : Array.isArray(limitParam) && typeof limitParam[0] === 'string'
                    ? limitParam[0]
                    : undefined;

        const parsed = limitStr ? Number.parseInt(limitStr, 10) : NaN;
        const limit = Number.isNaN(parsed) ? 10 : parsed;

        // Chama o serviço de autenticação para obter o ranking global, retorna os dados completos do usuário
        const ranking = await AuthService.getGlobalRanking(limit);

        
        return res.status(200).json({
            success: true,
            ranking
        });
    } catch (error) {
        console.error('Erro na rota de ranking:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

export default router;
