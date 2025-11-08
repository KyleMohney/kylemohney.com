/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Global Report Concern System                                      ║
║  Purpose: Universal concern reporting for all pages                ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

/**
 * Initialize Report Concern System
 * Call this after page load or when injecting the widget
 */
function initializeReportConcernSystem() {
    const reportBtn = document.getElementById('report-concern-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', openReportConcernModal);
    }
    
    // Set auto-detected browser/device info
    setDeviceInfo();
    
    // Auto-fill email if user is logged in
    fillUserEmail();
    
    // Auto-detect current page section
    fillCurrentSection();
    
    console.log('[Report Concern] System initialized');
}

/**
 * Get Next Ticket Number
 */
function getNextTicketNumber() {
    let counter = parseInt(localStorage.getItem('concern_ticket_counter') || '1');
    localStorage.setItem('concern_ticket_counter', (counter + 1).toString());
    return counter;
}

/**
 * Open Report Modal
 */
function openReportConcernModal() {
    const modal = document.getElementById('report-concern-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('report-category')?.focus();
        }, 100);
    }
}

/**
 * Close Report Modal
 */
function closeReportConcernModal() {
    const modal = document.getElementById('report-concern-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('report-concern-form');
        if (form) {
            form.reset();
            fillUserEmail();
            fillCurrentSection();
            setDeviceInfo();
        }
    }
}

/**
 * Auto-detect and fill device/browser information
 */
function setDeviceInfo() {
    const deviceInput = document.getElementById('report-device');
    if (deviceInput) {
        const browserInfo = `${getBrowserName()} on ${getOSName()}`;
        deviceInput.value = browserInfo;
    }
}

/**
 * Get Browser Name
 */
function getBrowserName() {
    const ua = navigator.userAgent;
    
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Edge") > -1) return "Edge";
    if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) return "Opera";
    if (ua.indexOf("Trident") > -1) return "Internet Explorer";
    
    return "Unknown Browser";
}

/**
 * Get Operating System Name
 */
function getOSName() {
    const ua = navigator.userAgent;
    
    if (ua.indexOf("Win") > -1) return "Windows";
    if (ua.indexOf("Mac") > -1) return "macOS";
    if (ua.indexOf("Linux") > -1) return "Linux";
    if (ua.indexOf("X11") > -1) return "UNIX";
    if (ua.indexOf("Android") > -1) return "Android";
    if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) return "iOS";
    
    return "Unknown OS";
}

/**
 * Auto-fill user email if logged in
 */
async function fillUserEmail() {
    const emailInput = document.getElementById('report-email');
    if (!emailInput) return;
    
    try {
        // Check if user is logged in (Supabase)
        if (window.supabaseClient) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user && user.email) {
                emailInput.value = user.email;
            }
        }
        
        // Check if email exists in currentUser global
        if (window.currentUser && window.currentUser.email) {
            emailInput.value = window.currentUser.email;
        }
    } catch (error) {
        console.warn('[Report Concern] Could not auto-fill email:', error);
    }
}

/**
 * Auto-detect current page section
 */
function fillCurrentSection() {
    const sectionInput = document.getElementById('report-section');
    if (!sectionInput) return;
    
    // Get page title or URL
    const pageTitle = document.title || window.location.pathname;
    const pageSection = getPageSection();
    
    sectionInput.value = pageSection;
}

/**
 * Detect current page section from URL or DOM
 */
function getPageSection() {
    const path = window.location.pathname;
    const title = document.title;
    
    // Dashboard pages
    if (path.includes('/dashboard/')) {
        if (path.includes('/client/')) return "Client Dashboard";
        if (path.includes('/pro/')) return "Practitioner Dashboard";
        return "Dashboard";
    }
    
    // Pages
    if (path.includes('/articles/')) return "Articles";
    if (path.includes('/projects/')) return "Projects";
    if (path.includes('/about')) return "About Page";
    if (path.includes('/contact')) return "Contact Page";
    if (path.includes('/resume')) return "Resume Page";
    
    // Use document title if available
    if (title && title !== 'Rooted Vitality') {
        return title.substring(0, 50);
    }
    
    return "Rooted Vitality";
}

/**
 * Submit Report Concern
 */
async function submitReportConcern(event) {
    event.preventDefault();
    
    const form = document.getElementById('report-concern-form');
    if (!form.checkValidity()) {
        alert('Please fill in all required fields');
        return;
    }
    
    const category = document.getElementById('report-category').value;
    const title = document.getElementById('report-title').value;
    const section = document.getElementById('report-section').value;
    const description = document.getElementById('report-description').value;
    const priority = document.getElementById('report-priority').value;
    const email = document.getElementById('report-email').value;
    const device = document.getElementById('report-device').value;
    
    // Get ticket number
    const ticketNumber = getNextTicketNumber();
    const ticketId = `CONCERN-${String(ticketNumber).padStart(6, '0')}`;
    
    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Get user ID if available
        let userId = 'anonymous';
        try {
            if (window.supabaseClient) {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) userId = user.id;
            } else if (window.currentUser && window.currentUser.id) {
                userId = window.currentUser.id;
            }
        } catch (e) {
            console.warn('[Report Concern] Could not get user ID:', e);
        }
        
        // Prepare report data
        const reportData = {
            ticketId: ticketId,
            category: category,
            title: title,
            description: description,
            email: email,
            section: section,
            priority: priority,
            device: device,
            userEmail: email,
            timestamp: new Date().toISOString(),
            userId: userId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
        
        // Send to Supabase edge function
        const response = await fetch('/api/send-error-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to send report');
        }
        
        const result = await response.json();
        
        // Show success message
        alert(
            `✓ Thank you for reporting this concern!\n\n` +
            `Ticket ID: ${ticketId}\n\n` +
            `We appreciate your feedback and will investigate this right away.`
        );
        
        console.log('[Report Concern] Report submitted successfully:', ticketId);
        
        // Close modal and reset form
        closeReportConcernModal();
        
    } catch (error) {
        console.error('[Report Concern] Error submitting report:', error);
        alert('Failed to submit report. Please try again or contact support directly.');
        
        // Reset button
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Close modal when clicking outside of it
 */
document.addEventListener('click', function(event) {
    const modal = document.getElementById('report-concern-modal');
    if (modal && event.target === modal) {
        closeReportConcernModal();
    }
});

/**
 * Close modal on Escape key
 */
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('report-concern-modal');
        if (modal && modal.style.display === 'flex') {
            closeReportConcernModal();
        }
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReportConcernSystem);
} else {
    initializeReportConcernSystem();
}
