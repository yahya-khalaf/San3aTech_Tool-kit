// San3a Academy Toolkit - Dashboard JavaScript
// Handles sidebar toggle, navigation, and interactive elements

(function () {
    'use strict';

    // ========================================================================
    // SIDEBAR TOGGLE (MOBILE)
    // ========================================================================
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 968) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // ========================================================================
    // NAVIGATION ACTIVE STATE
    // ========================================================================
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 968) {
                sidebar.classList.remove('active');
            }
        });
    });

    // ========================================================================
    // SEARCH FUNCTIONALITY (PLACEHOLDER)
    // ========================================================================
    const searchButton = document.querySelector('.icon-button');

    if (searchButton) {
        searchButton.addEventListener('click', function () {
            // Future: Implement search functionality
            console.log('Search clicked - implement search modal here');
        });
    }

    // ========================================================================
    // NOTIFICATION BUTTON
    // ========================================================================
    const notificationButton = document.querySelector('.icon-button.notification');

    if (notificationButton) {
        notificationButton.addEventListener('click', function () {
            // Future: Open notifications panel
            console.log('Notifications clicked - implement panel here');
        });
    }

    // ========================================================================
    // QUICK ACTION CARDS
    // ========================================================================
    const actionCards = document.querySelectorAll('.action-card');

    actionCards.forEach(card => {
        card.addEventListener('click', function () {
            const actionLabel = this.querySelector('.action-label').textContent;
            console.log(`Quick action clicked: ${actionLabel}`);

            // Future: Handle different actions
            switch (actionLabel) {
                case 'New Document':
                    console.log('Opening document creator...');
                    break;
                case 'Analytics':
                    console.log('Opening analytics dashboard...');
                    break;
                case 'Settings':
                    console.log('Opening settings...');
                    break;
                case 'Feedback':
                    console.log('Opening feedback form...');
                    break;
            }
        });
    });

    // ========================================================================
    // STATS COUNTER ANIMATION
    // ========================================================================
    const statValues = document.querySelectorAll('.stat-value');
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsAnimated) {
                    statsAnimated = true;

                    statValues.forEach(stat => {
                        const target = parseInt(stat.textContent);
                        if (isNaN(target)) return;

                        let current = 0;
                        const increment = target / 30;
                        const duration = 1000;
                        const stepTime = duration / 30;

                        const counter = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                current = target;
                                clearInterval(counter);
                            }
                            stat.textContent = Math.floor(current);
                        }, stepTime);
                    });
                }
            });
        }, { threshold: 0.5 });

        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            observer.observe(statsGrid);
        }
    }

    animateStats();

    // ========================================================================
    // RIPPLE EFFECT FOR BUTTONS
    // ========================================================================
    function createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.className = 'ripple';

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Add ripple effect to primary buttons
    document.querySelectorAll('.btn-primary, .action-card').forEach(button => {
        button.style.position = 'relative';
        button.style.overflow = 'hidden';

        button.addEventListener('click', function (e) {
            createRipple(e, this);
        });
    });

    // Add ripple CSS
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }

        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ========================================================================
    // KEYBOARD SHORTCUTS
    // ========================================================================
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            console.log('Search shortcut triggered');
            // Future: Open search
        }
    });

    // ========================================================================
    // RESIZE HANDLER
    // ========================================================================
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Close sidebar on desktop view
            if (window.innerWidth > 968) {
                sidebar.classList.remove('active');
            }
        }, 250);
    });

    // ========================================================================
    // CONSOLE MESSAGE
    // ========================================================================
    console.log('%c🛠️ San3a Academy Toolkit', 'font-size: 20px; font-weight: bold; color: #DC2626;');
    console.log('%cInternal Dashboard v1.0', 'font-size: 12px; color: #6B7280;');
    console.log('%cKeyboard Shortcuts:', 'font-size: 12px; font-weight: bold; color: #374151;');
    console.log('%c  • Cmd/Ctrl + K: Search', 'font-size: 11px; color: #6B7280;');

    // ========================================================================
    // LOADING COMPLETE
    // ========================================================================
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        console.log('%c✓ Dashboard loaded successfully', 'color: #10B981; font-weight: bold;');
    });

})();
