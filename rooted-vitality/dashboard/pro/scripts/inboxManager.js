/*
╔════════════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                                     ║
║  File: inboxManager.js                                                     ║
║  Purpose: Practitioner Inbox - Message threads, filtering, UI interactions ║
║  Holistic Wellness · Modern Connection Platform                            ║
║  rootedvitality.com | 2025                                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. MODAL MANAGEMENT (Block/Unblock/Decline)
  2. STATE & INITIALIZATION
  3. CONVERSATION LOADING & FILTERING
  4. THREAD RENDERING & DISPLAY
  5. MESSAGE RENDERING & UPDATES
  6. UTILITIES & HELPERS
  7. USER INTERACTIONS & EVENT LISTENERS
*/

// Import shared utilities
const utilsScript = document.createElement('script');
utilsScript.src = '/rooted-vitality/scripts/utilities.js';
document.head.appendChild(utilsScript);

// ======================================================
// 1. MODAL MANAGEMENT (Block/Unblock/Decline)
// ======================================================

// Modal management functions moved to match-settings-modals.js
// Keeping minimal modal handlers here for direct use

// ======================================================
// 0. HELPER FUNCTIONS & MANAGERS (UTILITIES)
// ======================================================

const ConversationStatus = {
    isActive(conv) { return conv.category === 'all' && !conv.isArchived && !conv.isBlocked; },
    isUnread(conv) { return conv.isUnread && !conv.isArchived && !conv.isBlocked; },
    isHired(conv) { return conv.category === 'hired'; },
    isArchived(conv) { return conv.category === 'archive' || conv.isBlocked; },
    isPending(conv) { return conv.isPending; }
};

function createActionButton(label, className, handler) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = label;
    if (handler) btn.addEventListener('click', handler);
    return btn;
}

const SubscriptionManager = {
    subscriptions: new Map(),
    create(conversationId, projectId, handler) {
        this.cleanup(conversationId);
        const channel = window.supabaseClient
            .channel(`project_messages_${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'project_messages',
                filter: `project_id=eq.${projectId}`
            }, handler)
            .subscribe();
        this.subscriptions.set(conversationId, { channel, projectId });
        return channel;
    },
    cleanup(conversationId) {
        if (this.subscriptions.has(conversationId)) {
            const { channel } = this.subscriptions.get(conversationId);
            window.supabaseClient.removeChannel(channel);
            this.subscriptions.delete(conversationId);
        }
    },
    cleanupAll() {
        for (const [, { channel }] of this.subscriptions) {
            window.supabaseClient.removeChannel(channel);
        }
        this.subscriptions.clear();
    }
};

function updateConversationMessages(conversationId, newMessages) {
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx === -1) return;
    conversations[idx].messages = newMessages;
    const unreadCount = newMessages.filter(m => !m.is_read && m.sender_type === 'client').length;
    conversations[idx].isUnread = unreadCount > 0;
    conversations[idx].unreadCount = unreadCount;
}

// === MODAL MANAGEMENT ===
let pendingModalAction = null;
let currentOpenConversation = null;

function showConfirmationModal(type, clientName, data) {
    pendingModalAction = { type, clientName, ...data };
    const clientNameEl = document.getElementById(`${type}-client-name`);
    const modalOverlay = document.getElementById(`${type}-modal-overlay`);
    if (clientNameEl) clientNameEl.textContent = clientName;
    if (modalOverlay) modalOverlay.classList.add('show');
}

function closeConfirmationModal() {
    if (!pendingModalAction) return;
    const modalOverlay = document.getElementById(`${pendingModalAction.type}-modal-overlay`);
    if (modalOverlay) modalOverlay.classList.remove('show');
    pendingModalAction = null;
}

async function confirmModalAction() {
    if (!pendingModalAction) return;
    const { type } = pendingModalAction;
    try {
        switch (type) {
            case 'block': await _confirmBlock(); break;
            case 'decline': await _confirmDecline(); break;
            case 'unblock': await _confirmUnblock(); break;
        }
    } catch (error) {
        console.error(`[Inbox] Error: ${type}`, error);
        alert(`Error ${type}ing client`);
    }
}
async function _confirmBlock() {
    if (!pendingModalAction || pendingModalAction.type !== 'block') return;
    const { clientName, clientSerial, practitionerId } = pendingModalAction;
    closeConfirmationModal();
    
    const { data: existingBlock } = await window.supabaseClient
        .from('practitioner_blocks')
        .select('id')
        .eq('practitioner_serial', practitionerId)
        .eq('client_serial', clientSerial);
    
    if (existingBlock?.length > 0) {
        const { error } = await window.supabaseClient
            .from('practitioner_blocks')
            .update({ is_blocked: true })
            .eq('practitioner_serial', practitionerId)
            .eq('client_serial', clientSerial);
        if (error) throw error;
    } else {
        const { error } = await window.supabaseClient
            .from('practitioner_blocks')
            .insert([{ practitioner_serial: practitionerId, client_serial: clientSerial, is_blocked: true }]);
        if (error) throw error;
    }
    
    const { data: projectIds } = await window.supabaseClient
        .from('projects')
        .select('id')
        .eq('client_serial', clientSerial);
    
    if (projectIds?.length > 0) {
        await window.supabaseClient
            .from('project_practitioner_matches')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
            .eq('practitioner_serial', practitionerId)
            .in('project_id', projectIds.map(p => p.id));
    }
    
    await window.supabaseClient
        .from('client_notifications')
        .insert({ client_serial: clientSerial, type: 'match_declined', title: 'Match Declined', message: 'Practitioner declined match', is_read: false, created_at: new Date().toISOString() });
    
    _showSuccessToast(`${clientName} blocked`);
}

// Internal: Handle decline confirmation
async function _confirmDecline() {
    if (!pendingModalAction || pendingModalAction.type !== 'decline') return;
    
    const { clientName, matchId, conversation } = pendingModalAction;
    closeConfirmationModal();
    
    // Update match status to declined
    const { error } = await window.supabaseClient
        .from('project_practitioner_matches')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', matchId);
    
    if (error) throw error;
    
    // Create notification for the client
    if (conversation) {
        await window.supabaseClient
            .from('client_notifications')
            .insert({
                client_serial: conversation.clientSerial,
                type: 'match_declined',
                title: 'Match Declined',
                message: 'A practitioner has declined your match request.',
                practitioner_name: 'A practitioner',
                match_id: matchId,
                is_read: false,
                created_at: new Date().toISOString()
            });
    }
    
    // Show success and reload
    _showSuccessToast(`${clientName}'s project has been declined`);
}

// Internal: Handle unblock confirmation
async function _confirmUnblock() {
    if (!pendingModalAction || pendingModalAction.type !== 'unblock') return;
    
    const { clientName, clientSerial, practitionerId } = pendingModalAction;
    closeConfirmationModal();
    
    // Update practitioner_blocks to unblock
    const { error: unblockError } = await window.supabaseClient
        .from('practitioner_blocks')
        .update({ is_blocked: false })
        .eq('practitioner_serial', practitionerId)
        .eq('client_serial', clientSerial);
    
    if (unblockError) throw unblockError;
    
    // Show success and reload
    _showSuccessToast(`${clientName} has been unblocked`);
}

// Internal: Show success toast and reload UI
function _showSuccessToast(message) {
    const modal = document.createElement('div');
    modal.className = 'notification-toast';
    modal.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.remove();
        loadConversations();
        renderThreadsList();
        closeThreadView();
    }, 1500);
}

