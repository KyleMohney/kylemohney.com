/**
 * Practitioner Inbox Manager
 * Handles message threads, filtering, and UI interactions
 */

// Modal state for block/unblock actions
let pendingBlockClient = null;
let pendingUnblockClient = null;
let currentOpenConversation = null; // Track currently open conversation for polling cleanup

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
        setupFilterListeners();
        setupThreadCloseListener();
        setupBackButtonListener();
        
        // Load conversations
        await loadConversations();
        
        // Render initial UI
        renderThreadsList();
        updateBadges();
        
        // Check for tab parameter in URL (e.g., from decline flow)
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['all', 'unread', 'hired', 'archive'].includes(tabParam)) {
            console.log('[Inbox] Setting initial tab from URL:', tabParam);
            currentFilter = tabParam;
            
            // Update active tab UI
            document.querySelectorAll('.sidebar-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.getAttribute('data-tab') === tabParam) {
                    tab.classList.add('active');
                }
            });
            
            renderThreadsList();
        }
        
        // Check for auto-open parameter (e.g., from accept/decline match flow)
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
        
        // Setup listener for match status changes from client side
        setupMatchStatusChangeListener();
        
        console.log('[Rooted Vitality] Inbox initialized successfully');
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing inbox:', error);
    }
});

/**
 * Setup navigation filter buttons
 */
function setupNavigationListeners() {
    const navItems = document.querySelectorAll('.sidebar-tab');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.sidebar-tab').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update filter and re-render
            currentFilter = item.getAttribute('data-tab');
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
 * Setup filter functionality
 */
function setupFilterListeners() {
    const categoryFilter = document.getElementById('filter-category');
    const serviceFilter = document.getElementById('filter-service');
    const clearBtn = document.getElementById('btn-clear-filters');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            applyFilters();
        });
    }
    
    if (serviceFilter) {
        serviceFilter.addEventListener('change', () => {
            applyFilters();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (categoryFilter) categoryFilter.value = '';
            if (serviceFilter) serviceFilter.value = '';
            applyFilters();
        });
    }
}

/**
 * Apply category and service type filters
 */
