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
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            window.location.href = baseUrl + 'dashboard/signup.html';
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
        // Get practitioner ID
        const rvUserStr = localStorage.getItem('rvUser');
        if (!rvUserStr) {
            console.error('[Inbox] No rvUser in localStorage');
            return;
        }

        const rvUser = JSON.parse(rvUserStr);
        const practitionerId = rvUser.id;
        console.log('[Inbox] Loading conversations for practitioner:', practitionerId);

        // Get all accepted matches for this practitioner
        const { data: matches, error: matchError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select(`
                id,
                project_id,
                status,
                created_at,
                projects (
                    id,
                    description,
                    category_name,
                    clients (
                        id,
                        first_name,
                        last_name
                    )
                )
            `)
            .eq('practitioner_id', practitionerId)
            .eq('status', 'accepted');

        if (matchError) {
            console.error('[Inbox] Error loading matches:', matchError);
            return;
        }

        conversations = [];

        // Load messages for each match
        for (const match of matches || []) {
            if (!match.projects?.clients) continue;

            const project = match.projects;
            const client = project.clients;
            const clientName = `${client.first_name || 'Client'} ${client.last_name || ''}`;

            // Get latest messages
            const { data: messages } = await window.supabaseClient
                .from('project_messages')
                .select('id, message, sender_type, created_at')
                .eq('project_id', match.project_id)
                .eq('practitioner_id', practitionerId)
                .order('created_at', { ascending: false })
                .limit(50);

            const lastMessage = messages?.[0];
            const unreadCount = messages?.filter(m => !m.is_read && m.sender_type === 'client').length || 0;

            conversations.push({
                id: match.id,
                matchId: match.id,
                projectId: match.project_id,
                clientId: client.id,
                practitionerId: practitionerId,
                clientName: clientName,
                clientAvatar: generateInitialsAvatar(clientName),
                lastMessage: lastMessage?.message || 'No messages yet',
                lastMessageTime: lastMessage?.created_at ? new Date(lastMessage.created_at) : new Date(match.created_at),
                isUnread: unreadCount > 0,
                unreadCount: unreadCount,
                status: 'online',
                category: 'all',
                messages: messages || []
            });
        }

        console.log(`[Inbox] Loaded ${conversations.length} conversations`);
    } catch (error) {
        console.error('[Inbox] Error loading conversations:', error);
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
    
    // Update lead details hero
    populateLeadDetailsHero(conversation);
    
    // Render messages
    renderMessages(conversation.messages);
    
    // Enable message input and set up send handler
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = `Message ${conversation.clientName}...`;
    }
    
    if (sendBtn) {
        sendBtn.disabled = false;
        
        // Remove old listeners by cloning
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        // Add new listener
        newSendBtn.addEventListener('click', async () => {
            const message = messageInput.value.trim();
            if (!message) return;
            
            try {
                const { error } = await window.supabaseClient
                    .from('project_messages')
                    .insert({
                        project_id: conversation.projectId,
                        practitioner_id: conversation.practitionerId,
                        client_id: conversation.clientId,
                        sender_id: currentUser.id,
                        sender_type: 'practitioner',
                        message: message,
                        is_read: false
                    });
                
                if (!error) {
                    messageInput.value = '';
                    messageInput.focus();
                    // Reload conversation
                    await loadConversations();
                    renderThreadsList();
                } else {
                    alert('Error sending message');
                }
            } catch (error) {
                console.error('[Inbox] Error sending message:', error);
                alert('Error sending message');
            }
        });
        
        // Also send on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                newSendBtn.click();
            }
        });
    }
    
    // Show thread view
    threadView.style.display = 'flex';
}

/**
 * Populate the lead details hero section with client information
 */
function populateLeadDetailsHero(conversation) {
    // Update lead avatar
    document.getElementById('lead-avatar-large').src = conversation.clientAvatar;
    
    // Update lead name
    document.getElementById('lead-name').textContent = conversation.clientName;
    
    // Update lead status (interested, hired, etc.)
    const leadStatus = document.getElementById('lead-status');
    if (conversation.status === 'hired') {
        leadStatus.textContent = '✓ Hired';
        leadStatus.style.color = 'var(--primary)';
    } else if (conversation.archived) {
        leadStatus.textContent = 'Archived';
        leadStatus.style.color = 'var(--text-tertiary)';
    } else {
        leadStatus.textContent = 'Interested in services';
        leadStatus.style.color = 'var(--text-secondary)';
    }
    
    // Update services
    const servicesContainer = document.getElementById('lead-services-list');
    if (conversation.services && conversation.services.length > 0) {
        servicesContainer.innerHTML = conversation.services
            .slice(0, 3)
            .map(service => `<span class="lead-service-tag">${service}</span>`)
            .join('');
    } else {
        servicesContainer.innerHTML = '<span style="color: var(--text-tertiary);">No services listed</span>';
    }
    
    // Setup action buttons
    const hireBtn = document.getElementById('lead-action-hire');
    const detailsBtn = document.getElementById('lead-action-details');
    
    // Disable hire button if already hired
    if (conversation.status === 'hired') {
        hireBtn.textContent = '✓ Hired';
        hireBtn.disabled = true;
        hireBtn.style.opacity = '0.6';
    } else {
        hireBtn.textContent = 'Hire Client';
        hireBtn.disabled = false;
        hireBtn.style.opacity = '1';
    }
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