// Legacy wrapper functions for backward compatibility (call generic handlers)
function showBlockModal(clientName, clientSerial, practitionerId) {
    showConfirmationModal('block', clientName, { clientSerial, practitionerId });
}

function closeBlockModal() {
    closeConfirmationModal();
}

function confirmBlock() {
    confirmModalAction();
}

function showDeclineModal(clientName, matchId, conversation) {
    showConfirmationModal('decline', clientName, { matchId, conversation });
}

function closeDeclineModal() {
    closeConfirmationModal();
}

function confirmDecline() {
    confirmModalAction();
}

function showUnblockModal(clientName, clientSerial, practitionerId) {
    showConfirmationModal('unblock', clientName, { clientSerial, practitionerId });
}

function closeUnblockModal() {
    closeConfirmationModal();
}

function confirmUnblock() {
    confirmModalAction();
}

// ======================================================
// 2. STATE & INITIALIZATION
// ======================================================

let currentUser = null;
let currentFilter = 'all';
let conversations = [];
let selectedConversationId = null;

 // Generate initials-based avatar HTML
 // Creates a circular badge with first letter of first name, second letter of last name
 // @param {string} name - Full name (e.g., "Sarah Johnson")
 //  @returns {string} - HTML for initials avatar
function generateInitialsAvatar(name) {
    const parts = name.trim().split(' ').filter(p => p);
    let initials = '';
    
    if (parts.length === 1) {
        initials = parts[0][0].toUpperCase();
    } else if (parts.length === 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    
    // Generate color based on initials (consistent hash)
    const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const hue = (hash * 137.508) % 360;
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

// Initialize layout (header, footer, active view)
async function initializeLayout() {
    localStorage.setItem('active_view', 'practitioner');
    
    if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.renderHeader === 'function') {
        await RootedVitality.renderHeader('practitioner', 'practitioner');
    }
    
    if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.injectFooter === 'function') {
        RootedVitality.injectFooter();
    }
}

// Handle tab parameter from URL (e.g., tab=unread)
function handleTabParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['all', 'unread', 'hired', 'archive'].includes(tabParam)) {
        currentFilter = tabParam;
        
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabParam) {
                tab.classList.add('active');
            }
        });
        
        renderThreadsList();
    }
}

