/**
 * menu-mobile.js
 * * Responsável por criar e controlar o comportamento do menu hambúrguer 
 * em dispositivos móveis, alternando a classe 'active' no header.
 */

// Se o script for importado como módulo, ele só roda quando o DOM estiver pronto.
// Caso contrário, use window.addEventListener('DOMContentLoaded', () => { ... });

// 1. Cria e Insere o Botão de Toggle (Hambúrguer) no Header
function setupMenuToggle() {
    const navBar = document.querySelector('.nav-bar');

    if (!navBar) {
        console.error("Elemento .nav-bar não encontrado. O menu móvel não será inicializado.");
        return;
    }

    // Cria o elemento botão
    const toggleButton = document.createElement('button');
    toggleButton.classList.add('menu-toggle');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', 'main-navigation');
    
    // Adiciona as barras de hambúrguer (os spans)
    for (let i = 0; i < 3; i++) {
        toggleButton.appendChild(document.createElement('span'));
    }

    // Insere o botão no nav-bar, antes do elemento <nav>
    // Isso garante que ele fique entre o logo e o menu principal no HTML.
    const navElement = navBar.querySelector('nav');
    if (navElement) {
        navBar.insertBefore(toggleButton, navElement);
    } else {
        // Se não houver nav, insere antes do botão de login
        const loginButton = navBar.querySelector('.btn-header');
        if (loginButton) {
            navBar.insertBefore(toggleButton, loginButton);
        } else {
             navBar.appendChild(toggleButton); // Último recurso
        }
    }
    
    // 2. Captura o Botão (que acabamos de criar) e o NavBar
    const menuToggle = document.querySelector('.menu-toggle');

    // 3. Adiciona o Listener de Clique
    menuToggle.addEventListener('click', () => {
        // Alterna a classe 'active' no elemento nav-bar (ou header, dependendo do seu CSS)
        navBar.classList.toggle('active');

        // Atualiza o atributo ARIA para acessibilidade
        const isExpanded = navBar.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Opcional: Fechar o menu ao clicar em um link (útil em apps de página única)
    const navLinks = navBar.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navBar.classList.contains('active')) {
                navBar.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// Inicia a configuração do menu assim que o script é carregado
setupMenuToggle();