function applyFilters() {
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const serviceFilter = document.getElementById('filter-service')?.value || '';
    
    console.log('[Inbox] Applying filters - Category:', categoryFilter, 'Service:', serviceFilter);
    
    // Filter conversations based on selected criteria
    let filtered = [...conversations];
    
    if (categoryFilter) {
        filtered = filtered.filter(conv => {
            // Match conversation's category with filter
            return conv.category && conv.category.toLowerCase() === categoryFilter.toLowerCase();
        });
    }
    
    if (serviceFilter) {
        filtered = filtered.filter(conv => {
            // Match conversation's service type with filter
            return conv.serviceType && conv.serviceType.toLowerCase() === serviceFilter.toLowerCase();
        });
    }
    
    // Store filtered results and re-render
    window.filteredConversations = filtered;
    renderThreadsList();
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
        // Query for ALL accepted statuses including hired/not-hired so we can categorize them properly
        const { data: acceptedMatches, error: acceptedError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, project_serial, status, created_at')
            .eq('practitioner_serial', practitionerSerial)
            .in('status', ['active', 'in-progress', 'hired', 'not-hired']);

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
                    .select('id, message, sender_type, created_at, is_read')
                    .eq('project_serial', match.project_serial)
                    .eq('practitioner_serial', practitionerSerial)
                        .order('created_at', { ascending: false })
                    .limit(50);

                const lastMessage = messages?.[0];
                const unreadCount = messages?.filter(m => !m.is_read && m.sender_type === 'client').length || 0;

                // Determine category based on match status
                let category = 'all';
                let isArchived = false;
                if (match.status === 'hired') {
                    category = 'hired';
                    isArchived = true;
                } else if (match.status === 'not-hired') {
                    category = 'archive';
                    isArchived = true;
                }

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
                    category: category,
                    messages: messages ? [...messages].reverse() : [],  // Reverse to show oldest first
                    isArchived: isArchived,
                    isBlocked: false,
                    projectDescription: project.description,
                    projectCategory: project.category_name,
                    projectZipcode: project.zipcode,
                    projectTravelPreferences: project.travel_preference,
                    matchStatus: match.status
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
    
    // Use filtered conversations if they exist (from category/service filters), otherwise use all
    let baseConversations = window.filteredConversations || conversations;
    
    // Filter conversations
    let filtered = baseConversations.filter(conv => {
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
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">
            <div class="thread-avatar-small">
                <img src="${conversation.clientAvatar}" alt="${conversation.clientName}">
            </div>
            <p class="thread-name">${conversation.clientName}</p>
            <div class="thread-status-badge ${conversation.status === 'online' ? 'online' : conversation.status === 'away' ? 'away' : ''}"></div>
            <span class="thread-time" style="margin-left: auto;">${formatTime(conversation.lastMessageTime)}</span>
            <div class="thread-menu-wrapper" style="position: relative;">
                <button class="thread-menu-btn" title="Options" data-thread-id="${conversation.id}">⋮</button>
                <div class="thread-menu-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid var(--border-light); border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 100; min-width: 140px;">
                    <button class="thread-menu-item archive-option" style="width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; font-size: 0.9rem; color: var(--text-primary); border-bottom: 1px solid var(--border-light);">Archive</button>
                    <button class="thread-menu-item block-option" style="width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; font-size: 0.9rem; color: var(--text-primary);">Block</button>
                </div>
            </div>
        </div>
        <div class="thread-meta">
            <!-- Project Details in Middle Column -->
            <div class="thread-project-details">
                <div class="project-detail-row">
                    <div class="project-detail-item">
                        <span class="detail-label">Services Needed</span>
                        <span class="detail-value" id="thread-services-${conversation.clientSerial}">-</span>
                    </div>
                    <div class="project-detail-item">
                        <span class="detail-label">Location</span>
                        <span class="detail-value" id="thread-location-${conversation.clientSerial}">-</span>
                    </div>
                    <div class="project-detail-item">
                        <span class="detail-label">Travel Preferences</span>
                        <span class="detail-value" id="thread-travel-${conversation.clientSerial}">-</span>
                    </div>
                </div>
                <div class="project-detail-item">
                    <span class="detail-label">Project Description</span>
                    <span class="detail-value" id="thread-description-${conversation.clientSerial}">-</span>
                </div>
            </div>
        </div>
    `;
    
    // Populate project details in the thread item
    const servicesElement = item.querySelector(`#thread-services-${conversation.clientSerial}`);
    const locationElement = item.querySelector(`#thread-location-${conversation.clientSerial}`);
    const travelElement = item.querySelector(`#thread-travel-${conversation.clientSerial}`);
    const descriptionElement = item.querySelector(`#thread-description-${conversation.clientSerial}`);
    
    if (servicesElement && conversation.projectCategory) {
        servicesElement.textContent = conversation.projectCategory;
    }
    
    if (locationElement && conversation.projectZipcode) {
        locationElement.textContent = conversation.projectZipcode;
    }
    
    if (travelElement && conversation.projectTravelPreferences) {
        travelElement.textContent = conversation.projectTravelPreferences;
    }
    
    if (descriptionElement && conversation.projectDescription) {
        descriptionElement.textContent = conversation.projectDescription;
    }
    
    // Add menu button handler
    const menuBtn = item.querySelector('.thread-menu-btn');
    const menuDropdown = item.querySelector('.thread-menu-dropdown');
    const archiveOption = item.querySelector('.archive-option');
    const blockOption = item.querySelector('.block-option');
    
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = menuDropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', () => {
            menuDropdown.style.display = 'none';
        });
    }
    
    if (archiveOption) {
        archiveOption.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = 'none';
            archiveConversation(conversation);
        });
    }
    
    if (blockOption) {
        blockOption.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = 'none';
            blockConversation(conversation);
        });
    }
    
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
    // Stop polling from previous conversation if one was open
    if (currentOpenConversation && currentOpenConversation._pollingInterval) {
        clearInterval(currentOpenConversation._pollingInterval);
        console.log('[Inbox] Stopped polling for previous conversation');
    }

    // Track current open conversation
    currentOpenConversation = conversation;

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
    
    // Mark unread client messages as read when opening thread
    if (conversation.messages && conversation.messages.length > 0) {
        const unreadClientMessageIds = conversation.messages
            .filter(m => !m.is_read && m.sender_type === 'client')
            .map(m => m.id);
        
        if (unreadClientMessageIds.length > 0) {
            // Mark messages as read in database
            window.supabaseClient
                .from('project_messages')
                .update({ is_read: true })
                .in('id', unreadClientMessageIds)
                .then(() => {
                    console.log('[Inbox] Marked', unreadClientMessageIds.length, 'messages as read');
                    
                    // Update local conversation object
                    conversation.messages.forEach(m => {
                        if (unreadClientMessageIds.includes(m.id)) {
                            m.is_read = true;
                        }
                    });
                    
                    // Recalculate unread count and update badges
                    const updatedUnreadCount = conversation.messages.filter(m => !m.is_read && m.sender_type === 'client').length;
                    conversation.isUnread = updatedUnreadCount > 0;
                    conversation.unreadCount = updatedUnreadCount;
                    updateBadges();
                    renderThreadsList();
                })
                .catch(error => console.error('[Inbox] Error marking messages as read:', error));
        }
    }
    
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
    
    // Set up profile link handler
    const threadHeaderLink = document.getElementById('thread-header-link');
    const clientProfileUrl = `/rooted-vitality/dashboard/pro/pages/client-profile.html?client_serial=${conversation.clientSerial}`;
    
    if (threadHeaderLink) {
        threadHeaderLink.href = clientProfileUrl;
        threadHeaderLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = clientProfileUrl;
        };
    }
    
    // Show thread view
    threadView.style.display = 'flex';
}