// Attempt to auto-open conversation from URL parameters with retry logic
async function tryAutoOpenConversation() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSerialToOpen = urlParams.get('clientSerial');
    const projectSerialToOpen = urlParams.get('projectSerial');
    
    if (!clientSerialToOpen && !projectSerialToOpen) return;
    
    let retryCount = 0;
    const maxRetries = 10;
    
    const attempt = async () => {
        let conversation = conversations.find(c => c.clientSerial === clientSerialToOpen);
        if (!conversation && projectSerialToOpen) {
            conversation = conversations.find(c => c.projectSerial === projectSerialToOpen);
        }
        
        if (conversation) {
            const threadItem = document.querySelector(`.thread-item[data-client-serial="${conversation.clientSerial}"], .thread-item[data-project-serial="${conversation.projectSerial}"]`);
            
            if (threadItem) {
                threadItem.click();
                return;
            }
            
            // Try alternative selector by client name
            const allThreadItems = document.querySelectorAll('.thread-item');
            for (const item of allThreadItems) {
                if ((item.textContent || '').includes(conversation.clientName)) {
                    item.click();
                    return;
                }
            }
            
            // Fallback: open first thread
            if (retryCount >= maxRetries) {
                const firstThread = document.querySelector('.thread-item');
                if (firstThread) firstThread.click();
                return;
            }
        }
        
        // Retry if conversation not found yet
        if (retryCount < maxRetries) {
            retryCount++;
            if (!conversation) {
                await loadConversations();
            }
            setTimeout(attempt, 300);
        }
    };
    
    setTimeout(attempt, 200);
}

// Setup real-time subscriptions for accepted matches and new messages
function setupRealTimeSubscriptions() {
    const rvUserStr = localStorage.getItem('rvUser');
    if (!rvUserStr) return;
    
    const practitionerSerial = currentUser?.serial_number;
    if (!practitionerSerial) return;
    
    // Subscribe to accepted matches
    window.supabaseClient
        .channel(`accepted-matches:${practitionerSerial}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'project_practitioner_matches',
            filter: `practitioner_serial=eq.${practitionerSerial}`,
        }, (payload) => {
            if (payload.new.status === 'in-progress' && payload.old.status === 'pending') {
                loadConversations().then(() => {
                    renderThreadsList();
                    updateBadges();
                });
            }
        })
        .subscribe();

    // Subscribe to new messages
    window.supabaseClient
        .channel(`practitioner-messages:${practitionerSerial}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'project_messages',
            filter: `practitioner_serial=eq.${practitionerSerial}`,
        }, (payload) => {
            if (payload.new.sender_type === 'client') {
                const projectSerial = payload.new.project_serial;
                const conversation = conversations.find(c => c.projectSerial === projectSerial);
                
                if (conversation) {
                    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                    conversation.isUnread = true;
                    conversation.lastMessage = payload.new.message;
                    conversation.lastMessageTime = new Date(payload.new.created_at);
                    
                    renderThreadsList();
                    updateBadges();
                    
                    if (selectedConversationId === conversation.id) {
                        conversation.messages = conversation.messages || [];
                        conversation.messages.push({
                            id: payload.new.id,
                            sender_type: payload.new.sender_type,
                            message: payload.new.message,
                            created_at: payload.new.created_at,
                            is_read: payload.new.is_read
                        });
                        renderMessages(conversation.messages);
                        
                        const messagesContainer = document.getElementById('messages-container');
                        if (messagesContainer) {
                            setTimeout(() => {
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }, 50);
                        }
                    }
                }
            }
        })
        .subscribe();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current user
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            window.location.href = baseUrl + 'dashboard/client/pages/client-signup.html';
            return;
        }
        
        currentUser = user;
        
        // Initialize layout
        await initializeLayout();
        
        // Setup event listeners
        setupNavigationListeners();
        setupSearchListener();
        setupFilterListeners();
        setupThreadCloseListener();
        setupBackButtonListener();
        
        // Load and render conversations
        await loadConversations();
        renderThreadsList();
        updateBadges();
        
        // Handle URL parameters
        handleTabParameter();
        tryAutoOpenConversation();
        
        // Setup real-time subscriptions
        setupRealTimeSubscriptions();
        setupMatchStatusChangeListener();
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing inbox:', error);
    }
});

// Setup navigation filter buttons
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

// Setup search functionality
function setupSearchListener() {
    const searchInput = document.getElementById('search-conversations');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderThreadsList(query);
    });
}

// Setup filter functionality
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

