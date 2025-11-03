/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/proDashboard.js                                     ║
║  Purpose: Practitioner Dashboard - Tab System & Interactions       ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

console.log('[Rooted Vitality] proDashboard.js loading...');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Rooted Vitality] Initializing practitioner dashboard...');
    
    // Set active view to practitioner for this dashboard
    localStorage.setItem('active_view', 'practitioner');
    console.log('[Rooted Vitality] Active view set to: practitioner');
    
    // Re-render header with practitioner view if RootedVitality is available
    if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.renderHeader === 'function') {
        const user = window.authManager?.getCurrentUser();
        if (user && user.role === 'practitioner') {
            console.log('[Rooted Vitality] Re-rendering header for practitioner view');
            await RootedVitality.renderHeader('practitioner', 'practitioner');
        }
    }
    
    // Ensure logo is loaded (fallback if renderHeader didn't load it)
    if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.loadPractitionerLogo === 'function') {
        console.log('[Rooted Vitality] Ensuring practitioner logo is loaded');
        setTimeout(() => RootedVitality.loadPractitionerLogo(), 500);
    }

    // Tab switching functionality - header nav links
    const navLinks = document.querySelectorAll('[data-tab]');
    const panels = document.querySelectorAll('.tab-panel');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.tab;
            console.log(`[Rooted Vitality] Switching to tab: ${target}`);

            // Remove active class from all nav links
            document.querySelectorAll('.rv-nav-link').forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Hide all panels
            panels.forEach(p => p.classList.remove('active'));

            // Show target panel
            const targetPanel = document.getElementById(`tab-${target}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                console.log(`[Rooted Vitality] Displayed panel: tab-${target}`);
            }
        });
    });

    // Clients Panel - Sub-tabs switching
    const clientsTabs = document.querySelectorAll('.clients-tab');
    const clientsLists = document.querySelectorAll('.clients-list');

    clientsTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.dataset.clientsTab;
            console.log(`[Rooted Vitality] Switching clients view to: ${target}`);

            // Remove active from all tabs
            clientsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Hide all lists
            clientsLists.forEach(list => list.classList.remove('active'));

            // Show target list
            const targetList = document.getElementById(target);
            if (targetList) {
                targetList.classList.add('active');
                console.log(`[Rooted Vitality] Displayed clients list: ${target}`);
            }
        });
    });

    // Message expand/collapse toggle
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('read-more-toggle')) {
            e.preventDefault();
            const msgId = e.target.dataset.msg;
            const msgBox = document.getElementById(msgId);
            
            if (msgBox) {
                msgBox.classList.toggle('expanded');
                e.target.textContent = msgBox.classList.contains('expanded') ? 'Read less' : 'Read more';
                console.log(`[Rooted Vitality] Message ${msgId} toggled`);
            }
        }
    });

    // Lead acceptance handler (updated for cards)
    document.addEventListener('click', e => {
        if (e.target.dataset.action === 'accept') {
            const card = e.target.closest('.client-card');
            const clientName = card.querySelector('.client-name').textContent;

            console.log(`[Rooted Vitality] Lead accepted: ${clientName}`);

            // Remove the card with animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => {
                card.remove();
                alert(`Lead accepted: ${clientName}! (This will move to Inbox in the full version.)`);
                console.log(`[Rooted Vitality] Card removed for ${clientName}`);
            }, 300);
        }
    });

    console.log('[Rooted Vitality] Practitioner dashboard initialized');
});

console.log('[Rooted Vitality] proDashboard.js loaded');
