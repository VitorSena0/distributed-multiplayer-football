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
        const userId = parseInt(req.params.userId);

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
        const limit = parseInt(req.query.limit as string) || 10;
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