// Apply category and service type filters
function applyFilters() {
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const serviceFilter = document.getElementById('filter-service')?.value || ''; 
    
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

// Setup thread close button
function setupThreadCloseListener() {
    const closeBtn = document.getElementById('close-thread');
    
    closeBtn.addEventListener('click', () => {
        closeThreadView();
    });
}

// Setup back button in conversation list view
function setupBackButtonListener() {
    const backBtn = document.getElementById('back-to-threads');
    
    if (!backBtn) return;
    
    backBtn.addEventListener('click', () => {
        selectedConversationId = null;
        renderThreadsList();
        closeThreadView();
    });
}

// ======================================================
// 3. CONVERSATION LOADING & FILTERING
// ======================================================

// Build conversation object from accepted match data
function buildAcceptedMatchConversation(match, project, client, messages, messagesMap, reviewsSet, practitionerSerial) {
    const clientName = `${client.first_name || 'Client'} ${client.last_name || ''}`;
    const clientAvatarUrl = client.profile_picture_url 
        ? client.profile_picture_url 
        : generateInitialsAvatar(clientName);

    const unreadCount = messages?.filter(m => !m.is_read && m.sender_type === 'client').length || 0;
    const hasReview = reviewsSet.has(`${practitionerSerial}:${match.project_serial}`);

    let category = 'all';
    let isArchived = false;
    let isPending = false;
    
    if (match.status === 'pending') {
        category = 'pending';
        isPending = true;
    } else if (match.status === 'hired') {
        category = 'hired';
        isArchived = true;
    } else if (match.status === 'not-hired') {
        category = 'archive';
        isArchived = true;
    }

    return {
        id: match.id,
        matchId: match.id,
        projectId: project.id,
        projectSerial: match.project_serial,
        clientId: client.id,
        clientSerial: project.client_serial,
        practitionerId: currentUser.id,
        practitionerSerial: practitionerSerial,
        clientName: clientName,
        clientAvatar: clientAvatarUrl,
        clientPhone: client.phone || '',
        lastMessage: messages?.[0]?.message || 'No messages yet',
        lastMessageTime: messages?.[0]?.created_at ? new Date(messages[0].created_at) : new Date(match.created_at),
        isUnread: unreadCount > 0,
        unreadCount: unreadCount,
        status: 'online',
        category: category,
        messages: messages,
        isArchived: isArchived,
        isPending: isPending,
        isBlocked: false,
        hasReview: hasReview,
        projectDescription: project.description,
        projectCategory: project.category_name,
        projectZipcode: project.zipcode,
        projectTravelPreferences: project.travel_preference,
        matchStatus: match.status
    };
}

// Build conversation object from declined match data
function buildDeclinedMatchConversation(match, project, client, blocksMap, reviewsSet, practitionerSerial) {
    const clientName = `${client.first_name || 'Client'} ${client.last_name || ''}`;
    const clientAvatarUrl = client.profile_picture_url 
        ? client.profile_picture_url 
        : generateInitialsAvatar(clientName);

    const blockKey = `${practitionerSerial}:${project.client_serial}`;
    const isBlocked = blocksMap.has(blockKey) && blocksMap.get(blockKey).is_blocked === true;
    const hasReview = reviewsSet.has(`${practitionerSerial}:${match.project_serial}`);

    return {
        id: match.id,
        matchId: match.id,
        projectId: project.id,
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
        hasReview: hasReview,
        projectDescription: project.description,
        projectCategory: project.category_name,
        projectZipcode: project.zipcode,
        projectTravelPreferences: project.travel_preference
    };
}

// Load conversations from Supabase
async function loadConversations() {
    try {
        // Get practitioner ID and serial number
        const rvUserStr = localStorage.getItem('rvUser');
        if (!rvUserStr) {
            console.error('[Inbox] No rvUser in localStorage');
            return;
        }

        const rvUser = JSON.parse(rvUserStr);
        const practitionerId = rvUser.id;
        
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

        conversations = [];

        // ===== OPTIMIZED: LOAD ALL MATCHES WITH JOINED DATA =====
        // Use a single query with joins instead of N+1 queries
        const { data: acceptedMatches, error: acceptedError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, project_serial, status, created_at')
            .eq('practitioner_serial', practitionerSerial)
            .in('status', ['pending', 'active', 'in-progress', 'hired', 'not-hired']);

        if (acceptedError) {
            console.error('[Inbox] Error loading accepted matches:', acceptedError);
            return;
        }

        // Load declined matches now
        const { data: declinedMatches, error: declinedError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, project_serial, status, created_at')
            .eq('practitioner_serial', practitionerSerial)
            .eq('status', 'declined');

        if (declinedError) {
            console.error('[Inbox] Error loading declined matches:', declinedError);
        }

        // Get ALL unique project serials from BOTH accepted and declined matches
        const allProjectSerials = [...new Set([
            ...(acceptedMatches?.map(m => m.project_serial) || []),
            ...(declinedMatches?.map(m => m.project_serial) || [])
        ])];
        
        // Fetch projects for ALL matches (accepted + declined)
        let projectsData = [];
        if (allProjectSerials.length > 0) {
            const { data: projects, error: projectsError } = await window.supabaseClient
                .from('projects')
                .select('id, project_serial, description, category_name, client_serial, zipcode, travel_preference')
                .in('project_serial', allProjectSerials);
            
            if (projectsError) {
                console.error('[Inbox] Error fetching projects:', projectsError);
            } else {
                projectsData = projects || [];
            }
        }

        // Get all unique client IDs from projects
        const clientSerials = [...new Set(projectsData?.map(p => p.client_serial).filter(Boolean) || [])];

        // Batch fetch all clients
        let clientsMap = new Map();
        if (clientSerials.length > 0) {
            const { data: allClients } = await window.supabaseClient
                .from('clients')
                .select('id, first_name, last_name, profile_picture_url, serial_number, phone')
                .in('serial_number', clientSerials);

            clientsMap = new Map(allClients?.map(c => [c.serial_number, c]) || []);
        }

        // Create projects map for easy lookup
        const projectsMap = new Map(projectsData?.map(p => [p.project_serial, p]) || []);

        // Batch fetch all messages for all projects (oldest first)
        const { data: allMessages } = await window.supabaseClient
            .from('project_messages')
            .select('project_serial, id, message, sender_type, created_at, is_read')
            .in('project_serial', allProjectSerials)
            .order('created_at', { ascending: true });

        const messagesMap = new Map();
        allMessages?.forEach(msg => {
            const key = `${msg.project_serial}`;
            if (!messagesMap.has(key)) {
                messagesMap.set(key, []);
            }
            messagesMap.get(key).push(msg);
        });

        // Batch fetch all reviews
        const { data: allReviews } = await window.supabaseClient
            .from('reviews')
            .select('practitioner_serial, project_serial')
            .eq('practitioner_serial', practitionerSerial)
            .in('project_serial', allProjectSerials);

        const reviewsSet = new Set(allReviews?.map(r => `${r.practitioner_serial}:${r.project_serial}`) || []);

        // Batch fetch all block records
        const { data: allBlocks } = await window.supabaseClient
            .from('practitioner_blocks')
            .select('practitioner_serial, client_serial, is_blocked')
            .eq('practitioner_serial', practitionerSerial)
            .in('client_serial', clientSerials);

        const blocksMap = new Map(allBlocks?.map(b => [`${b.practitioner_serial}:${b.client_serial}`, b]) || []);

        // Process accepted matches
        for (const match of acceptedMatches || []) {
            try {
                const project = projectsMap.get(match.project_serial);
                if (!project) continue;

                const client = clientsMap.get(project.client_serial);
                if (!client) continue;

                const messages = messagesMap.get(`${match.project_serial}`) || [];
                const conversation = buildAcceptedMatchConversation(match, project, client, messages, messagesMap, reviewsSet, practitionerSerial);
                conversations.push(conversation);
            } catch (itemError) {
                console.error('[Inbox] Error processing match:', itemError);
                continue;
            }
        }

        // Process declined matches
        for (const match of declinedMatches || []) {
            try {
                const project = projectsMap.get(match.project_serial);
                if (!project) continue;

                const client = clientsMap.get(project.client_serial);
                if (!client) continue;

                const conversation = buildDeclinedMatchConversation(match, project, client, blocksMap, reviewsSet, practitionerSerial);
                conversations.push(conversation);
            } catch (itemError) {
                console.error('[Inbox] Error processing declined match:', itemError);
                continue;
            }
        }
    } catch (error) {
        console.error('[Inbox] Error loading conversations:', error);
    }
}

// ======================================================
// 4. THREAD RENDERING & DISPLAY
// ======================================================

// Filter conversations by current tab/category
function filterConversationsByCategory(conversations, category) {
    switch (category) {
        case 'all':
            return conversations.filter(conv => ConversationStatus.isActive(conv));
        case 'unread':
            return conversations.filter(conv => ConversationStatus.isUnread(conv));
        case 'hired':
            return conversations.filter(conv => ConversationStatus.isHired(conv));
        case 'archive':
            return conversations.filter(conv => ConversationStatus.isArchived(conv));
        default:
            return conversations;
    }
}

// Render the threads list with filtering
function renderThreadsList(searchQuery = '') {
    const threadsList = document.getElementById('threads-list');
    threadsList.innerHTML = '';
    
    // Use filtered conversations if they exist (from category/service filters), otherwise use all
    let baseConversations = window.filteredConversations || conversations;
    
    // Apply category filter then search filter
    let filtered = filterConversationsByCategory(baseConversations, currentFilter);
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(conv => conv.clientName.toLowerCase().includes(searchQuery));
    }
    
    // If no conversations match, show empty state
    if (filtered.length === 0) {
        threadsList.innerHTML = `
            <div class="empty-state-message">
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

// Create a thread list item element
function createThreadElement(conversation) {
    const item = document.createElement('button');
    item.className = 'thread-item';
    item.setAttribute('data-client-serial', conversation.clientSerial);
    item.setAttribute('data-project-serial', conversation.projectSerial);
    
    if (selectedConversationId === conversation.id) {
        item.classList.add('active');
    }
    
    if (conversation.isUnread) {
        item.classList.add('unread');
    }
    
    // Add visual indicators for archived/blocked status
    if (conversation.isBlocked) {
        item.classList.add('blocked');
    } else if (conversation.isArchived) {
        item.classList.add('archived');
    }
    
    // Determine status label
    let statusLabel = '';
    let reviewLabel = '';
    
    if (conversation.isBlocked) {
        statusLabel = '<span class="status-badge status-badge--blocked status-badge--aligned">BLOCKED</span>';
    } else if (conversation.category === 'archive' && !conversation.isBlocked) {
        statusLabel = '<span class="status-badge status-badge--declined status-badge--aligned">DECLINED</span>';
    } else if (conversation.category === 'hired') {
        statusLabel = '<span class="status-badge status-badge--hired status-badge--aligned">HIRED</span>';
    }
    
    if (conversation.hasReview) {
        reviewLabel = '<span class="status-badge status-badge--reviewed">Reviewed</span>';
    }

    // Show phone number if match is accepted (any status except pending/declined/not-hired, and in the Messages or Hired tabs)
    const isAccepted = conversation.matchStatus && !['pending', 'declined', 'not-hired'].includes(conversation.matchStatus);
    const showPhoneNumber = isAccepted && conversation.clientPhone;
    const phoneDisplay = showPhoneNumber ? `<div class="thread-phone-display">📞 ${conversation.clientPhone}</div>` : '';
    
    item.innerHTML = `
        <div class="thread-item-header">
            <div class="thread-avatar-small">
                <img src="${conversation.clientAvatar}" alt="${conversation.clientName}">
            </div>
            <div class="thread-item-content">
                <p class="thread-name">${conversation.clientName}</p>
                ${phoneDisplay}
            </div>
            <div class="thread-status-badge ${conversation.status === 'online' ? 'online' : conversation.status === 'away' ? 'away' : ''}"></div>
            <span class="thread-time">${formatTime(conversation.lastMessageTime)}</span>
            ${reviewLabel}
            ${statusLabel}
            <div class="thread-menu-wrapper">
                <button class="thread-menu-btn" title="Options" data-thread-id="${conversation.id}">⋮</button>
                <div class="thread-menu-dropdown hidden">
                    <button class="thread-menu-item archive-option">Archive</button>
                    <button class="thread-menu-item block-option">Block</button>
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
                <div class="project-detail-item project-detail-item--margin-top">
                    ${(['declined', 'blocked'].includes(conversation.matchStatus)) ? '' : `<a href="/rooted-vitality/dashboard/client/pages/public-profile.html?client_id=${conversation.clientId}" target="_blank" class="profile-link">View client profile →</a>`}
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
            menuDropdown.classList.toggle('visible');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', () => {
            menuDropdown.classList.remove('visible');
        });
    }
    
    if (archiveOption) {
        archiveOption.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.remove('visible');
            archiveConversation(conversation);
        });
    }
    
    if (blockOption) {
        blockOption.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.remove('visible');
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

// Open and display a conversation thread
function openThreadView(conversation) {
    _openThreadViewAsync(conversation).catch(error => {
        console.error('[Inbox] Error in openThreadView:', error);
    });
}

async function _openThreadViewAsync(conversation) {
    // Stop polling from previous conversation if one was open
    if (currentOpenConversation) {
        if (currentOpenConversation._pollingInterval) {
            clearInterval(currentOpenConversation._pollingInterval);
        }
        // Clean up old subscription
        SubscriptionManager.cleanup(currentOpenConversation.id);
    }

    // Track current open conversation
    currentOpenConversation = conversation;

    const emptyState = document.getElementById('empty-state');
    const threadView = document.getElementById('conversation-thread');
    
    // Hide empty state and show thread view
    if (emptyState) emptyState.classList.add('hidden');
    if (threadView) threadView.classList.remove('hidden');
    
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
            try {
                // Mark messages as read in database
                const { error: updateError, data: updateResponse } = await window.supabaseClient
                    .from('project_messages')
                    .update({ is_read: true })
                    .in('id', unreadClientMessageIds);
                
                if (updateError) {
                    console.error('[Inbox] Error updating messages as read:', updateError);
                    return;
                }
                
                // Verify the update by querying
                const { data: verifyData, error: verifyError } = await window.supabaseClient
                    .from('project_messages')
                    .select('id, is_read')
                    .in('id', unreadClientMessageIds);
                
                if (!verifyError) {
                    // Verified update
                }
                
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
                
                // Also update the conversation in the global conversations array to ensure sync
                const globalConvIndex = conversations.findIndex(c => c.id === conversation.id);
                if (globalConvIndex !== -1) {
                    conversations[globalConvIndex].isUnread = conversation.isUnread;
                    conversations[globalConvIndex].unreadCount = conversation.unreadCount;
                    conversations[globalConvIndex].messages = conversation.messages;
                }
                
                updateBadges();
                renderThreadsList();
            } catch (error) {
                console.error('[Inbox] Error marking messages as read:', error);
            }
        }
    }
    
    // Set up real-time subscription for new messages
    setupConversationRealtimeSubscription(conversation);
    
    // Enable message input and set up send handler
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    
    if (messageInput) {
        // Disable messaging for archived and blocked conversations
        if (ConversationStatus.isArchived(conversation)) {
            messageInput.disabled = true;
            messageInput.placeholder = conversation.isBlocked ? 'This client is blocked' : 'This conversation is archived';
        } else {
            messageInput.disabled = false;
            messageInput.placeholder = `Message ${conversation.clientName}...`;
        }
    }
    
    if (sendBtn) {
        // Disable send button for archived and blocked conversations
        sendBtn.disabled = ConversationStatus.isArchived(conversation);
        
        // Remove old listener by replacing with clean copy
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        // Add send handler
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
                        is_read: false,
                        project_serial: conversation.projectSerial,
                        practitioner_serial: conversation.practitionerSerial,
                        client_serial: conversation.clientSerial
                    });
                
                if (!error) {
                    conversation.messages.push({
                        sender_type: 'practitioner',
                        message: message,
                        created_at: new Date().toISOString()
                    });
                    renderMessages(conversation.messages);
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
        
        // Send on Enter key
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
        threadHeaderLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = clientProfileUrl;
        });
    }
    
    // Show thread view
    threadView.classList.remove('hidden');
}

