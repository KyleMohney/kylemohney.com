/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: hipaaAuditLog.js                                            ║
║  Purpose: HIPAA-compliant audit logging for PHI access             ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

/**
 * Log PHI (Protected Health Information) access for HIPAA compliance
 * Tracks all access to sensitive health/medical data
 * 
 * @param {string} action - Type of action (view, edit, delete, export, download)
 * @param {string} phiType - Type of PHI accessed (allergies, medications, goals, etc)
 * @param {string} resourceType - Database table accessed (client_profiles, projects, etc)
 * @param {UUID} resourceId - ID of the specific record accessed
 * @param {object} details - Additional context (optional)
 */
async function logPHIAccess(action, phiType, resourceType, resourceId, details = null) {
  try {
    // Get current user
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) {
      console.warn('[HIPAA Audit] No authenticated user - skipping log');
      return;
    }

    // Get user role from localStorage
    const storedUser = localStorage.getItem('rvUser');
    const userRole = storedUser ? JSON.parse(storedUser).role : 'unknown';

    // Call audit logging RPC function
    const { error } = await window.supabaseClient.rpc('log_phi_access', {
      p_user_id: user.id,
      p_user_role: userRole,
      p_action: action,
      p_phi_type: phiType,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_status: 'success',
      p_details: details
    });

    if (error) {
      console.error('[HIPAA Audit] Logging error (non-blocking):', error.message);
    }
  } catch (error) {
    console.error('[HIPAA Audit] Exception during logging (non-blocking):', error);
  }
}

/**
 * Log failed access attempt (security incident)
 * @param {string} action - Failed action type
 * @param {string} reason - Reason for failure (unauthorized, not found, etc)
 * @param {string} resourceType - What was attempted to be accessed
 * @param {object} details - Additional context
 */
async function logAccessDenied(action, reason, resourceType, details = null) {
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) return;

    const storedUser = localStorage.getItem('rvUser');
    const userRole = storedUser ? JSON.parse(storedUser).role : 'unknown';

    await window.supabaseClient.rpc('log_phi_access', {
      p_user_id: user.id,
      p_user_role: userRole,
      p_action: action,
      p_phi_type: null,
      p_resource_type: resourceType,
      p_resource_id: null,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_status: 'denied',
      p_details: { reason, ...details }
    };
  } catch (error) {
    console.error('[HIPAA Audit] Failed to log access denial:', error);
  }
}

/**
 * Log PHI modification with before/after values
 * @param {string} action - 'edit' or 'delete'
 * @param {string} phiType - Type of PHI modified
 * @param {string} resourceType - Table modified
 * @param {UUID} resourceId - Record ID
 * @param {object} oldValue - Previous value
 * @param {object} newValue - New value
 */
async function logPHIModification(action, phiType, resourceType, resourceId, oldValue, newValue) {
  await logPHIAccess(action, phiType, resourceType, resourceId, {
    action: action,
    field: phiType,
    old_value: oldValue,
    new_value: newValue,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log data export/download events (compliance requirement)
 * @param {string} dataType - What was exported (client_data, health_info, etc)
 * @param {UUID} userId - User whose data was exported
 * @param {string} exportFormat - CSV, PDF, JSON, etc
 */
async function logDataExport(dataType, userId, exportFormat = 'csv') {
  await logPHIAccess('export', dataType, 'user_data_export', userId, {
    export_format: exportFormat,
    exported_by: await window.supabaseClient.auth.getUser(),
    timestamp: new Date().toISOString()
  });
}

// Usage Examples:
/*
// Log viewing client health data
logPHIAccess('view', 'allergies', 'client_profiles', clientId, { field: 'allergies_sensitivities' });

// Log editing medications
logPHIModification('edit', 'medications', 'client_profiles', clientId, oldMeds, newMeds);

// Log viewing project (may contain health info)
logPHIAccess('view', 'project_description', 'projects', projectId, { description_preview: desc });

// Log data export
logDataExport('client_health_profile', clientId, 'pdf');

// Log access denied
logAccessDenied('view', 'unauthorized', 'client_profiles', { reason: 'not practitioner' });
*/
