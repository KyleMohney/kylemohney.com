// ═══════════════════════════════════════════════════════════════════════════
// ROOTED VITALITY, INC.
// File: scripts/serialNumberManager.js
// Purpose: Manage serial number generation for clients and practitioners
// Serial Format: C1, C2, C3... (Clients) | P1, P2, P3... (Practitioners)
// ═══════════════════════════════════════════════════════════════════════════

console.log('[SerialManager] Starting to load serialNumberManager...');

try {
    const serialNumberManager = {
    /**
     * Generate next serial number for a given type
     * @param {string} type - 'client' or 'practitioner'
     * @returns {Promise<string>} - Serial number like 'C1', 'P42', etc.
     */
    async generateSerialNumber(type) {
        try {
            // Wait for Supabase client if not ready
            let attempts = 0;
            while (!window.supabaseClient && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized after waiting');
            }

            const typeValidated = type.toLowerCase();
            if (!['client', 'practitioner'].includes(typeValidated)) {
                throw new Error(`Invalid serial number type: ${type}`);
            }

            console.log(`[SerialManager] Generating serial number for: ${typeValidated}`);

            // Use the database function (SECURITY DEFINER) to safely generate serials
            // This avoids race conditions and duplicate key issues
            const { data, error } = await window.supabaseClient
                .rpc('generate_next_serial', { user_type: typeValidated });

            if (error) {
                console.warn(`[SerialManager] RPC failed (${error.code}), falling back to local generation:`, error.message);
                
                // Fallback: use timestamp-based generation
                const timestamp = Date.now().toString().slice(-6);
                const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const prefix = typeValidated === 'client' ? 'C' : 'P';
                const serialNumber = `${prefix}${timestamp}${randomSuffix}`;
                console.log(`[SerialManager] Generated serial using fallback: ${serialNumber}`);
                return serialNumber;
            }

            if (!data) {
                throw new Error('No serial number returned from database');
            }

            console.log(`[SerialManager] Generated serial number: ${data}`);
            return data;

        } catch (error) {
            console.error(`[SerialManager] Error generating serial number for ${type}:`, error);
            throw error;
        }
    },

    /**
     * Get serial number for existing user (for display/reference)
     * @param {string} userId - User ID
     * @param {string} type - 'client' or 'practitioner'
     * @returns {Promise<string|null>} - Serial number or null if not found
     */
    async getSerialNumber(userId, type) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            const tableMap = {
                'client': 'clients',
                'practitioner': 'practitioners'
            };

            const table = tableMap[type.toLowerCase()];
            if (!table) {
                throw new Error(`Invalid serial number type: ${type}`);
            }

            const { data, error } = await window.supabaseClient
                .from(table)
                .select('serial_number')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error(`[SerialManager] Error fetching serial for ${type}:`, error);
                return null;
            }

            return data?.serial_number || null;

        } catch (error) {
            console.error(`[SerialManager] Exception getting serial number:`, error);
            return null;
        }
    },

    /**
     * Format display of serial number (with dashes if desired)
     * @param {string} serialNumber - Raw serial number like 'C1'
     * @returns {string} - Formatted serial like 'C-0000001' or 'C-001'
     */
    formatSerialForDisplay(serialNumber, padLength = 7) {
        if (!serialNumber) return '';
        
        const prefix = serialNumber.charAt(0);
        const number = serialNumber.slice(1);
        const paddedNumber = number.padStart(padLength, '0');
        
        return `${prefix}-${paddedNumber}`;
    },

    /**
     * Parse formatted serial back to simple format
     * @param {string} formatted - Formatted serial like 'C-0000001'
     * @returns {string} - Simple serial like 'C1'
     */
    parseFormattedSerial(formatted) {
        if (!formatted) return '';
        return formatted.replace(/-/g, '').replace(/^([A-Z])0+/, '$1');
    }
};

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = serialNumberManager;
    }

    // Make available globally
    window.serialNumberManager = serialNumberManager;
    
    console.log('[SerialManager] serialNumberManager loaded');
    console.log('[SerialManager] Available on window:', !!window.serialNumberManager);
} catch (error) {
    console.error('[SerialManager] FATAL ERROR loading serialNumberManager:', error);
}