// Populate the lead details hero section with client information
function populateLeadDetailsHero(conversation) {
    // Update lead status
    const leadStatus = document.getElementById('lead-status');
    if (leadStatus) {
        leadStatus.className = '';
        if (conversation.isBlocked) {
            leadStatus.textContent = 'Blocked';
            leadStatus.classList.add('status-blocked');
        } else if (ConversationStatus.isArchived(conversation)) {
            leadStatus.textContent = 'Declined';
            leadStatus.classList.add('status-declined');
        } else if (conversation.status === 'hired') {
            leadStatus.textContent = '✓ Hired';
            leadStatus.classList.add('status-hired');
        } else {
            leadStatus.textContent = 'Interested in services';
            leadStatus.classList.add('status-active');
        }
    }
    
    // Update services
    const servicesContainer = document.getElementById('lead-services-list');
    if (servicesContainer) {
        if (ConversationStatus.isArchived(conversation)) {
            if (conversation.projectCategory) {
                servicesContainer.innerHTML = `<span class="lead-service-tag">${conversation.projectCategory}</span>`;
            } else {
                servicesContainer.innerHTML = '<span class="detail-placeholder">No category listed</span>';
            }
        } else if (conversation.services && conversation.services.length > 0) {
            servicesContainer.innerHTML = conversation.services
                .slice(0, 3)
                .map(service => `<span class="lead-service-tag">${service}</span>`)
                .join('');
        } else {
            servicesContainer.innerHTML = '<span class="detail-placeholder">No services listed</span>';
        }
    }
    
    // Setup action buttons
    const hireBtn = document.getElementById('lead-action-hire');
    const detailsBtn = document.getElementById('lead-action-details');
    
    // Populate project details section (for all conversations)
    populateProjectDetails(conversation);
    
    // For pending (new lead) conversations, show Accept/Decline buttons
    if (conversation.isPending) {
        const heroActions = document.querySelector('.lead-hero-actions');
        
        if (heroActions) {
            heroActions.innerHTML = '';
            
            // Accept button
            const acceptBtn = createActionButton('Accept', 'lead-action-btn lead-action-primary', async () => {
                const { error } = await window.supabaseClient
                    .from('project_practitioner_matches')
                    .update({ status: 'active', updated_at: new Date().toISOString() })
                    .eq('id', conversation.matchId);
                
                if (error) {
                    console.error('[Inbox] Error accepting match:', error);
                    alert('Error accepting match');
                } else {
                    // Send email notification to client that practitioner accepted
                    if (window.notifyClientOfMatchResponse) {
                        await window.notifyClientOfMatchResponse({
                            clientSerial: conversation.clientSerial,
                            practitionerName: currentUser.name || 'A practitioner',
                            projectName: conversation.projectCategory || 'your request',
                            action: 'accepted'
                        });
                    }
                    
                    await loadConversations();
                    renderThreadsList();
                }
            });
            heroActions.appendChild(acceptBtn);
            
            // Decline button
            const declineBtn = createActionButton('Decline', 'lead-action-btn lead-action-secondary', () => {
                showDeclineModal(conversation.clientName, conversation.matchId, conversation);
            });
            heroActions.appendChild(declineBtn);
        }
    } else if (ConversationStatus.isArchived(conversation)) {
        // Show unblock or block buttons for archived/blocked conversations
        const heroActions = document.querySelector('.lead-hero-actions');
        
        if (heroActions) {
            heroActions.innerHTML = '';
            
            if (conversation.isBlocked) {
                // Unblock button
                const unblockBtn = createActionButton('Unblock', 'lead-action-btn lead-action-primary', () => {
                    showUnblockModal(conversation.clientName, conversation.clientSerial, conversation.practitionerId);
                });
                heroActions.appendChild(unblockBtn);
            } else {
                // Block button
                const blockBtn = createActionButton('Block', 'lead-action-btn lead-action-secondary', () => {
                    showBlockModal(conversation.clientName, conversation.clientSerial, conversation.practitionerId);
                });
                heroActions.appendChild(blockBtn);
            }
        }
        
        const hireBtn = document.getElementById('lead-action-hire');
        if (hireBtn) {
            hireBtn.classList.add('disabled');
        }
        const detailsBtn = document.getElementById('lead-action-details');
        if (detailsBtn) {
            detailsBtn.classList.add('hidden');
        }
    } else {
        const hireBtn = document.getElementById('lead-action-hire');
        if (hireBtn) {
            hireBtn.textContent = 'Hire Client';
            hireBtn.disabled = false;
            hireBtn.classList.remove('disabled');
        }
        const detailsBtn = document.getElementById('lead-action-details');
        if (detailsBtn) {
            detailsBtn.classList.remove('hidden');
        }
    }
}

