// Elementos do DOM
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const guestBtn = document.getElementById('guest-btn');
const messageDiv = document.getElementById('message');

// Alternar entre formulários
showRegisterLink?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
    hideMessage();
});

showLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm?.classList.add('hidden');
    loginForm?.classList.remove('hidden');
    hideMessage();
});

// Funções auxiliares
function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
}

function hideMessage() {
    if (messageDiv) {
        messageDiv.className = 'message hidden';
    }
}

function saveUserData(userId, username, token) {
    sessionStorage.setItem('userId', userId.toString());
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('isGuest', 'false');
}

// Redireciona para a página do jogo
function redirectToGame() { 
    window.location.href = '/index.html';
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    // Realiza a requisição de login, verifica a resposta e salva os dados do usuário na sessão
    try {
        const response = await fetch('/api/auth/login', { // O fetch envia uma requisição POST para o endpoint de login da API
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Define o cabeçalho da requisição para indicar que o corpo é JSON
            },
            body: JSON.stringify({ username, password }), // Converte os dados do formulário em uma string JSON para enviar no corpo da requisição
        });

        const data = await response.json(); // Aguarda a resposta da API e converte para JSON

        if (data.success) { // Se o login for bem-sucedido, salva os dados do usuário na sessão e redireciona para o jogo
            saveUserData(data.userId, data.username, data.token);
            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(redirectToGame, 1500);
        } else {
            showMessage(data.message || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
    }
});

// Registro
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (password !== passwordConfirm) {
        showMessage('As senhas não coincidem', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
            saveUserData(data.userId, data.username, data.token);
            showMessage('Conta criada com sucesso! Redirecionando...', 'success');
            setTimeout(redirectToGame, 1500);
        } else {
            showMessage(data.message || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
    }
});

// Jogar como convidado
guestBtn?.addEventListener('click', () => {
    sessionStorage.setItem('isGuest', 'true');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('token');
    redirectToGame();
});

// Verificar se já está logado
window.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('token');
    const isGuest = sessionStorage.getItem('isGuest') === 'true';

    if (isGuest) {
        // Já está como convidado, pode jogar
        return;
    }

    if (token) {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (data.success) {
                // Token válido, redireciona para o jogo
                redirectToGame();
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
        }
    }
});
