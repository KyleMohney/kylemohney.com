/**
 * Practitioner Inbox Manager
 * Handles message threads, filtering, and UI interactions
 */

let currentUser = null;
let currentFilter = 'all';
let conversations = [];
let selectedConversationId = null;

/**
 * Generate initials-based avatar HTML
 * Creates a circular badge with first letter of first name, second letter of last name
 * @param {string} name - Full name (e.g., "Sarah Johnson")
 * @returns {string} - HTML for initials avatar
 */
function generateInitialsAvatar(name) {
    const parts = name.trim().split(' ').filter(p => p);
    let initials = '';
    
    if (parts.length === 1) {
        // Single name: use first letter twice
        initials = parts[0][0].toUpperCase();
    } else if (parts.length === 2) {
        // Two names: first letter of first, first letter of last
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
        // Multiple names: first and last
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    
    // Generate color based on initials (consistent hash)
    const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const hue = (hash * 137.508) % 360; // Golden angle for color distribution
    const color = `hsl(${hue}, 70%, 60%)`;
    
    // Return inline SVG as data URL
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="24" fill="${color}"/>
            <text x="24" y="30" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
        </svg>
    `;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[Rooted Vitality] Initializing Practitioner Inbox...');
        
        // Get current user
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            console.log('[Rooted Vitality] No user logged in, redirecting to signup');
            window.location.href = '/signup.html';
            return;
        }
        
        currentUser = user;
        console.log(`[Rooted Vitality] Inbox loaded for user: ${user.id}`);
        
        // Set active view to practitioner for this page
        localStorage.setItem('active_view', 'practitioner');
        
        // Render header with practitioner role
        if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.renderHeader === 'function') {
            console.log('[Rooted Vitality] Rendering practitioner header for inbox');
            await RootedVitality.renderHeader('practitioner', 'practitioner');
        }
        
        // Ensure footer is injected
        if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.injectFooter === 'function') {
            console.log('[Rooted Vitality] Injecting footer into inbox');
            RootedVitality.injectFooter();
        }
        
        // Setup event listeners
        setupNavigationListeners();
        setupSearchListener();
        setupThreadCloseListener();
        setupBackButtonListener();
        
        // Load conversations
        await loadConversations();
        
        // Render initial UI
        renderThreadsList();
        updateBadges();
        
        console.log('[Rooted Vitality] Inbox initialized successfully');
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing inbox:', error);
    }
});

/**
 * Setup navigation filter buttons
 */
function setupNavigationListeners() {
    const navItems = document.querySelectorAll('.inbox-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.inbox-nav-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update filter and re-render
            currentFilter = item.getAttribute('data-filter');
            renderThreadsList();
            
            // Clear selection
            selectedConversationId = null;
            closeThreadView();
        });
    });
}

/**
 * Setup search functionality
 */
function setupSearchListener() {
    const searchInput = document.getElementById('search-conversations');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderThreadsList(query);
    });
}

/**
 * Setup thread close button
 */
function setupThreadCloseListener() {
    const closeBtn = document.getElementById('close-thread');
    
    closeBtn.addEventListener('click', () => {
        closeThreadView();
    });
}

/**
 * Setup back button in conversation list view
 */
function setupBackButtonListener() {
    const backBtn = document.getElementById('back-to-threads');
    
    backBtn.addEventListener('click', () => {
        selectedConversationId = null;
        renderThreadsList();
        closeThreadView();
    });
}

/**
 * Load conversations from Supabase
 */
async function loadConversations() {
    try {
        // TODO: Replace with actual Supabase query when messaging table is ready
        // For now, using mock data for UI development
        
        const clientNames = ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez'];
        
        conversations = [
            {
                id: 1,
                practitionerId: currentUser.id,
                clientName: 'Sarah Johnson',
                clientAvatar: generateInitialsAvatar('Sarah Johnson'),
                lastMessage: 'Thank you for the great session yesterday!',
                lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                isUnread: true,
                status: 'online',
                category: 'all',
                messages: [
                    { id: 1, sender: 'client', text: 'Hi, I wanted to book a session', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    { id: 2, sender: 'practitioner', text: 'Hello Sarah! I have availability on Wednesday at 2 PM.', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) },
                    { id: 3, sender: 'client', text: 'That works perfectly for me!', timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000) },
                    { id: 4, sender: 'client', text: 'Thank you for the great session yesterday!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) }
                ]
            },
            {
                id: 2,
                practitionerId: currentUser.id,
                clientName: 'Michael Chen',
                clientAvatar: generateInitialsAvatar('Michael Chen'),
                lastMessage: 'Looking forward to our session next week',
                lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
                isUnread: false,
                status: 'away',
                category: 'all',
                messages: [
                    { id: 1, sender: 'client', text: 'Hi, can I reschedule for next week?', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
                    { id: 2, sender: 'practitioner', text: 'Of course! Let me check my calendar.', timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000) }
                ]
            },
            {
                id: 3,
                practitionerId: currentUser.id,
                clientName: 'Emily Rodriguez',
                clientAvatar: generateInitialsAvatar('Emily Rodriguez'),
                lastMessage: 'Session completed',
                lastMessageTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                isUnread: false,
                status: 'offline',
                category: 'hired',
                messages: [
                    { id: 1, sender: 'client', text: 'Thank you so much!', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                ]
            }
        ];
        
        console.log(`[Rooted Vitality] Loaded ${conversations.length} conversations with initials avatars`);
    } catch (error) {
        console.error('[Rooted Vitality] Error loading conversations:', error);
    }
}

/**
 * Render the threads list with filtering
 */
function renderThreadsList(searchQuery = '') {
    const threadsList = document.getElementById('threads-list');
    threadsList.innerHTML = '';
    
    // Filter conversations
    let filtered = conversations.filter(conv => {
        // Filter by category
        if (currentFilter === 'unread' && !conv.isUnread) return false;
        if (currentFilter === 'hired' && conv.category !== 'hired') return false;
        if (currentFilter === 'archive' && conv.category !== 'archive') return false;
        
        // Filter by search query
        if (searchQuery && !conv.clientName.toLowerCase().includes(searchQuery)) return false;
        
        return true;
    });
    
    // If no conversations match, show empty state
    if (filtered.length === 0) {
        threadsList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-tertiary);">
                <p>No conversations found</p>
            </div>
        `;
        return;
    }
    
    // Render each conversation thread
    filtered.forEach(conv => {
        const threadEl = createThreadElement(conv);
        threadsList.appendChild(threadEl);
    });
}

