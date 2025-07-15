 function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_id');
    window.location.href = 'login.html';
}

function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    
    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        
        // Previeni lo scroll del body quando il menu è aperto
        if (mobileNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
    
    function closeMenu() {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    hamburger.addEventListener('click', toggleMenu);
    
    // Chiudi il menu quando si clicca sull'overlay
    mobileNavOverlay.addEventListener('click', closeMenu);
    
    // Chiudi il menu quando si clicca su un link
    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // Chiudi il menu con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Gestione dell'autenticazione nell'header
function updateAuthUI() {
    const token = localStorage.getItem('authToken');
    const loginLink = document.getElementById('login');
    const loginMobileLink = document.getElementById('login-mobile');
    const protectedRoutes = document.querySelectorAll('.protected-route');
    
    if (token) {
        // Utente autenticato - Desktop
        loginLink.textContent = 'Logout';
        loginLink.href = '#';
        loginLink.addEventListener('click', handleLogout);
        
        // Utente autenticato - Mobile
        loginMobileLink.textContent = '👤 Logout';
        loginMobileLink.href = '#';
        loginMobileLink.addEventListener('click', handleLogout);
        
        // Mostra le rotte protette
        protectedRoutes.forEach(route => {
            route.style.display = 'block';
        });
    } else {
        // Utente non autenticato - Desktop
        loginLink.textContent = 'Login';
        loginLink.href = 'login.html';
        
        // Utente non autenticato - Mobile
        loginMobileLink.textContent = '👤 Login';
        loginMobileLink.href = 'login.html';
        
        // Nascondi le rotte protette
        protectedRoutes.forEach(route => {
            route.style.display = 'none';
        });
    }
}
// per caricare header e footer in modo dinamico
export function getHeaderAndFooter() {
Promise.all([
    fetch("../header.html").then(res => res.text()),
    fetch("../footer.html").then(res => res.text())
  ])
    .then(([headerData, footerData]) => {
        document.getElementById("header").innerHTML = headerData;
        document.getElementById("footer").innerHTML = footerData;

        // const login = document.getElementById("login");
        // const dashboard = document.getElementById("dashboard");
        // const reports = document.getElementById("reports");

        initHamburgerMenu();    
        
        updateAuthUI();
        
    })
    .catch(error => console.error("Errore durante il fetch:", error));
}