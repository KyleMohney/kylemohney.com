/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: chatbot.js                                                  ║
║  Purpose: AI-Style Help Center Chatbot with Comprehensive Q&A      ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FEATURES:
  - Comprehensive knowledge base covering all help articles
  - Smart keyword matching for user questions
  - Direct links to relevant articles
  - Fallback to support contact
  - Patient vs Practitioner context awareness
  - Mobile-responsive chat interface
*/

(function() {
    'use strict';

    // ========== KNOWLEDGE BASE ==========
    const knowledgeBase = [
        // About Rooted Vitality
        {
            keywords: ['what is rooted vitality', 'about platform', 'what does rooted vitality do', 'mission', 'purpose'],
            answer: "Rooted Vitality is a modern connection platform that bridges holistic practitioners and patients. We help patients find trusted wellness professionals and help practitioners reach clients who value their work.",
            articleLink: './articles/what-is-rooted-vitality.html',
            articleTitle: 'What is Rooted Vitality?'
        },
        
        // Holistic Medicine
        {
            keywords: ['holistic medicine', 'alternative medicine', 'holistic health', 'what is holistic', 'holistic approach', 'mind body spirit', 'natural medicine', 'integrative medicine', 'holistic care', 'whole person'],
            answer: "Holistic medicine treats the whole person—body, mind, spirit, and environment—rather than just symptoms. It emphasizes prevention, natural healing, and the interconnection between all aspects of health.",
            articleLink: './articles/holistic-medicine-explained.html',
            articleTitle: 'What Makes Holistic Medicine Different'
        },
        
        // Finding Practitioners
        {
            keywords: ['find practitioner', 'choose practitioner', 'right practitioner', 'selecting practitioner', 'how to find', 'search for', 'looking for practitioner', 'where can i find', 'find a doctor', 'find healer', 'find therapist', 'search practitioner'],
            answer: "Finding the right practitioner involves clarifying your wellness needs, researching qualifications, reading reviews, and trusting your instincts. Look for someone whose approach, values, and expertise align with your goals.",
            articleLink: './articles/finding-right-practitioner.html',
            articleTitle: 'Finding the Right Practitioner for You'
        },
        
        // Booking Consultations
        {
            keywords: ['book consultation', 'schedule appointment', 'how to book', 'make appointment', 'booking process', 'first consultation', 'book session', 'schedule session', 'make booking', 'how do i book', 'booking appointment'],
            answer: "Booking is simple: Create your account, complete your wellness profile, review matched practitioners, and select your preferred time slot. You'll receive confirmation and practitioner contact information immediately.",
            articleLink: './articles/how-to-book-consultation.html',
            articleTitle: 'How to Book a Consultation'
        },
        
        // Reviews & Testimonials
        {
            keywords: ['reviews', 'testimonials', 'ratings', 'feedback', 'client reviews', 'trust', 'credibility'],
            answer: "Client reviews are crucial for building trust and credibility. As a practitioner, encourage honest feedback after sessions. As a patient, reviews help you evaluate practitioners and make informed decisions.",
            articleLink: './articles/importance-of-reviews.html',
            articleTitle: 'The Importance of Reviews and Testimonials'
        },
        
        // Building Profile (Practitioner)
        {
            keywords: ['build profile', 'create profile', 'practitioner profile', 'profile optimization', 'complete profile', 'setup profile'],
            answer: "Your practitioner profile is your digital storefront. Include a professional photo, detailed bio, credentials, service descriptions, rates, and availability. Complete profiles receive 3-4x more qualified leads.",
            articleLink: './articles/building-your-profile.html',
            articleTitle: 'Building Your Winning Practitioner Profile'
        },
        
        // Pricing Strategies
        {
            keywords: ['pricing', 'rates', 'how much to charge', 'setting prices', 'fees', 'cost', 'rate card'],
            answer: "Strategic pricing reflects your expertise and ensures sustainability. Research your market, calculate costs, define service packages, and communicate rates transparently. Adjust rates as you gain experience and demand grows.",
            articleLink: './articles/pricing-strategies.html',
            articleTitle: 'Pricing Strategies for Practitioners'
        },
        
        // Lead Follow-Up
        {
            keywords: ['follow up', 'leads', 'convert leads', 'lead response', 'contact leads', 'follow-up practices'],
            answer: "Speed and personalization are key. Respond within 1 hour, personalize your message, offer value, and follow a structured sequence. Practitioners who respond quickly convert 40% more leads.",
            articleLink: './articles/lead-followup-practices.html',
            articleTitle: 'Lead Follow-Up Best Practices'
        },
        
        // Healing Plants
        {
            keywords: ['healing plants', 'herbs', 'plants at home', 'herbal remedies', 'growing plants', 'medicinal plants'],
            answer: "Common healing plants for your home include garlic, ginger, lemon balm, peppermint, lavender, and aloe vera. These are easy to grow indoors and have been traditionally used for wellness support across cultures.",
            articleLink: './articles/healing-plants-home.html',
            articleTitle: 'Healing Plants to Keep Around Your Home'
        },
        
        // Mindfulness & Stress
        {
            keywords: ['mindfulness', 'stress relief', 'meditation', 'stress management', 'anxiety', 'calm', 'relaxation'],
            answer: "Mindfulness is present-moment awareness without judgment. Simple practices include conscious breathing, mindful walking, meditation, and gratitude. These activate your parasympathetic nervous system and reduce stress.",
            articleLink: './articles/mindfulness-stress-relief.html',
            articleTitle: 'Mindfulness and Stress Relief'
        },
        
        // Nutrition
        {
            keywords: ['nutrition', 'diet', 'food as medicine', 'healthy eating', 'holistic nutrition', 'nutritional wellness'],
            answer: "In holistic wellness, food is medicine. Focus on whole foods, seasonal eating, and listening to your body. Holistic nutrition emphasizes individual needs rather than one-size-fits-all diets.",
            articleLink: './articles/nutrition-holistic-wellness.html',
            articleTitle: 'The Role of Nutrition in Holistic Wellness'
        },
        
        // Payment & Costs (Patient)
        {
            keywords: ['payment', 'cost', 'how much does it cost', 'pricing', 'free', 'pay', 'insurance'],
            answer: "Rooted Vitality is free for patients to browse and use. Practitioner rates vary by service type, experience, and location. Payment methods and rates are displayed clearly on each practitioner's profile.",
            articleLink: './articles/what-is-rooted-vitality.html',
            articleTitle: 'What is Rooted Vitality?'
        },
        
        // Getting Started (Patient)
        {
            keywords: ['get started', 'how to start', 'begin', 'first steps', 'new patient', 'patient guide', 'where do i start', 'getting started', 'how does this work', 'new here', 'start using'],
            answer: "Start by exploring wellness resources and articles to learn about different wellness practices. When ready, browse practitioners by specialty and location, then book a consultation with someone who resonates with you.",
            articleLink: './articles/how-to-book-consultation.html',
            articleTitle: 'How to Book a Consultation'
        },
        
        // Getting Started (Practitioner)
        {
            keywords: ['practitioner start', 'join platform', 'list my services', 'practitioner signup', 'how to join'],
            answer: "Create your practitioner profile with your background, philosophy, credentials, rates, and availability. When patients find you and book, you connect with clients who value your approach to healing.",
            articleLink: './articles/building-your-profile.html',
            articleTitle: 'Building Your Winning Practitioner Profile'
        },
        
        // Types of Practitioners
        {
            keywords: ['types of practitioners', 'what practitioners', 'who can i find', 'specialties', 'wellness professionals'],
            answer: "You'll find herbalists, energy workers, nutritionists, wellness coaches, massage therapists, acupuncturists, and many other holistic wellness professionals. Browse by specialty to find exactly what you need.",
            articleLink: './articles/what-is-rooted-vitality.html',
            articleTitle: 'What is Rooted Vitality?'
        },
        
        // Virtual/Remote Sessions
        {
            keywords: ['virtual', 'remote', 'online', 'video consultation', 'telehealth', 'distance'],
            answer: "Many practitioners offer remote sessions via video call, allowing you to access wellness support from anywhere. Virtual sessions provide flexibility and remove geographic barriers.",
            articleLink: './articles/coverage-area-services.html',
            articleTitle: 'Service Area & Remote Wellness'
        },
        
        // Credentials & Certifications
        {
            keywords: ['credentials', 'certifications', 'qualifications', 'licensed', 'training', 'certified'],
            answer: "Look for relevant credentials in each practitioner's profile. They should have training, certifications, or licenses in their field. Practitioners can earn additional certifications to expand their expertise.",
            articleLink: './articles/earning-credentials.html',
            articleTitle: 'Earning Credentials & Certifications'
        },
        
        // Safety & Medical Concerns
        {
            keywords: ['safe', 'medical', 'doctor', 'illness', 'diagnosis', 'treatment'],
            answer: "Rooted Vitality is a wellness connection platform, not a medical service. We support complementary and holistic approaches. Always consult with your healthcare provider for medical concerns or diagnoses.",
            articleLink: './articles/what-is-rooted-vitality.html',
            articleTitle: 'What is Rooted Vitality?'
        },
        
        // Seasonal Wellness
        {
            keywords: ['seasonal', 'seasons', 'winter wellness', 'summer health', 'seasonal practices'],
            answer: "Seasonal wellness involves aligning your practices with natural rhythms throughout the year. Each season offers unique opportunities for self-care, nutrition, and lifestyle adjustments.",
            articleLink: './articles/seasonal-wellness.html',
            articleTitle: 'Seasonal Wellness Practices'
        },
        
        // ROI & Business Growth
        {
            keywords: ['roi', 'return on investment', 'measure success', 'track growth', 'business metrics'],
            answer: "Measure your practice's ROI by tracking lead conversion rates, client lifetime value, cost per acquisition, and retention rates. Regular analysis helps optimize your marketing and pricing strategies.",
            articleLink: './articles/measuring-roi.html',
            articleTitle: 'Measuring ROI of Your Practice'
        },
        
        // Pay-Per-Lead Model
        {
            keywords: ['pay per lead', 'lead model', 'how leads work', 'lead pricing', 'lead generation'],
            answer: "Pay-per-lead means you only pay for qualified client inquiries, not clicks or impressions. You receive genuine prospects who are actively seeking your services, making it cost-effective for growing your practice.",
            articleLink: './articles/pay-per-lead-basics.html',
            articleTitle: 'Pay-Per-Lead Basics for Practitioners'
        },
        
        // Account & Profile Issues
        {
            keywords: ['account issue', 'login problem', 'cant login', 'reset password', 'profile not working', 'technical issue'],
            answer: "For account or technical issues, please contact our support team. We're here to help you resolve any problems quickly.",
            supportContact: true
        },
        
        // Cancellation & Refunds
        {
            keywords: ['cancel', 'refund', 'cancellation policy', 'reschedule', 'change appointment'],
            answer: "Cancellation and refund policies vary by practitioner. Check your practitioner's specific policy on their profile or contact them directly. For platform-related refunds, contact our support team.",
            supportContact: true
        }
    ];

    // ========== CHATBOT STATE ==========
    let isOpen = false; // Chat starts closed
    let conversationHistory = [];
    let currentTab = 'client'; // Default context

    // ========== UTILITY FUNCTIONS ==========
    
    function normalizeText(text) {
        return text.toLowerCase().trim();
    }

    function findBestMatch(userQuestion) {
        const normalized = normalizeText(userQuestion);
        
        // Split user input into words for better matching
        const userWords = normalized.split(/\s+/);
        
        let bestMatch = null;
        let highestScore = 0;

        knowledgeBase.forEach(entry => {
            let score = 0;
            
            entry.keywords.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                const keywordWords = keywordLower.split(/\s+/);
                
                // Check if exact keyword phrase exists in user query
                if (normalized.includes(keywordLower)) {
                    score += keywordWords.length * 3; // Exact phrase match scores highest
                } else {
                    // Check for partial word matches
                    let matchedWords = 0;
                    keywordWords.forEach(keywordWord => {
                        userWords.forEach(userWord => {
                            // Match if words are similar enough
                            if (userWord.length >= 4 && keywordWord.length >= 4) {
                                // For longer words, check if one contains the other
                                if (userWord.includes(keywordWord) || keywordWord.includes(userWord)) {
                                    matchedWords++;
                                }
                            } else if (userWord === keywordWord) {
                                // For shorter words, require exact match
                                matchedWords++;
                            }
                        });
                    });
                    
                    // Award points based on percentage of keyword words matched
                    if (matchedWords > 0) {
                        score += (matchedWords / keywordWords.length) * keywordWords.length;
                    }
                }
            });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = entry;
            }
        });

        // Require at least a minimal score to avoid very weak matches
        return highestScore > 0.5 ? bestMatch : null;
    }

    function getBotResponse(userMessage) {
        const match = findBestMatch(userMessage);
        
        if (match) {
            let response = {
                text: match.answer,
                articleLink: match.articleLink || null,
                articleTitle: match.articleTitle || null,
                supportContact: match.supportContact || false
            };
            return response;
        }

        // No match found - provide helpful fallback with suggestions
        return {
            text: "I'm here to help! I can answer questions about:\n\n• Finding and choosing practitioners\n• Booking consultations and appointments\n• Understanding holistic medicine\n• Wellness topics (nutrition, mindfulness, healing plants)\n• Practitioner guidance (building profiles, pricing, leads)\n\nWhat would you like to know?",
            supportContact: true
        };
    }

    // ========== UI CREATION ==========
    
    function createChatbotUI() {
        // Chat Button
        const chatButton = document.createElement('button');
        chatButton.id = 'rv-chat-button';
        chatButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Help</span>
        `;
        chatButton.setAttribute('aria-label', 'Open help chat');
        
        // Chat Window
        const chatWindow = document.createElement('div');
        chatWindow.id = 'rv-chat-window';
        chatWindow.innerHTML = `
            <div class="rv-chat-header">
                <div class="rv-chat-header-content">
                    <div class="rv-chat-logo">🌿</div>
                    <div>
                        <h3>Rooted Vitality Assistant</h3>
                        <p>Ask me anything about our platform</p>
                    </div>
                </div>
                <button id="rv-chat-close" aria-label="Close chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="rv-chat-messages" id="rv-chat-messages">
                <div class="rv-message rv-bot-message">
                    <div class="rv-message-avatar">🌿</div>
                    <div class="rv-message-content">
                        <p>Hi! I'm your Rooted Vitality assistant. I can help you with:</p>
                        <ul>
                            <li>Finding the right practitioner</li>
                            <li>Booking consultations</li>
                            <li>Understanding holistic wellness</li>
                            <li>Building your practitioner profile</li>
                            <li>Platform guidance</li>
                        </ul>
                        <p>What can I help you with today?</p>
                    </div>
                </div>
            </div>
            <div class="rv-chat-input-wrapper">
                <input 
                    type="text" 
                    id="rv-chat-input" 
                    placeholder="Ask a question..." 
                    aria-label="Type your question"
                />
                <button id="rv-chat-send" aria-label="Send message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(chatButton);
        document.body.appendChild(chatWindow);

        // Add Styles
        addChatbotStyles();

        // Add Event Listeners
        chatButton.addEventListener('click', toggleChat);
        document.getElementById('rv-chat-close').addEventListener('click', toggleChat);
        document.getElementById('rv-chat-send').addEventListener('click', sendMessage);
        document.getElementById('rv-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Detect current tab context if on index page
        detectCurrentContext();
    }

    function detectCurrentContext() {
        // Check if we're on the index page with tabs
        const clientTab = document.getElementById('client-tab');
        const practitionerTab = document.getElementById('practitioner-tab');
        
        if (clientTab && practitionerTab) {
            // Set initial context
            currentTab = clientTab.classList.contains('active') ? 'client' : 'practitioner';
            
            // Listen for tab changes
            clientTab.addEventListener('click', () => { currentTab = 'client'; });
            practitionerTab.addEventListener('click', () => { currentTab = 'practitioner'; });
        }
    }

    function toggleChat() {
        isOpen = !isOpen;
        const chatWindow = document.getElementById('rv-chat-window');
        const chatButton = document.getElementById('rv-chat-button');
        
        if (isOpen) {
            chatWindow.classList.add('rv-chat-open');
            chatButton.classList.add('rv-chat-button-hidden');
            document.getElementById('rv-chat-input').focus();
        } else {
            chatWindow.classList.remove('rv-chat-open');
            chatButton.classList.remove('rv-chat-button-hidden');
        }
    }

    function sendMessage() {
        const input = document.getElementById('rv-chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        input.value = '';

        // Get bot response
        setTimeout(() => {
            const response = getBotResponse(message);
            addMessage(response.text, 'bot', response);
        }, 500);
    }

    function addMessage(text, sender, metadata = {}) {
        const messagesContainer = document.getElementById('rv-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `rv-message rv-${sender}-message`;

        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="rv-message-content">
                    <p>${escapeHtml(text)}</p>
                </div>
                <div class="rv-message-avatar">👤</div>
            `;
        } else {
            let content = `<p>${escapeHtml(text)}</p>`;
            
            // Add article link if available
            if (metadata.articleLink && metadata.articleTitle) {
                content += `
                    <div class="rv-article-link">
                        <a href="${metadata.articleLink}" target="_blank">
                            📖 Read: ${escapeHtml(metadata.articleTitle)}
                        </a>
                    </div>
                `;
            }
            
            // Add support contact if needed
            if (metadata.supportContact) {
                content += `
                    <div class="rv-support-link">
                        <a href="./policies/contact-us.html">
                            📧 Contact Support
                        </a>
                    </div>
                `;
            }

            messageDiv.innerHTML = `
                <div class="rv-message-avatar">🌿</div>
                <div class="rv-message-content">${content}</div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function addChatbotStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Chat Button */
            #rv-chat-button {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: var(--color-button, #5d6a3e);
                color: #fbf7ec;
                border: none;
                border-radius: 50px;
                padding: 14px 24px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: 'Inter', sans-serif;
                font-weight: 700;
                font-size: 15px;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
                z-index: 9998;
            }

            #rv-chat-button:hover {
                background: var(--color-hover, #fde8a9);
                color: var(--color-text, #000);
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }

            #rv-chat-button.rv-chat-button-hidden {
                opacity: 0;
                pointer-events: none;
            }

            #rv-chat-button svg {
                width: 20px;
                height: 20px;
            }

            /* Chat Window */
            #rv-chat-window {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 400px;
                max-width: calc(100vw - 48px);
                height: 600px;
                max-height: calc(100vh - 100px);
                background: #fbf7ec;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                pointer-events: none;
                transition: all 0.3s ease;
                z-index: 9999;
                overflow: hidden;
                visibility: hidden;
            }

            #rv-chat-window.rv-chat-open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: all;
                visibility: visible;
            }

            /* Chat Header */
            .rv-chat-header {
                background: linear-gradient(135deg, #5d6a3e 0%, #4a5531 100%);
                color: #fbf7ec;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 16px 16px 0 0;
            }

            .rv-chat-header-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .rv-chat-logo {
                font-size: 24px;
                width: 40px;
                height: 40px;
                background: rgba(251, 247, 236, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .rv-chat-header h3 {
                margin: 0;
                font-size: 16px;
                font-family: 'Inter', sans-serif;
                font-weight: 700;
            }

            .rv-chat-header p {
                margin: 0;
                font-size: 12px;
                opacity: 0.9;
                font-family: 'Lora', serif;
            }

            #rv-chat-close {
                background: transparent;
                border: none;
                color: #fbf7ec;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background 0.2s;
            }

            #rv-chat-close:hover {
                background: rgba(251, 247, 236, 0.2);
            }

            /* Chat Messages */
            .rv-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: linear-gradient(135deg, #fafafa 0%, #fbf7ec 100%);
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            
            .rv-chat-messages::-webkit-scrollbar {
                width: 8px;
            }
            
            .rv-chat-messages::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
            }
            
            .rv-chat-messages::-webkit-scrollbar-thumb {
                background: rgba(93, 106, 62, 0.3);
                border-radius: 4px;
            }
            
            .rv-chat-messages::-webkit-scrollbar-thumb:hover {
                background: rgba(93, 106, 62, 0.5);
            }

            .rv-message {
                display: flex;
                gap: 10px;
                animation: messageSlideIn 0.3s ease;
            }

            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .rv-message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                flex-shrink: 0;
                background: #fbf7ec;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .rv-message-content {
                background: #fbf7ec;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                max-width: 75%;
                font-family: 'Lora', serif;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .rv-bot-message .rv-message-content {
                background: linear-gradient(135deg, #fbf7ec 0%, #fbf7ec 100%);
                border: 1px solid rgba(93, 106, 62, 0.15);
            }
            
            .rv-bot-message .rv-message-avatar {
                background: linear-gradient(135deg, #5d6a3e 0%, #4a5531 100%);
            }

            .rv-user-message {
                flex-direction: row-reverse;
            }

            .rv-user-message .rv-message-content {
                background: linear-gradient(135deg, #5d6a3e 0%, #4a5531 100%);
                color: #fbf7ec !important;
                box-shadow: 0 2px 8px rgba(93, 106, 62, 0.25);
            }
            
            .rv-user-message .rv-message-content p,
            .rv-user-message .rv-message-content span,
            .rv-user-message .rv-message-content div {
                color: #fbf7ec !important;
            }
            
            .rv-user-message .rv-message-avatar {
                background: linear-gradient(135deg, #fde8a9 0%, #f0d77d 100%);
            }

            .rv-message-content p {
                margin: 0 0 8px 0;
                #fbf7ec-space: pre-line;
            }

            .rv-message-content p:last-child {
                margin-bottom: 0;
            }

            .rv-message-content ul {
                margin: 8px 0;
                padding-left: 20px;
            }

            .rv-message-content li {
                margin: 6px 0;
            }
            
            .rv-message-content strong {
                color: #5d6a3e;
                font-weight: 600;
            }
            
            .rv-user-message .rv-message-content strong {
                color: #fde8a9;
            }

            .rv-article-link, .rv-support-link {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(93, 106, 62, 0.15);
            }

            .rv-article-link a, .rv-support-link a {
                display: inline-block;
                color: #5d6a3e;
                text-decoration: none;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
                font-size: 13px;
                padding: 10px 16px;
                background: linear-gradient(135deg, rgba(93, 106, 62, 0.08) 0%, rgba(93, 106, 62, 0.12) 100%);
                border-radius: 8px;
                transition: all 0.2s;
                border: 1px solid rgba(93, 106, 62, 0.2);
            }

            .rv-article-link a:hover, .rv-support-link a:hover {
                background: linear-gradient(135deg, #5d6a3e 0%, #4a5531 100%);
                color: #fbf7ec;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(93, 106, 62, 0.25);
            }

            /* Chat Input */
            .rv-chat-input-wrapper {
                padding: 16px;
                background: linear-gradient(135deg, #fbf7ec 0%, #fbf7ec 100%);
                border-top: 1px solid rgba(93, 106, 62, 0.15);
                display: flex;
                gap: 10px;
            }

            #rv-chat-input {
                flex: 1;
                border: 2px solid rgba(93, 106, 62, 0.2);
                border-radius: 24px;
                padding: 12px 18px;
                font-family: 'Lora', serif;
                font-size: 14px;
                outline: none;
                transition: all 0.2s;
                background: #fbf7ec;
            }

            #rv-chat-input:focus {
                border-color: #5d6a3e;
                box-shadow: 0 0 0 3px rgba(93, 106, 62, 0.1);
            }
                border-color: #5d6a3e;
            }

            #rv-chat-send {
                width: 44px;
                height: 44px;
                border: none;
                background: linear-gradient(135deg, #5d6a3e 0%, #4a5531 100%);
                color: #fbf7ec;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(93, 106, 62, 0.25);
            }

            #rv-chat-send:hover {
                background: linear-gradient(135deg, #4a5531 0%, #3a4225 100%);
                transform: scale(1.08);
                box-shadow: 0 4px 12px rgba(93, 106, 62, 0.35);
            }
            
            #rv-chat-send:active {
                transform: scale(0.98);
            }

            /* Mobile Responsive */
            @media (max-width: 480px) {
                #rv-chat-button {
                    bottom: 16px;
                    right: 16px;
                    padding: 12px 20px;
                    font-size: 14px;
                }

                #rv-chat-window {
                    bottom: 0;
                    right: 0;
                    left: 0;
                    width: 100%;
                    max-width: 100%;
                    height: 100vh;
                    max-height: 100vh;
                    border-radius: 0;
                }

                .rv-chat-header {
                    border-radius: 0;
                }

                .rv-message-content {
                    max-width: 80%;
                }
            }

            /* Scrollbar Styling */
            .rv-chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .rv-chat-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .rv-chat-messages::-webkit-scrollbar-thumb {
                background: #5d6a3e;
                border-radius: 3px;
            }

            .rv-chat-messages::-webkit-scrollbar-thumb:hover {
                background: #4a5531;
            }
        `;
        document.head.appendChild(style);
    }

    // ========== INITIALIZATION ==========
    
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createChatbotUI);
        } else {
            createChatbotUI();
        }
    }

    // Initialize the chatbot
    init();

})();

























