/**
 * Populate the lead details hero section with client information
 */
function populateLeadDetailsHero(conversation) {
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
    // Stop polling when closing thread
    if (currentOpenConversation && currentOpenConversation._pollingInterval) {
        clearInterval(currentOpenConversation._pollingInterval);
        console.log('[Inbox] Stopped polling for closed conversation');
    }
    
    currentOpenConversation = null;

    const emptyState = document.getElementById('empty-state');
    const threadView = document.getElementById('conversation-thread');
    
    threadView.style.display = 'none';
    emptyState.style.display = 'flex';
}

/**
 * Archive/decline a conversation
 */
async function archiveConversation(conversation) {
    try {
        // Update the match status to 'declined'
        const { error } = await window.supabaseClient
            .from('matches')
            .update({ status: 'declined' })
            .eq('id', conversation.matchId);
        
        if (error) {
            console.error('[Inbox] Error archiving conversation:', error);
            alert('Failed to archive conversation');
            return;
        }
        
        // Remove from conversations list and close thread view
        conversations = conversations.filter(c => c.id !== conversation.id);
        closeThreadView();
        
        // Reload conversations to update UI
        loadConversations();
    } catch (error) {
        console.error('[Inbox] Exception archiving conversation:', error);
        alert('Error archiving conversation');
    }
}

/**
 * Block a client conversation
 */
async function blockConversation(conversation) {
    try {
        // Update the match status to 'declined' and mark as blocked
        const { error } = await window.supabaseClient
            .from('matches')
            .update({ status: 'declined', is_blocked: true })
            .eq('id', conversation.matchId);
        
        if (error) {
            console.error('[Inbox] Error blocking conversation:', error);
            alert('Failed to block client');
            return;
        }
        
        // Remove from conversations list and close thread view
        conversations = conversations.filter(c => c.id !== conversation.id);
        closeThreadView();
        
        // Reload conversations to update UI
        loadConversations();
    } catch (error) {
        console.error('[Inbox] Exception blocking conversation:', error);
        alert('Error blocking client');
    }
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

    // Set up polling as fallback to catch messages if real-time subscription fails
    setupConversationMessagePolling(conversation);
}

/**
 * Poll for new messages as a fallback to real-time subscriptions
 */
