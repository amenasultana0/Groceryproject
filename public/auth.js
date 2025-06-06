// DOM Elements 
const loginForm = document.getElementById('loginForm');
const togglePasswordBtn = document.querySelector('.toggle-password');

// Event Listeners
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
}

// Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.querySelector('input[type="checkbox"]').checked;

    try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            const user = {
                id: data.user.id,       // Add this
                name: data.user.name,
                email,
                token: data.token
            };

            if (rememberMe) {
                localStorage.setItem("user", JSON.stringify(user));
            } else {
                sessionStorage.setItem("user", JSON.stringify(user));
            }

            // Redirect to dashboard
            window.location.href = "dashboard.html";
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        alert("Something went wrong. Please try again.");
        console.error(err);
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = togglePasswordBtn.querySelector('i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Check if user is already logged in
function checkAuth() {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    // If we're on the login page and user is logged in, redirect to dashboard
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }
    
    // If we're on a protected page and user is not logged in, redirect to login
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
    }
}

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', checkAuth);