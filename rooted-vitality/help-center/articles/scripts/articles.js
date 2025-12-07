/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: help-center/articles/scripts/articles.js                   ║
║  Purpose: Universal scripts for all article pages                 ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. Smooth Scroll Navigation
  2. Analytics Tracking
  3. CTA Button Tracking
  4. Responsive Table Wrapper
  5. Heading Navigation (Table of Contents)
  6. Print Optimization
  7. Section Tracking
*/

// ========================================== 
// 1. SMOOTH SCROLL NAVIGATION
// ========================================== 
/**
 * Enable smooth scrolling to article sections via hash links
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
 * Track article views and engagement
 * Sends events to analytics system
 */
(function() {
    const articleTitle = document.querySelector('h1')?.textContent || 'Unknown Article';
    const articleType = document.body.dataset.articleType || 'unknown';
    
    // Track page view
    if (window.gtag) {
        gtag('event', 'article_view', {
            article_title: articleTitle,
            article_type: articleType,
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
            gtag('event', 'article_engagement', {
                article_title: articleTitle,
                time_on_page: timeOnPage,
                article_type: articleType
            });
        }
    });
})();

// ========================================== 
// 3. CTA BUTTON TRACKING
// ========================================== 
/**
 * Track CTA clicks for conversion analysis
 */
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function() {
        const ctaText = this.textContent.trim();
        const articleTitle = document.querySelector('h1')?.textContent || 'Unknown';
        
        if (window.gtag) {
            gtag('event', 'article_cta_click', {
                cta_text: ctaText,
                article_title: articleTitle,
                cta_url: this.href || 'javascript:void(0)'
            });
        }
    });
});

// ========================================== 
// 4. RESPONSIVE TABLE WRAPPER
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
// 5. HEADING NAVIGATION (TABLE OF CONTENTS)
// ========================================== 
/**
 * Auto-generate table of contents from h2/h3 headings
 * Usage: Add <div id="toc"></div> to article to enable
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
// 6. PRINT OPTIMIZATION
// ========================================== 
/**
 * Optimize article for printing
 * Hides unnecessary elements, shows full URLs
 */
(function() {
    const printStyle = document.createElement('style');
    printStyle.textContent = `
        @media print {
            .no-print { display: none !important; }
            a { text-decoration: underline; }
            a::after { content: " (" attr(href) ")"; }
            .hero { page-break-after: avoid; }
            h2 { page-break-before: avoid; page-break-after: avoid; }
            img { max-width: 100%; }
        }
    `;
    document.head.appendChild(printStyle);
})();

// ========================================== 
// 7. SECTION TRACKING
// ========================================== 
/**
 * Track which article sections user scrolls to
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
                    gtag('event', 'article_section_view', {
                        section_name: sectionName
                    });
                }
            }
        });
    }, { threshold: 0.3 });
    
    sections.forEach(section => observer.observe(section));
})();
