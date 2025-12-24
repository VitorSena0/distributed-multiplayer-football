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

function redirectToGame() {
    window.location.href = '/index.html';
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
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
