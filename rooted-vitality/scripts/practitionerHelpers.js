/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/practitionerHelpers.js                              ║
║  Purpose: Helper functions for practitioner profile management     ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. PROFILE HELPERS
  2. CREDENTIAL HELPERS
  3. FILE UPLOAD HELPERS
  4. STATUS HELPERS
*/

console.log('[Rooted Vitality] practitionerHelpers.js loading...');

// ======================================================
// 1. PROFILE HELPERS
// ======================================================

/**
 * Create initial practitioner profile
 * @param {string} userId - Authenticated user ID
 * @param {string} email - User email
 * @returns {object} Created profile data
 */
async function createPractitionerProfile(userId, email) {
    try {
        const { data, error } = await window.supabaseClient
            .from('practitioners')
            .insert([{
                user_id: userId,
                email: email,
                status: 'draft',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        console.log('[Practitioner Helpers] Profile created:', data.id);
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error creating profile:', error);
        throw error;
    }
}

/**
 * Update practitioner profile with form data
 * @param {string} userId - Authenticated user ID
 * @param {object} formData - Form data to update
 * @returns {object} Updated profile data
 */
async function updatePractitionerProfile(userId, formData) {
    try {
        const updatePayload = {
            ...formData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('practitioners')
            .update(updatePayload)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        console.log('[Practitioner Helpers] Profile updated');
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error updating profile:', error);
        throw error;
    }
}

/**
 * Get practitioner profile by user ID
 * @param {string} userId - Authenticated user ID
 * @returns {object} Practitioner profile data
 */
async function getPractitionerProfile(userId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('practitioners')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error fetching profile:', error);
        throw error;
    }
}

/**
 * Update practitioner status (draft, pending_review, approved, rejected)
 * @param {string} userId - Authenticated user ID
 * @param {string} status - New status
 * @returns {object} Updated profile data
 */
async function updatePractitionerStatus(userId, status) {
    try {
        const { data, error } = await window.supabaseClient
            .from('practitioners')
            .update({
                status: status,
                updated_at: new Date().toISOString(),
                submitted_at: status === 'pending_review' ? new Date().toISOString() : undefined
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        console.log('[Practitioner Helpers] Status updated to:', status);
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error updating status:', error);
        throw error;
    }
}

// ======================================================
// 2. CREDENTIAL HELPERS
// ======================================================

/**
 * Create credential record
 * @param {string} practitionerId - Practitioner profile ID
 * @param {object} credentialData - Credential information
 * @returns {object} Created credential data
 */
async function createCredential(practitionerId, credentialData) {
    try {
        const { data, error } = await window.supabaseClient
            .from('credentials')
            .insert([{
                practitioner_id: practitionerId,
                ...credentialData,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        console.log('[Practitioner Helpers] Credential created:', data.id);
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error creating credential:', error);
        throw error;
    }
}

/**
 * Update credential record
 * @param {string} credentialId - Credential ID
 * @param {object} credentialData - Updated credential information
 * @returns {object} Updated credential data
 */
async function updateCredential(credentialId, credentialData) {
    try {
        const { data, error } = await window.supabaseClient
            .from('credentials')
            .update({
                ...credentialData,
                updated_at: new Date().toISOString()
            })
            .eq('id', credentialId)
            .select()
            .single();

        if (error) throw error;
        console.log('[Practitioner Helpers] Credential updated');
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error updating credential:', error);
        throw error;
    }
}

/**
 * Get credentials for practitioner
 * @param {string} practitionerId - Practitioner profile ID
 * @returns {array} Array of credential records
 */
async function getCredentials(practitionerId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('credentials')
            .select('*')
            .eq('practitioner_id', practitionerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Practitioner Helpers] Error fetching credentials:', error);
        throw error;
    }
}

// ======================================================
// 3. FILE UPLOAD HELPERS
// ======================================================

/**
 * Upload file to Supabase Storage
 * @param {string} bucketName - Storage bucket name
 * @param {string} filePath - Path within bucket
 * @param {File} file - File object to upload
 * @returns {string} Public URL of uploaded file
 */
async function uploadFile(bucketName, filePath, file) {
    try {
        // Upload file
        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = window.supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        console.log('[Practitioner Helpers] File uploaded:', filePath);
        return urlData.publicUrl;
    } catch (error) {
        console.error('[Practitioner Helpers] Error uploading file:', error);
        throw error;
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} bucketName - Storage bucket name
 * @param {string} filePath - Path within bucket
 * @returns {boolean} Success status
 */
async function deleteFile(bucketName, filePath) {
    try {
        const { error } = await window.supabaseClient.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) throw error;
        console.log('[Practitioner Helpers] File deleted:', filePath);
        return true;
    } catch (error) {
        console.error('[Practitioner Helpers] Error deleting file:', error);
        throw error;
    }
}

/**
 * Upload practitioner document (license, certification, etc.)
 * @param {string} userId - User ID
 * @param {string} docType - Document type (license, certification, insurance)
 * @param {File} file - File to upload
 * @returns {string} Public URL of uploaded document
 */
async function uploadPractitionerDocument(userId, docType, file) {
    try {
        const timestamp = Date.now();
        const fileName = `${file.name}`;
        const filePath = `${userId}/${docType}/${timestamp}_${fileName}`;
        const bucketName = 'practitioner-files';

        return await uploadFile(bucketName, filePath, file);
    } catch (error) {
        console.error('[Practitioner Helpers] Error uploading document:', error);
        throw error;
    }
}

// ======================================================
// 4. STATUS HELPERS
// ======================================================

/**
 * Submit practitioner for review
 * @param {string} userId - Authenticated user ID
 * @returns {object} Updated profile data
 */
async function submitForReview(userId) {
    return updatePractitionerStatus(userId, 'pending_review');
}

/**
 * Approve practitioner (admin only)
 * @param {string} userId - Practitioner user ID
 * @returns {object} Updated profile data
 */
async function approvePractitioner(userId) {
    return updatePractitionerStatus(userId, 'approved');
}

/**
 * Reject practitioner (admin only)
 * @param {string} userId - Practitioner user ID
 * @param {string} reason - Rejection reason
 * @returns {object} Updated profile data
 */
async function rejectPractitioner(userId, reason) {
    try {
        const { data, error } = await window.supabaseClient
            .from('practitioners')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        console.log('[Practitioner Helpers] Practitioner rejected');
        return data;
    } catch (error) {
        console.error('[Practitioner Helpers] Error rejecting practitioner:', error);
        throw error;
    }
}

// Export functions for use in other modules
// (if using ES modules)
/*
export {
    createPractitionerProfile,
    updatePractitionerProfile,
    getPractitionerProfile,
    updatePractitionerStatus,
    createCredential,
    updateCredential,
    getCredentials,
    uploadFile,
    deleteFile,
    uploadPractitionerDocument,
    submitForReview,
    approvePractitioner,
    rejectPractitioner
};
*/