//Populate project details section with categories, location, travel, and description
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
                categoriesEl.innerHTML = '<span class="detail-text detail-placeholder">Not specified</span>';
            }
        } else {
            categoriesEl.innerHTML = '<span class="detail-text detail-placeholder">Not specified</span>';
        }
    }
    
    // Location (zipcode)
    const locationEl = document.getElementById('project-location');
    if (locationEl) {
        if (conversation.projectZipcode) {
            locationEl.innerHTML = `<span class="detail-text">${escapeHtml(conversation.projectZipcode)}</span>`;
        } else {
            locationEl.innerHTML = '<span class="detail-text detail-placeholder">Not specified</span>';
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
                travelEl.innerHTML = '<span class="detail-text detail-placeholder">Not specified</span>';
            }
        } else {
            travelEl.innerHTML = '<span class="detail-text detail-placeholder">Not specified</span>';
        }
    }
    
    // Project description
    const descEl = document.getElementById('project-description');
    if (descEl) {
        if (conversation.projectDescription) {
            descEl.innerHTML = `<span class="detail-text long-text">${escapeHtml(conversation.projectDescription)}</span>`;
        } else {
            descEl.innerHTML = '<span class="detail-text detail-placeholder">No description provided</span>';
        }
    }
}

// Close the thread view and show empty state
function closeThreadView() {
    // Stop polling when closing thread
    if (currentOpenConversation) {
        if (currentOpenConversation._pollingInterval) {
            clearInterval(currentOpenConversation._pollingInterval);
        }
        // Clean up subscription via manager
        SubscriptionManager.cleanup(currentOpenConversation.id);
    }
    
    currentOpenConversation = null;

    const emptyState = document.getElementById('empty-state');
    const threadView = document.getElementById('conversation-thread');
    
    // Hide thread view and show empty state
    if (threadView) threadView.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
}