function setupConversationMessagePolling(conversation) {
    if (!conversation.projectSerial || !conversation.practitionerSerial) {
        console.warn('[Inbox] Cannot set up polling - missing project or practitioner serial');
        return;
    }

    // Clear any existing polling interval
    if (conversation._pollingInterval) {
        clearInterval(conversation._pollingInterval);
    }

    let lastMessageCount = conversation.messages?.length || 0;

    // Poll every 3 seconds for new messages when thread is open
    conversation._pollingInterval = setInterval(async () => {
        try {
            // Check if thread is still visible
            const threadView = document.getElementById('conversation-thread');
            if (!threadView || threadView.style.display === 'none') {
                // Thread closed, stop polling
                clearInterval(conversation._pollingInterval);
                return;
            }

            // Fetch latest messages
            const { data: messages, error } = await window.supabaseClient
                .from('project_messages')
                .select('id, message, sender_type, created_at, is_read')
                .eq('project_serial', conversation.projectSerial)
                .eq('practitioner_serial', conversation.practitionerSerial)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('[Inbox] Error polling for messages:', error);
                return;
            }

            // Check if there are new messages since last poll
            if (messages && messages.length > lastMessageCount) {
                const newMessages = messages.slice(lastMessageCount);
                console.log('[Inbox] New messages detected via polling:', newMessages.length);
                
                // Add new messages to conversation
                conversation.messages = messages;
                lastMessageCount = messages.length;
                
                // Re-render messages
                renderMessages(conversation.messages);
                
                // Scroll to bottom
                const messagesContainer = document.getElementById('thread-messages');
                if (messagesContainer) {
                    setTimeout(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 50);
                }
                
                // Update unread badge
                updateBadges();
            }
        } catch (error) {
            console.error('[Inbox] Polling error:', error);
        }
    }, 3000); // Poll every 3 seconds

    console.log('[Inbox] Message polling started for project:', conversation.projectSerial);
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

/**
 * Setup listener for match status changes from client side
 * When client changes dropdown to "Hired" or "Not-Hired", move card accordingly
 */
function setupMatchStatusChangeListener() {
    if (!window.supabaseClient) {
        console.warn('[Inbox] Supabase client not available for status change listener');
        return;
    }
    
    try {
        const channel = window.supabaseClient.channel('match-status-changes');
        
        channel.on('broadcast', { event: 'match_status_changed' }, async (payload) => {
            console.log('[Inbox] Broadcast received - match status changed:', payload.payload);
            
            const { practitioner_serial, project_serial, status } = payload.payload;
            
            // Only process if this is for the current practitioner
            const rvUserStr = localStorage.getItem('rvUser');
            if (!rvUserStr) return;
            
            const rvUser = JSON.parse(rvUserStr);
            const { data: practitioner } = await window.supabaseClient
                .from('practitioners')
                .select('serial_number')
                .eq('id', rvUser.id)
                .single();
            
            if (!practitioner || practitioner.serial_number !== practitioner_serial) {
                return; // Not for this practitioner
            }
            
            console.log('[Inbox] Status change is for current practitioner, updating UI');
            
            // Find the conversation(s) with this project_serial
            const conversationsToUpdate = conversations.filter(c => c.projectSerial === project_serial);
            
            conversationsToUpdate.forEach(conv => {
                // Update conversation status
                if (status === 'hired') {
                    conv.category = 'hired';
                    conv.status = 'hired';
                    conv.isArchived = true;
                    // Greyed out effect
                    const threadEl = document.querySelector(`.thread-item[data-client-serial="${conv.clientSerial}"]`);
                    if (threadEl) {
                        threadEl.style.opacity = '0.6';
                    }
                    console.log('[Inbox] Moved card to Hired category:', conv.clientName);
                } else if (status === 'not-hired') {
                    conv.category = 'archive';
                    conv.status = 'archived';
                    conv.isArchived = true;
                    // Greyed out effect
                    const threadEl = document.querySelector(`.thread-item[data-client-serial="${conv.clientSerial}"]`);
                    if (threadEl) {
                        threadEl.style.opacity = '0.6';
                    }
                    console.log('[Inbox] Moved card to Archive category:', conv.clientName);
                }
            });
            
            // Re-render the threads list to reflect changes
            renderThreadsList();
            updateBadges();
            
            // Close thread view if it was open for an updated conversation
            if (currentOpenConversation && conversationsToUpdate.some(c => c.id === currentOpenConversation.id)) {
                closeThreadView();
            }
        });
        
        channel.subscribe((status) => {
            console.log('[Inbox] Match status change listener subscription status:', status);
        });
        
        console.log('[Inbox] Match status change listener initialized');
    } catch (error) {
        console.error('[Inbox] Error setting up match status change listener:', error);
    }
}

