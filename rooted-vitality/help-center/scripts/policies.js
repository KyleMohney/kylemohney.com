/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: help-center/scripts/policies.js                            ║
║  Purpose: Universal scripts for all policy pages                  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. Smooth Scroll Navigation
  2. Analytics Tracking
  3. Responsive Table Wrapper
  4. Heading Navigation (Table of Contents)
  5. Print Optimization
  6. Section Tracking
*/

// ========================================== 
// 1. SMOOTH SCROLL NAVIGATION
// ========================================== 
/**
 * Enable smooth scrolling to policy sections via hash links
 * Usage: <a href="#section-id">Jump to Section</a>
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Only prevent default if target exists
        if (document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ========================================== 
// 2. ANALYTICS TRACKING
// ========================================== 
/**
 * Track policy views and engagement
 * Sends events to analytics system
 */
(function() {
    const policyTitle = document.querySelector('h1')?.textContent || 'Unknown Policy';
    const policyType = document.body.dataset.articleType || 'unknown';
    
    // Track page view
    if (window.gtag) {
        gtag('event', 'policy_view', {
            policy_title: policyTitle,
            policy_type: policyType,
            timestamp: new Date().toISOString()
        });
    }
    
    // Track time on page
    let timeOnPage = 0;
    const timeInterval = setInterval(() => {
        timeOnPage += 1;
    }, 1000);
    
    window.addEventListener('beforeunload', () => {
        clearInterval(timeInterval);
        if (window.gtag && timeOnPage > 5) {
            gtag('event', 'policy_engagement', {
                policy_title: policyTitle,
                time_on_page: timeOnPage,
                policy_type: policyType
            });
        }
    });
})();

// ========================================== 
// 3. RESPONSIVE TABLE WRAPPER
// ========================================== 
/**
 * Add horizontal scroll wrapper to tables for mobile
 */
document.querySelectorAll('table').forEach(table => {
    if (!table.parentElement.classList.contains('table-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    }
});

// ========================================== 
// 4. HEADING NAVIGATION (TABLE OF CONTENTS)
// ========================================== 
/**
 * Auto-generate table of contents from h2/h3 headings
 * Usage: Add <div id="toc"></div> to policy to enable
 */
(function() {
    const tocContainer = document.getElementById('toc');
    if (!tocContainer) return;
    
    const headings = document.querySelectorAll('main h2, main h3');
    if (headings.length === 0) return;
    
    const ul = document.createElement('ul');
    ul.className = 'toc-list';
    
    headings.forEach((heading, index) => {
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        const li = document.createElement('li');
        const indent = heading.tagName === 'H3' ? 'toc-item--h3' : 'toc-item--h2';
        li.className = `toc-item ${indent}`;
        
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        
        li.appendChild(link);
        ul.appendChild(li);
    });
    
    tocContainer.appendChild(ul);
})();

// ========================================== 
// 5. PRINT OPTIMIZATION
// ========================================== 
/**
 * Optimize policy for printing
 * Hides unnecessary elements, shows full URLs
 */
(function() {
    const printStyle = document.createElement('style');
    printStyle.textContent = `
        @media print {
            .no-print { display: none !important; }
            a { text-decoration: underline; }
            a::after { content: " (" attr(href) ")"; }
            h2 { page-break-before: avoid; page-break-after: avoid; }
            img { max-width: 100%; }
        }
    `;
    document.head.appendChild(printStyle);
})();

// ========================================== 
// 6. SECTION TRACKING
// ========================================== 
/**
 * Track which policy sections user scrolls to
 * Useful for understanding engagement patterns
 */
(function() {
    const sections = document.querySelectorAll('.article-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const heading = entry.target.querySelector('h2');
                const sectionName = heading?.textContent || 'Unknown Section';
                
                if (window.gtag) {
                    gtag('event', 'policy_section_view', {
                        section_name: sectionName
                    });
                }
            }
        });
    }, { threshold: 0.3 });
    
    sections.forEach(section => observer.observe(section));
})();
