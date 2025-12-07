/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: chat-bot/scripts/chatbot.js                                 ║
║  Purpose: AI-Style Help Center Chatbot with Q&A                    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

(function() {
    'use strict';

    // ========== KNOWLEDGE BASE ==========
    let knowledgeBase = [];
    
    // Load knowledge base from multiple JSON files
    async function loadKnowledgeBase() {
        try {
            // Determine the base path dynamically
            const scriptPath = document.currentScript?.src || '';
            const baseUrl = scriptPath ? new URL('./', new URL(scriptPath, window.location.href)).href : '../';
            const dataPath = baseUrl.includes('chat-bot/scripts') 
                ? baseUrl.replace('chat-bot/scripts/', 'chat-bot/data/')
                : '../data/';

            // Load all knowledge base files
            const [articlesRes, generalRes, clientRes, practitionerRes] = await Promise.all([
                fetch(dataPath + 'articles.json'),
                fetch(dataPath + 'general.json'),
                fetch(dataPath + 'client.json'),
                fetch(dataPath + 'practitioner.json')
            ]);

            if (!articlesRes.ok || !generalRes.ok || !clientRes.ok || !practitionerRes.ok) {
                throw new Error('One or more knowledge base files failed to load');
            }

            const articlesData = await articlesRes.json();
            const generalData = await generalRes.json();
            const clientData = await clientRes.json();
            const practitionerData = await practitionerRes.json();

            // Combine all knowledge bases
            knowledgeBase = [
                ...articlesData.knowledgeBase,
                ...generalData.knowledgeBase,
                ...clientData.knowledgeBase,
                ...practitionerData.knowledgeBase
            ];

            console.log(`[Chatbot] Successfully loaded ${knowledgeBase.length} knowledge base entries from ${dataPath}`);
            console.log('[Chatbot] Articles:', articlesData.knowledgeBase.length, 'General:', generalData.knowledgeBase.length, 'Client:', clientData.knowledgeBase.length, 'Practitioner:', practitionerData.knowledgeBase.length);
        } catch (error) {
            console.error('[Chatbot] Failed to load knowledge base:', error);
            console.error('[Chatbot] Using fallback knowledge base');
            // Fallback knowledge base if loading fails
            knowledgeBase = [
                {
                    keywords: ['help', 'support', 'question'],
                    answer: 'I\'m your Rooted Vitality assistant. I can help with information about finding practitioners, booking consultations, understanding holistic wellness, and more. What would you like to know?',
                    supportContact: true
                }
            ];
        }
    }

    // ========== STATE ==========
    let isOpen = false;

    // ========== UTILITY FUNCTIONS ==========
    
    function normalizeText(text) {
        return text.toLowerCase().trim();
    }

    function getAssetPath(assetName) {
        const basePath = window.location.pathname.split('/rooted-vitality/')[0] + '/rooted-vitality';
        return `${basePath}/assets/${assetName}`;
    }

    function findBestMatch(userQuestion) {
        if (!knowledgeBase || knowledgeBase.length === 0) {
            console.warn('[Chatbot] Knowledge base is empty');
            return null;
        }

        const normalized = normalizeText(userQuestion);
        const userWords = normalized.split(/\s+/).filter(w => w.length > 0);
        
        // Don't bother searching with very short queries
        if (userWords.length === 0) return null;

        let candidates = [];

        knowledgeBase.forEach(entry => {
            let score = 0;
            let bestKeywordScore = 0;
            
            // Check each keyword in the entry
            entry.keywords.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                const keywordWords = keywordLower.split(/\s+/).filter(w => w.length > 0);
                
                let keywordScore = 0;
                let matchedKeywordWords = 0;
                
                // Exact phrase match (highest priority - worth a lot of points)
                if (normalized.includes(keywordLower)) {
                    keywordScore = keywordWords.length * 10;
                    matchedKeywordWords = keywordWords.length;
                } else {
                    // Count how many words from the keyword appear in user input
                    keywordWords.forEach(keywordWord => {
                        userWords.forEach(userWord => {
                            // Exact word match - highest priority
                            if (userWord === keywordWord) {
                                keywordScore += 5;
                                matchedKeywordWords++;
                            }
                            // Very strong partial match - word starts with keyword or vice versa
                            else if ((userWord.startsWith(keywordWord) || keywordWord.startsWith(userWord)) && 
                                     Math.min(userWord.length, keywordWord.length) >= 4) {
                                keywordScore += 2;
                                matchedKeywordWords += 0.5;
                            }
                        });
                    });
                }
                
                // Only count keywords where at least 50% of words matched
                if (matchedKeywordWords >= Math.ceil(keywordWords.length * 0.5)) {
                    bestKeywordScore = Math.max(bestKeywordScore, keywordScore);
                }
            });

            // Only consider entries with meaningful matches
            if (bestKeywordScore >= 3) {
                candidates.push({ entry, score: bestKeywordScore });
            }
        });

        // Sort by score (descending)
        candidates.sort((a, b) => b.score - a.score);

        // Return the best match if it has good score
        if (candidates.length > 0 && candidates[0].score >= 3) {
            console.log('[Chatbot] Best match score:', candidates[0].score, 'Question:', candidates[0].entry.keywords[0], 'User asked:', userQuestion);
            return candidates[0].entry;
        }
        
        console.log('[Chatbot] No good match found for:', userQuestion, '- Top candidate score was:', candidates.length > 0 ? candidates[0].score : 'none');
        return null;
    }

    function getBotResponse(userMessage) {
        const match = findBestMatch(userMessage);
        
        if (match) {
            return {
                text: match.answer,
                articleLink: match.articleLink || null,
                articleTitle: match.articleTitle || null,
                supportContact: match.supportContact || false
            };
        }

        // No match found - provide helpful guidance
        return {
            text: "I'm here to help! I can answer questions about:\n\n• Finding and choosing practitioners\n• Booking consultations\n• Understanding holistic wellness\n• Practitioner setup and management\n• CRM integrations and features\n• Your profile and account settings\n\nTry asking something like 'How do I find practitioners?' or 'How does matching work?' - and I'll do my best to help!",
            supportContact: true
        };
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== UI CREATION ==========
    
    function createChatbotUI() {
        // Chat Button Container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'chatbot-launcher';
        
        const chatButton = document.createElement('button');
        chatButton.className = 'chatbot-launcher-btn';
        chatButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        buttonContainer.appendChild(chatButton);
        
        // Chat Window
        const chatWindow = document.createElement('div');
        chatWindow.id = 'chatbot-window';
        chatWindow.className = 'chatbot-window';
        chatWindow.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-header-content">
                    <img src="${getAssetPath('logo_trimmed.png')}" alt="Rooted Vitality" class="chatbot-logo">
                    <div>
                        <h3>Rooted Vitality Assistant</h3>
                        <p>Ask me anything about our platform</p>
                    </div>
                </div>
                <button class="chatbot-header-close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="chatbot-messages">
                <div class="chatbot-message bot">
                    <img src="${getAssetPath('logo_trimmed.png')}" alt="Rooted Vitality" class="message-avatar">
                    <div class="message-bubble">
                        <p>Hi! I'm your Rooted Vitality assistant. I can help with:</p>
                        <ul>
                            <li>Finding practitioners</li>
                            <li>Booking consultations</li>
                            <li>Understanding holistic wellness</li>
                            <li>Building your profile</li>
                            <li>Platform features</li>
                        </ul>
                        <p>What can I help you with?</p>
                    </div>
                </div>
            </div>
            <div class="chatbot-input-area">
                <input 
                    type="text" 
                    class="chatbot-input" 
                    placeholder="Ask a question..."
                />
                <button class="chatbot-send-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(buttonContainer);
        document.body.appendChild(chatWindow);

        // Event Listeners
        chatButton.addEventListener('click', toggleChat);
        chatWindow.querySelector('.chatbot-header-close').addEventListener('click', toggleChat);
        chatWindow.querySelector('.chatbot-send-btn').addEventListener('click', sendMessage);
        chatWindow.querySelector('.chatbot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function toggleChat() {
        isOpen = !isOpen;
        const chatWindow = document.getElementById('chatbot-window');
        const chatButton = document.querySelector('.chatbot-launcher-btn');
        
        if (isOpen) {
            chatWindow.classList.add('open');
            chatButton.classList.add('open');
            document.querySelector('.chatbot-input').focus();
        } else {
            chatWindow.classList.remove('open');
            chatButton.classList.remove('open');
        }
    }

    function sendMessage() {
        const input = document.querySelector('.chatbot-input');
        const userMessage = input.value.trim();
        
        if (!userMessage) return;
        
        const messagesContainer = document.querySelector('.chatbot-messages');
        
        console.log('[Chatbot] User asked:', userMessage);
        
        // Add user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chatbot-message user';
        userMessageDiv.innerHTML = `<div class="message-bubble">${escapeHtml(userMessage)}</div>`;
        messagesContainer.appendChild(userMessageDiv);
        
        input.value = '';
        
        // Get bot response
        const response = getBotResponse(userMessage);
        console.log('[Chatbot] Response:', response);
        
        // Add bot message
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'chatbot-message bot';
        
        let content = `<div class="message-bubble">`;
        
        // Handle multiline text with proper formatting
        const paragraphs = response.text.split('\n\n');
        paragraphs.forEach(para => {
            if (para.startsWith('•')) {
                // This is a bullet point section
                const lines = para.split('\n');
                content += '<ul style="margin: 8px 0; padding-left: 20px;">';
                lines.forEach(line => {
                    if (line.trim()) {
                        content += `<li>${escapeHtml(line.replace(/^•\s*/, '').trim())}</li>`;
                    }
                });
                content += '</ul>';
            } else if (para.trim()) {
                content += `<p style="margin: 8px 0;">${escapeHtml(para.trim())}</p>`;
            }
        });
        
        if (response.articleLink) {
            content += `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);"><a href="${response.articleLink}" target="_blank" style="display: inline-block; color: #77883e; text-decoration: none; font-weight: 600; padding: 8px 12px; background: rgba(119, 136, 62, 0.1); border-radius: 6px;">${escapeHtml(response.articleTitle)}</a></div>`;
        }
        
        if (response.supportContact) {
            content += `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);"><a href="./policies/contact-us.html" style="display: inline-block; color: #77883e; text-decoration: none; font-weight: 600; padding: 8px 12px; background: rgba(119, 136, 62, 0.1); border-radius: 6px;">Contact Support</a></div>`;
        }
        
        content += `</div>`;
        
        botMessageDiv.innerHTML = `
            <img src="${getAssetPath('logo_trimmed.png')}" alt="Rooted Vitality" class="message-avatar">
            ${content}
        `;
        
        messagesContainer.appendChild(botMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ========== INITIALIZATION ==========
    
    function init() {
        loadKnowledgeBase().then(() => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createChatbotUI);
            } else {
                createChatbotUI();
            }
        });
    }

    init();

})();