// Archive/decline a conversation (from thread menu)
// WORKFLOW: Decline match = set status to 'declined' + notify client
async function archiveConversation(conversation) {
    try {
        // Update the match status to 'declined'
        const { error } = await window.supabaseClient
            .from('project_practitioner_matches')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
            .eq('id', conversation.matchId);
        
        if (error) {
            console.error('[Inbox] Error archiving conversation:', error);
            alert('Failed to archive conversation');
            return;
        }
        
        // Send notification to client that practitioner declined
        if (window.notifyClientOfMatchResponse) {
            await window.notifyClientOfMatchResponse({
                clientSerial: conversation.clientSerial,
                practitionerName: currentUser.name || 'A practitioner',
                projectName: conversation.projectCategory || 'your request',
                action: 'declined'
            });
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

// Block a client conversation (from thread menu)
// WORKFLOW: Practitioner blocks = match status = declined
async function blockConversation(conversation) {
    try {
        // Update the match status to 'declined' (WORKFLOW requirement)
        const { error } = await window.supabaseClient
            .from('project_practitioner_matches')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
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

//Set up real-time subscription and polling for conversation messages
function setupConversationRealtimeSubscription(conversation) {
    if (!window.supabaseClient || !conversation.projectId) {
        console.error('[Inbox] Cannot set up subscription - missing client or project ID');
        return;
    }

    // Real-time subscription handler
    const messageHandler = (payload) => {
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
        
        renderMessages(conversation.messages);
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);
        }
    };
    
    // Create subscription via manager
    SubscriptionManager.create(conversation.id, conversation.projectId, messageHandler);
    
    // Set up polling fallback
    setupConversationMessagePolling(conversation);
}

//Poll for new messages as a fallback to real-time subscriptions
function setupConversationMessagePolling(conversation) {
    if (!conversation.projectSerial || !conversation.practitionerSerial) {
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
            if (!threadView || threadView.classList.contains('hidden')) {
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
                console.error('[Inbox] Polling error:', error);
                return;
            }

            // Check if there are new messages since last poll
            if (messages && messages.length > lastMessageCount) {
                // Use message sync helper to update both local and global
                updateConversationMessages(conversation.id, messages);
                lastMessageCount = messages.length;
                
                renderMessages(messages);
                
                // Scroll to bottom
                const messagesContainer = document.getElementById('thread-messages');
                if (messagesContainer) {
                    setTimeout(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 50);
                }
                
                updateBadges();
            }
        } catch (error) {
            console.error('[Inbox] Polling error:', error);
        }
    }, 3000); // Poll every 3 seconds
}

// ======================================================
// 5. MESSAGE RENDERING & UPDATES
// ======================================================

//Render messages in the thread
function renderMessages(messages) {
    const messagesContainer = document.getElementById('thread-messages');
    if (!messagesContainer) {
        console.error('[Inbox] Messages container not found');
        return;
    }
    
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

//Update badge counts
function updateBadges() {
    const allCount = conversations.filter(c => c.category === 'all').length;
    const unreadCount = conversations.filter(c => c.isUnread && !c.isArchived && !c.isBlocked).length;
    const hiredCount = conversations.filter(c => c.category === 'hired').length;
    const archiveCount = conversations.filter(c => c.category === 'archive' || c.isBlocked).length;
    
    document.getElementById('badge-all').textContent = allCount;
    document.getElementById('badge-unread').textContent = unreadCount;
    document.getElementById('badge-hired').textContent = hiredCount;
    document.getElementById('badge-archive').textContent = archiveCount;
}

// ======================================================
// 6. USER INTERACTIONS & EVENT LISTENERS
// ======================================================

 //Setup listener for match status changes from client side
 //When client changes dropdown to "Hired" or "Not-Hired", move card accordingly
function setupMatchStatusChangeListener() {
    if (!window.supabaseClient) {
        return;
    }
    
    try {
        const channel = window.supabaseClient.channel('match-status-changes');
        
        channel.on('broadcast', { event: 'match_status_changed' }, async (payload) => {
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
                        threadEl.classList.add('disabled-conversation');
                    }
                } else if (status === 'not-hired') {
                    conv.category = 'archive';
                    conv.status = 'archived';
                    conv.isArchived = true;
                    // Greyed out effect
                    const threadEl = document.querySelector(`.thread-item[data-client-serial="${conv.clientSerial}"]`);
                    if (threadEl) {
                        threadEl.classList.add('disabled-conversation');
                    }
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
            // Subscription status received
        });
        
        // Match status change listener initialized
    } catch (error) {
        console.error('[Inbox] Error setting up match status change listener:', error);
    }
}
