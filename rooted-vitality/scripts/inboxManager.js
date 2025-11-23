/**
 * Practitioner Inbox Manager
 * Handles message threads, filtering, and UI interactions
 */

// Modal state for block/unblock actions
let pendingBlockClient = null;
let pendingUnblockClient = null;

/**
 * Show block confirmation modal
 */
function showBlockModal(clientName, clientSerial, practitionerId) {
    pendingBlockClient = { clientName, clientSerial, practitionerId };
    document.getElementById('block-client-name').textContent = clientName;
    document.getElementById('block-modal-overlay').classList.add('show');
}

/**
 * Close block modal
 */
function closeBlockModal() {
    pendingBlockClient = null;
    document.getElementById('block-modal-overlay').classList.remove('show');
}

/**
 * Confirm block action from modal
 */
async function confirmBlock() {
    if (!pendingBlockClient) return;
    
    const { clientName, clientSerial, practitionerId } = pendingBlockClient;
    closeBlockModal();
    
    try {
        console.log(`[Inbox] BLOCK INITIATED - Client: ${clientName}, Serial: ${clientSerial}`);
        
        // Check if block record exists
        const { data: existingBlock } = await window.supabaseClient
            .from('practitioner_blocks')
            .select('id')
            .eq('practitioner_serial', practitionerId)
            .eq('client_serial', clientSerial);
        
        if (existingBlock && existingBlock.length > 0) {
            // Update existing block record
            const { error: blockError } = await window.supabaseClient
                .from('practitioner_blocks')
                .update({ is_blocked: true })
                .eq('practitioner_serial', practitionerId)
                .eq('client_serial', clientSerial);
            
            if (blockError) throw blockError;
        } else {
            // Create new block record
            const { error: blockError } = await window.supabaseClient
                .from('practitioner_blocks')
                .insert([{
                    practitioner_serial: practitionerId,
                    client_serial: clientSerial,
                    is_blocked: true
                }]);
            
            if (blockError) throw blockError;
        }
        
        console.log(`[Inbox] BLOCK SUCCESSFUL - Client: ${clientName}`);
        
        // Notify client of decline (hiding that they were blocked)
        if (window.notifyClientOfMatchResponse) {
            await notifyClientOfMatchResponse({
                clientSerial: clientSerial,
                practitionerName: 'A practitioner',
                projectName: 'your project',
                action: 'declined',
                reason: 'Not available at this time'
            });
        }
        
        // Show success and reload
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:1.5rem;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.15);z-index:3000;text-align:center;`;
        modal.innerHTML = `<p style="margin:0;color:#2e2b28;font-weight:600;">${clientName} has been blocked</p>`;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.remove();
            console.log(`[Inbox] Reloading conversations after block...`);
            loadConversations();
            renderThreadsList();
            closeThreadView();
        }, 1500);
    } catch (error) {
        console.error('[Inbox] Error blocking client:', error);
        alert('Error blocking client');
    }
}

/**
 * Show unblock confirmation modal
 */
function showUnblockModal(clientName, clientSerial, practitionerId) {
    pendingUnblockClient = { clientName, clientSerial, practitionerId };
    document.getElementById('unblock-client-name').textContent = clientName;
    document.getElementById('unblock-modal-overlay').classList.add('show');
}

/**
 * Close unblock modal
 */
function closeUnblockModal() {
    pendingUnblockClient = null;
    document.getElementById('unblock-modal-overlay').classList.remove('show');
}

/**
 * Confirm unblock action from modal
 */
async function confirmUnblock() {
    if (!pendingUnblockClient) return;
    
    const { clientName, clientSerial, practitionerId } = pendingUnblockClient;
    closeUnblockModal();
    
    try {
        console.log(`[Inbox] UNBLOCK INITIATED - Client: ${clientName}, Serial: ${clientSerial}`);
        
        // Update practitioner_blocks to unblock (set is_blocked: false)
        const { error: unblockError } = await window.supabaseClient
            .from('practitioner_blocks')
            .update({ is_blocked: false })
            .eq('practitioner_serial', practitionerId)
            .eq('client_serial', clientSerial);
        
        if (unblockError) throw unblockError;
        
        console.log(`[Inbox] UNBLOCK SUCCESSFUL - Client: ${clientName}`);
        
        // Show success and reload
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:1.5rem;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.15);z-index:3000;text-align:center;`;
        modal.innerHTML = `<p style="margin:0;color:#2e2b28;font-weight:600;">${clientName} has been unblocked</p>`;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.remove();
            console.log(`[Inbox] Calling loadConversations() after unblock...`);
            loadConversations();
            console.log(`[Inbox] loadConversations() completed, calling renderThreadsList() with filter: ${currentFilter}...`);
            renderThreadsList();
            closeThreadView();
        }, 1500);
    } catch (error) {
        console.error('[Inbox] Error unblocking client:', error);
        alert('Error unblocking client');
    }
}

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
        
        // Check for auto-open parameter (e.g., from accept match flow)
        const urlParams = new URLSearchParams(window.location.search);
        const clientSerialToOpen = urlParams.get('clientSerial');
        if (clientSerialToOpen) {
            console.log('[Inbox] Auto-open requested for clientSerial:', clientSerialToOpen);
            console.log('[Inbox] Available conversations:', conversations.map(c => c.clientSerial));
            
            // Try to find and open the conversation with retries
            let retryCount = 0;
            const maxRetries = 5;
            
            const tryAutoOpen = () => {
                const conversation = conversations.find(c => c.clientSerial === clientSerialToOpen);
                if (conversation) {
                    console.log('[Inbox] Found conversation for auto-open, opening now');
                    const threadItem = document.querySelector(`.thread-item[data-client-serial="${clientSerialToOpen}"]`);
                    if (threadItem) {
                        threadItem.click();
                        console.log('[Inbox] Auto-opened conversation');
                    } else {
                        console.log('[Inbox] Thread item found but DOM element not ready yet, retrying...');
                        if (retryCount < maxRetries) {
                            retryCount++;
                            setTimeout(tryAutoOpen, 500);
                        }
                    }
                } else {
                    console.log('[Inbox] Conversation not found yet, retrying... Attempt', retryCount + 1);
                    if (retryCount < maxRetries) {
                        retryCount++;
                        // Reload conversations and try again
                        loadConversations().then(() => {
                            setTimeout(tryAutoOpen, 500);
                        });
                    } else {
                        console.log('[Inbox] Max retries reached, giving up on auto-open');
                    }
                }
            };
            
            // Start trying after a brief delay
            setTimeout(tryAutoOpen, 500);
        }
        
        // Set up real-time subscription for new accepted matches
        const rvUserStr = localStorage.getItem('rvUser');
        if (rvUserStr) {
            const rvUser = JSON.parse(rvUserStr);
            const practitionerSerial = currentUser?.serial_number;
            
            if (practitionerSerial) {
                console.log('[Inbox] Setting up real-time subscription for accepted matches');
                window.supabaseClient
                    .channel(`accepted-matches:${practitionerSerial}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'project_practitioner_matches',
                        filter: `practitioner_serial=eq.${practitionerSerial}`,
                    }, (payload) => {
                        console.log('[Inbox] Match update received:', payload);
                        if ((payload.new.status === 'in-progress' || payload.new.status === 'active') && payload.old.status === 'pending') {
                            console.log('[Inbox] New accepted match detected! Reloading conversations...');
                            loadConversations().then(() => {
                                renderThreadsList();
                                updateBadges();
                            });
                        }
                    })
                    .subscribe((status) => {
                        console.log('[Inbox] Real-time subscription status:', status);
                    });
            }
        }
        
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
    
    // Only setup if the element exists (legacy 2-column layout)
    if (!backBtn) {
        console.log('[Inbox] Back button not found (3-column layout), skipping');
        return;
    }
    
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
        console.log('[Inbox] ===== LOAD CONVERSATIONS STARTED =====');
        
        // Get practitioner ID and serial number
        const rvUserStr = localStorage.getItem('rvUser');
        if (!rvUserStr) {
            console.error('[Inbox] No rvUser in localStorage');
            return;
        }

        const rvUser = JSON.parse(rvUserStr);
        const practitionerId = rvUser.id; // UUID
        
        // Get practitioner serial number
        const { data: practitioner, error: practitionerError } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number')
            .eq('id', practitionerId)
            .single();

        if (practitionerError || !practitioner) {
            console.error('[Inbox] Error loading practitioner serial:', practitionerError);
            return;
        }

        const practitionerSerial = practitioner.serial_number;
        console.log('[Inbox] Loading conversations for practitioner:', practitionerSerial);

        conversations = [];

        // ===== LOAD ACCEPTED MATCHES (Messages Tab) =====
        const { data: acceptedMatches, error: acceptedError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, project_serial, status, created_at')
            .eq('practitioner_serial', practitionerSerial)
            .in('status', ['active', 'in-progress', 'hired']);

        if (acceptedError) {
            console.error('[Inbox] Error loading accepted matches:', acceptedError);
            return;
        }

        console.log('[Inbox] Loaded accepted matches:', acceptedMatches?.length);

        // Process accepted matches
        for (const match of acceptedMatches || []) {
            try {
                // Get project details
                const { data: project, error: projectError } = await window.supabaseClient
                    .from('projects')
                    .select('id, description, category_name, client_serial, zipcode, travel_preference')
                    .eq('project_serial', match.project_serial)
                    .single();

                if (projectError || !project) {
                    console.warn('[Inbox] Could not load project:', match.project_serial);
                    continue;
                }

                // Get client details
                const { data: client, error: clientError } = await window.supabaseClient
                    .from('clients')
                    .select('id, first_name, last_name, profile_picture_url')
                    .eq('serial_number', project.client_serial)
                    .single();

                if (clientError || !client) {
                    console.warn('[Inbox] Could not load client for project:', match.project_serial);
                    continue;
                }

                const clientName = `${client.first_name || 'Client'} ${client.last_name || ''}`;
                const initials = `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase();
                const clientAvatarUrl = client.profile_picture_url 
                    ? client.profile_picture_url 
                    : generateInitialsAvatar(clientName);

                // Get latest messages (reversed because they come in descending order)
                const { data: messages } = await window.supabaseClient
                    .from('project_messages')
                    .select('id, message, sender_type, created_at')
                    .eq('project_serial', match.project_serial)
                    .eq('practitioner_serial', practitionerSerial)
                        .order('created_at', { ascending: false })
                    .limit(50);

                const lastMessage = messages?.[0];
                const unreadCount = messages?.filter(m => !m.is_read && m.sender_type === 'client').length || 0;

                conversations.push({
                    id: match.id,
                    matchId: match.id,
                    projectId: project.id,  // Use project.id (UUID), not match.project_id
                    projectSerial: match.project_serial,
                    clientId: client.id,
                    clientSerial: project.client_serial,
                    practitionerId: currentUser.id,  // Use actual practitioner UUID
                    practitionerSerial: practitionerSerial,
                    clientName: clientName,
                    clientAvatar: clientAvatarUrl,
                    lastMessage: lastMessage?.message || 'No messages yet',
                    lastMessageTime: lastMessage?.created_at ? new Date(lastMessage.created_at) : new Date(match.created_at),
                    isUnread: unreadCount > 0,
                    unreadCount: unreadCount,
                    status: 'online',
                    category: 'all',
                    messages: messages ? [...messages].reverse() : [],  // Reverse to show oldest first
                    isArchived: false,
                    isBlocked: false,
                    projectDescription: project.description,
                    projectCategory: project.category_name,
                    projectZipcode: project.zipcode,
                    projectTravelPreferences: project.travel_preferences,
                    isBlocked: false
                });
            } catch (itemError) {
                console.error('[Inbox] Error processing match:', itemError);
                continue;
            }
        }

        // ===== LOAD DECLINED MATCHES (Archive Tab) =====
        const { data: declinedMatches, error: declinedError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, project_serial, status, created_at')
            .eq('practitioner_serial', practitionerSerial)
            .eq('status', 'declined');

        if (declinedError) {
            console.error('[Inbox] Error loading declined matches:', declinedError);
        }

        console.log('[Inbox] Loaded declined matches:', declinedMatches?.length);

        // Process declined matches
        for (const match of declinedMatches || []) {
            try {
                // Get project details
                const { data: project, error: projectError } = await window.supabaseClient
                    .from('projects')
                    .select('id, description, category_name, client_serial, zipcode, travel_preference')
                    .eq('project_serial', match.project_serial)
                    .single();

                if (projectError || !project) continue;

                // Get client details
                const { data: client, error: clientError } = await window.supabaseClient
                    .from('clients')
                    .select('id, first_name, last_name, profile_picture_url')
                    .eq('serial_number', project.client_serial)
                    .single();

                if (clientError || !client) continue;

                const clientName = `${client.first_name || 'Client'} ${client.last_name || ''}`;
                const clientAvatarUrl = client.profile_picture_url 
                    ? client.profile_picture_url 
                    : generateInitialsAvatar(clientName);

                // Check if this client is blocked
                const { data: blockRecords, error: blockError } = await window.supabaseClient
                    .from('practitioner_blocks')
                    .select('id, is_blocked')
                    .eq('practitioner_serial', practitionerSerial)
                    .eq('client_serial', project.client_serial);

                // A client is blocked if they have a block record with is_blocked = true
                const isBlocked = blockRecords && blockRecords.length > 0 && blockRecords[0].is_blocked === true;
                console.log(`[Inbox] Processing declined match - Client: ${clientName}, BlockRecords: ${blockRecords?.length}, isBlocked: ${isBlocked}`);

                conversations.push({
                    id: match.id,
                    matchId: match.id,
                    projectId: match.project_id,
                    clientId: client.id,
                    clientSerial: project.client_serial,
                    practitionerId: practitionerSerial,
                    clientName: clientName,
                    clientAvatar: clientAvatarUrl,
                    lastMessage: isBlocked ? 'Blocked' : 'Declined',
                    lastMessageTime: new Date(match.created_at),
                    isUnread: false,
                    unreadCount: 0,
                    status: isBlocked ? 'blocked' : 'archived',
                    category: 'archive',
                    messages: [],
                    isArchived: true,
                    isBlocked: isBlocked,
                    projectDescription: project.description,
                    projectCategory: project.category_name,
                    projectZipcode: project.zipcode,
                    projectTravelPreferences: project.travel_preference
                });
            } catch (itemError) {
                console.error('[Inbox] Error processing declined match:', itemError);
                continue;
            }
        }

        // ===== LOAD BLOCKED MATCHES BY STATUS (Archive Tab) =====
        // (No longer needed - blocked clients tracked via practitioner_blocks)
        // Keeping this commented for reference, but we now detect blocks via practitioner_blocks table lookup above

        console.log(`[Inbox] Loaded ${conversations.length} conversations (${conversations.filter(c => c.category === 'all').length} accepted, ${conversations.filter(c => c.category === 'archive' && !c.isBlocked).length} declined, ${conversations.filter(c => c.isBlocked).length} blocked)`);
        console.log('[Inbox] ===== LOAD CONVERSATIONS COMPLETED =====');
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
    
    console.log(`[Inbox Render] Total conversations: ${conversations.length}, Current filter: ${currentFilter}`);
    
    // Filter conversations
    let filtered = conversations.filter(conv => {
        // Filter by category - 'all' means only accepted (not archived/blocked)
        if (currentFilter === 'all' && conv.category !== 'all') return false;
        if (currentFilter === 'unread' && !conv.isUnread) return false;
        if (currentFilter === 'hired' && conv.category !== 'hired') return false;
        if (currentFilter === 'archive' && conv.category !== 'archive') return false;
        
        // Filter by search query
        if (searchQuery && !conv.clientName.toLowerCase().includes(searchQuery)) return false;
        
        return true;
    });
    
    console.log(`[Inbox Render] Filtered conversations: ${filtered.length}`);
    
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
    item.setAttribute('data-client-serial', conversation.clientSerial);
    
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
            <div style="display: flex; gap: 4px; align-items: center;">
                <div class="thread-status-badge ${conversation.status === 'online' ? 'online' : conversation.status === 'away' ? 'away' : ''}"></div>
            </div>
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
    const threadStatusEl = document.getElementById('thread-status');
    threadStatusEl.textContent = 
        conversation.isBlocked ? 'Blocked' :
        conversation.isArchived ? 'Declined' :
        conversation.status === 'online' ? '● Online' : 
        conversation.status === 'away' ? '◐ Away' : 
        'Offline';
    
    // Update status color based on online status
    threadStatusEl.classList.remove('status-online', 'status-away', 'status-offline', 'status-blocked', 'status-declined');
    if (conversation.isBlocked) {
        threadStatusEl.classList.add('status-blocked');
    } else if (conversation.isArchived) {
        threadStatusEl.classList.add('status-declined');
    } else if (conversation.status === 'online') {
        threadStatusEl.classList.add('status-online');
    } else if (conversation.status === 'away') {
        threadStatusEl.classList.add('status-away');
    } else {
        threadStatusEl.classList.add('status-offline');
    }
    
    // Update lead details hero
    populateLeadDetailsHero(conversation);
    
    // Render messages
    renderMessages(conversation.messages);
    
    // Set up real-time subscription for new messages
    setupConversationRealtimeSubscription(conversation);
    
    // Enable message input and set up send handler
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    
    if (messageInput) {
        // Disable messaging for archived and blocked conversations
        if (conversation.isArchived || conversation.isBlocked) {
            messageInput.disabled = true;
            messageInput.placeholder = conversation.isBlocked ? 'This client is blocked' : 'This conversation is archived';
        } else {
            messageInput.disabled = false;
            messageInput.placeholder = `Message ${conversation.clientName}...`;
        }
    }
    
    if (sendBtn) {
        // Disable send button for archived and blocked conversations
        if (conversation.isArchived || conversation.isBlocked) {
            sendBtn.disabled = true;
        } else {
            sendBtn.disabled = false;
        }
        
        // Remove old listeners by cloning
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        // Add new listener
        newSendBtn.addEventListener('click', async () => {
            const message = messageInput.value.trim();
            if (!message) return;
            
            try {
                console.log('[Inbox] Sending message with:', {
                    project_id: conversation.projectId,
                    practitioner_id: conversation.practitionerId,
                    client_id: conversation.clientId,
                    sender_id: currentUser.id,
                    sender_type: 'practitioner',
                    project_serial: conversation.projectSerial,
                    practitioner_serial: conversation.practitionerSerial,
                    client_serial: conversation.clientSerial
                });
                
                const { error } = await window.supabaseClient
                    .from('project_messages')
                    .insert({
                        project_id: conversation.projectId,
                        practitioner_id: conversation.practitionerId,
                        client_id: conversation.clientId,
                        sender_id: currentUser.id,
                        sender_type: 'practitioner',
                        message: message,
                        is_read: false,
                        project_serial: conversation.projectSerial,
                        practitioner_serial: conversation.practitionerSerial,
                        client_serial: conversation.clientSerial
                    });
                
                if (!error) {
                    console.log('[Inbox] Message sent successfully');
                    
                    // Add message to local conversation immediately
                    conversation.messages.push({
                        sender_type: 'practitioner',
                        message: message,
                        created_at: new Date().toISOString()
                    });
                    
                    // Re-render messages in thread
                    renderMessages(conversation.messages);
                    
                    // Clear input
                    messageInput.value = '';
                    messageInput.focus();
                } else {
                    console.error('[Inbox] Error sending message:', error);
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
    
    // Update lead status
    const leadStatus = document.getElementById('lead-status');
    if (leadStatus) {
        if (conversation.isBlocked) {
            leadStatus.textContent = 'Blocked';
            leadStatus.style.color = '#d32f2f';
        } else if (conversation.isArchived) {
            leadStatus.textContent = 'Declined';
            leadStatus.style.color = 'var(--text-tertiary)';
        } else if (conversation.status === 'hired') {
            leadStatus.textContent = '✓ Hired';
            leadStatus.style.color = 'var(--primary)';
        } else {
            leadStatus.textContent = 'Interested in services';
            leadStatus.style.color = 'var(--text-secondary)';
        }
    }
    
    // Update services - show project category for archived (if element exists)
    const servicesContainer = document.getElementById('lead-services-list');
    if (servicesContainer) {
        if (conversation.isArchived || conversation.isBlocked) {
            if (conversation.projectCategory) {
                servicesContainer.innerHTML = `<span class="lead-service-tag">${conversation.projectCategory}</span>`;
            } else {
                servicesContainer.innerHTML = '<span style="color: var(--text-tertiary);">No category listed</span>';
            }
        } else if (conversation.services && conversation.services.length > 0) {
            servicesContainer.innerHTML = conversation.services
                .slice(0, 3)
                .map(service => `<span class="lead-service-tag">${service}</span>`)
                .join('');
        } else {
            servicesContainer.innerHTML = '<span style="color: var(--text-tertiary);">No services listed</span>';
        }
    }
    
    // Setup action buttons
    const hireBtn = document.getElementById('lead-action-hire');
    const detailsBtn = document.getElementById('lead-action-details');
    
    // Populate project details section (for all conversations)
    populateProjectDetails(conversation);
    
    // For archived/blocked conversations, show project description instead of buttons
    if (conversation.isArchived || conversation.isBlocked) {
        // Hide or repurpose the button container to show project description
        const heroActions = document.querySelector('.lead-hero-actions');
        
        if (heroActions) {
            // Clear existing buttons
            heroActions.innerHTML = '';
            
            // Add unblock button for blocked clients only
            if (conversation.isBlocked) {
                const unblocBtn = document.createElement('button');
                unblocBtn.className = 'lead-action-btn lead-action-primary';
                unblocBtn.textContent = 'Unblock';
                unblocBtn.style.cssText = `
                    flex-shrink: 0;
                    white-space: nowrap;
                    padding: 8px 16px;
                    font-size: 0.85rem;
                `;
                heroActions.appendChild(unblocBtn);
                
                unblocBtn.addEventListener('click', async () => {
                    showUnblockModal(conversation.clientName, conversation.clientSerial, conversation.practitionerId);
                });
            } else {
                // For declined (not blocked) clients, show block button
                const blockBtn = document.createElement('button');
                blockBtn.className = 'lead-action-btn';
                blockBtn.textContent = 'Block';
                blockBtn.style.cssText = `
                    flex-shrink: 0;
                    white-space: nowrap;
                    padding: 8px 16px;
                    font-size: 0.85rem;
                    background: #f3f1ec;
                    color: #5a5a5a;
                    border: 1px solid #ddd9d0;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                heroActions.appendChild(blockBtn);
                
                blockBtn.addEventListener('click', async () => {
                    showBlockModal(conversation.clientName, conversation.clientSerial, conversation.practitionerId);
                });
                
                blockBtn.addEventListener('mouseover', () => {
                    blockBtn.style.background = '#ddd9d0';
                });
                
                blockBtn.addEventListener('mouseout', () => {
                    blockBtn.style.background = '#f3f1ec';
                });
            }
        }
    } else if (conversation.status === 'hired') {
        if (hireBtn) {
            hireBtn.textContent = '✓ Hired';
            hireBtn.disabled = true;
            hireBtn.style.opacity = '0.6';
        }
        if (detailsBtn) {
            detailsBtn.style.display = 'none';
        }
    } else {
        if (hireBtn) {
            hireBtn.textContent = 'Hire Client';
            hireBtn.disabled = false;
            hireBtn.style.opacity = '1';
        }
        if (detailsBtn) {
            detailsBtn.style.display = 'block';
        }
    }
}

/**
 * Populate project details section with categories, location, travel, and description
 */
function populateProjectDetails(conversation) {
    // Categories
    const categoriesEl = document.getElementById('project-categories');
    if (categoriesEl) {
        if (conversation.projectCategory) {
            const categories = conversation.projectCategory.split(',').map(c => c.trim()).filter(c => c);
            if (categories.length > 0) {
                categoriesEl.innerHTML = categories
                    .map(cat => `<span class="category-tag">${escapeHtml(cat)}</span>`)
                    .join('');
            } else {
                categoriesEl.innerHTML = '<span class="detail-text" style="color: var(--text-tertiary);">Not specified</span>';
            }
        } else {
            categoriesEl.innerHTML = '<span class="detail-text" style="color: var(--text-tertiary);">Not specified</span>';
        }
    }
    
    // Location (zipcode)
    const locationEl = document.getElementById('project-location');
    if (locationEl) {
        if (conversation.projectZipcode) {
            locationEl.innerHTML = `<span class="detail-text">${escapeHtml(conversation.projectZipcode)}</span>`;
        } else {
            locationEl.innerHTML = '<span class="detail-text" style="color: var(--text-tertiary);">Not specified</span>';
        }
    }
    
    // Travel preferences
    const travelEl = document.getElementById('project-travel');
    if (travelEl) {
        if (conversation.projectTravelPreferences) {
            const travel = conversation.projectTravelPreferences.split(',').map(t => t.trim()).filter(t => t);
            if (travel.length > 0) {
                travelEl.innerHTML = travel
                    .map(pref => `<span class="category-tag">${escapeHtml(pref)}</span>`)
                    .join('');
            } else {
                travelEl.innerHTML = '<span class="detail-text" style="color: var(--text-tertiary);">Not specified</span>';
            }
        } else {
            travelEl.innerHTML = '<span class="detail-text" style="color: var(--text-tertiary);">Not specified</span>';
        }
    }
    
    // Project description
    const descEl = document.getElementById('project-description');
    if (descEl) {
        if (conversation.projectDescription) {
            descEl.innerHTML = `<span class="detail-text long-text">${escapeHtml(conversation.projectDescription)}</span>`;
        } else {
            descEl.innerHTML = '<span class="detail-text" style="color: var(--text-tertiary);">No description provided</span>';
        }
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
 * Set up real-time subscription for conversation messages
 */
function setupConversationRealtimeSubscription(conversation) {
    if (!window.supabaseClient || !conversation.projectId) {
        console.error('[Inbox] Cannot set up real-time subscription - missing client or project ID');
        return;
    }

    // Unsubscribe from previous subscription if exists
    if (conversation._realtimeSubscription) {
        window.supabaseClient.removeChannel(conversation._realtimeSubscription);
    }

    // Subscribe to new messages for this project
    conversation._realtimeSubscription = window.supabaseClient
        .channel(`project_messages_${conversation.projectId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'project_messages',
                filter: `project_id=eq.${conversation.projectId}`
            },
            (payload) => {
                console.log('[Inbox] New message received via real-time:', payload.new);
                
                // Add new message to conversation
                if (!conversation.messages) {
                    conversation.messages = [];
                }
                
                conversation.messages.push({
                    id: payload.new.id,
                    sender_type: payload.new.sender_type,
                    message: payload.new.message,
                    created_at: payload.new.created_at,
                    is_read: payload.new.is_read
                });
                
                // Re-render messages immediately
                renderMessages(conversation.messages);
                
                // Scroll to bottom to show new message
                const messagesContainer = document.getElementById('messages-container');
                if (messagesContainer) {
                    setTimeout(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 50);
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('[Inbox] Real-time subscription active for project:', conversation.projectId);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                console.warn('[Inbox] Real-time subscription error, will rely on polling');
            }
        });
}

/**
 * Render messages in the thread
 */
function renderMessages(messages) {
    const messagesContainer = document.getElementById('thread-messages');
    if (!messagesContainer) return;
    
    // Get client name for display
    const clientName = document.getElementById('thread-name')?.textContent || 'Client';
    
    // Use unified messaging renderer
    renderUnifiedMessages(
        messages,
        'thread-messages',
        'practitioner',
        {
            name: clientName,
            avatar: document.getElementById('thread-avatar')?.src || null
        }
    );
}

/**
 * Update badge counts
 */
function updateBadges() {
    const allCount = conversations.filter(c => c.category === 'all').length;
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