/**
 * Create a thread list item element
 */
function createThreadElement(conversation) {
    const item = document.createElement('button');
    item.className = 'thread-item';
    
    if (selectedConversationId === conversation.id) {
        item.classList.add('active');
    }
    
    if (conversation.isUnread) {
        item.classList.add('unread');
    }
    
    item.innerHTML = `
        <div class="thread-avatar-small">
            <img src="${conversation.clientAvatar}" alt="${conversation.clientName}">
        </div>
        <div class="thread-meta">
            <p class="thread-name">${conversation.clientName}</p>
            <p class="thread-preview">${conversation.lastMessage}</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span class="thread-time">${formatTime(conversation.lastMessageTime)}</span>
            <div class="thread-status-badge ${conversation.status === 'online' ? 'online' : conversation.status === 'away' ? 'away' : ''}"></div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        selectedConversationId = conversation.id;
        
        // Update active state
        document.querySelectorAll('.thread-item').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        
        // Show thread view
        openThreadView(conversation);
    });
    
    return item;
}

/**
 * Open and display a conversation thread
 */
function openThreadView(conversation) {
    const emptyState = document.getElementById('empty-state');
    const threadView = document.getElementById('conversation-thread');
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Update thread header
    document.getElementById('thread-avatar').src = conversation.clientAvatar;
    document.getElementById('thread-name').textContent = conversation.clientName;
    document.getElementById('thread-status').textContent = 
        conversation.status === 'online' ? '● Online' : 
        conversation.status === 'away' ? '◐ Away' : 
        'Offline';
    
    // Render messages
    renderMessages(conversation.messages);
    
    // Show thread view
    threadView.style.display = 'flex';
}

/**
 * Close the thread view and show empty state
 */
function closeThreadView() {
    const emptyState = document.getElementById('empty-state');
    const threadView = document.getElementById('conversation-thread');
    
    threadView.style.display = 'none';
    emptyState.style.display = 'flex';
}

/**
 * Render messages in the thread
 */
function renderMessages(messages) {
    const messagesContainer = document.getElementById('thread-messages');
    messagesContainer.innerHTML = '';
    
    messages.forEach(message => {
        const groupEl = document.createElement('div');
        groupEl.className = `message-group ${message.sender === 'practitioner' ? 'own' : 'other'}`;
        
        groupEl.innerHTML = `
            <div class="message-bubble">${escapeHtml(message.text)}</div>
            <span class="message-timestamp">${formatTime(message.timestamp)}</span>
        `;
        
        messagesContainer.appendChild(groupEl);
    });
    
    // Scroll to bottom
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

/**
 * Update badge counts
 */
function updateBadges() {
    const allCount = conversations.length;
    const unreadCount = conversations.filter(c => c.isUnread).length;
    const hiredCount = conversations.filter(c => c.category === 'hired').length;
    const archiveCount = conversations.filter(c => c.category === 'archive').length;
    
    document.getElementById('badge-all').textContent = allCount;
    document.getElementById('badge-unread').textContent = unreadCount;
    document.getElementById('badge-hired').textContent = hiredCount;
    document.getElementById('badge-archive').textContent = archiveCount;
}

/**
 * Utility: Format timestamp
 */
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
