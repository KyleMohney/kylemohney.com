/**
 * Match Settings Manager
 * Handles reading and writing coverage area, service categories, and availability data
 * Interfaces with Supabase and manages UI synchronization
 */

class MatchSettingsManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.practitionerId = null;
    this.matchSettings = null;
    this.selectedServices = [];
    this.practitioners = null;
  }

  /**
   * Initialize the manager with practitioner data
   */
  async initialize(practitionerId) {
    this.practitionerId = practitionerId;
    await this.loadMatchSettings();
    await this.loadSelectedServices();
    await this.loadPractitionerData();
    console.log('[MatchSettingsManager] Initialized for practitioner:', practitionerId);
  }

  // ================================================================
  // MATCH SETTINGS (Coverage Area & Pause Status)
  // ================================================================

  /**
   * Load match settings from database
   */
  async loadMatchSettings() {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .select('*')
        .eq('practitioner_id', this.practitionerId);

      if (error) throw error;

      // If no record exists, create one with defaults
      if (!data || data.length === 0) {
        console.log('[MatchSettingsManager] No match settings found, creating new record');
        return await this.createDefaultMatchSettings();
      }

      this.matchSettings = data[0];
      console.log('[MatchSettingsManager] Match settings loaded:', data[0]);
      return data[0];
    } catch (error) {
      console.error('[MatchSettingsManager] Error loading match settings:', error);
      return null;
    }
  }

  /**
   * Create default match settings record
   */
  async createDefaultMatchSettings() {
    try {
      const defaultSettings = {
        practitioner_id: this.practitionerId,
        is_matching_active: false,
        is_paused: false,
        coverage_area_settings: this.getDefaultCoverageSettings(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) throw error;

      this.matchSettings = data;
      console.log('[MatchSettingsManager] Default match settings created:', data);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error creating default match settings:', error);
      // Return an in-memory default if we can't persist to DB
      this.matchSettings = {
        practitioner_id: this.practitionerId,
        is_matching_active: false,
        is_paused: false,
        coverage_area_settings: this.getDefaultCoverageSettings()
      };
      return this.matchSettings;
    }
  }

  /**
   * Get coverage area settings
   */
  getCoverageAreaSettings() {
    return this.matchSettings?.coverage_area_settings || this.getDefaultCoverageSettings();
  }

  /**
   * Get default coverage area structure
   */
  getDefaultCoverageSettings() {
    return {
      in_office: {
        enabled: false,
        option_a: {
          base_zip: null,
          radius_miles: 10
        },
        option_b: {
          zips: []
        }
      },
      house_calls: {
        enabled: false,
        option_a: {
          base_zip: null,
          radius_miles: 10
        },
        option_b: {
          zips: []
        }
      },
      virtual_remote: {
        enabled: false,
        option_a: {
          nationwide: false
        },
        option_b: {
          states: []
        }
      }
    };
  }

  /**
   * Update coverage area settings for a specific travel type
   * @param {string} travelType - 'in_office', 'house_calls', or 'virtual_remote'
   * @param {object} settings - New settings for this travel type
   */
  async updateCoverageArea(travelType, settings) {
    try {
      const current = this.getCoverageAreaSettings();
      current[travelType] = { ...current[travelType], ...settings };

      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .update({ coverage_area_settings: current, updated_at: new Date().toISOString() })
        .eq('practitioner_id', this.practitionerId)
        .select()
        .single();

      if (error) throw error;

      this.matchSettings = data;
      console.log('[MatchSettingsManager] Coverage area updated for', travelType, ':', settings);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error updating coverage area:', error);
      throw error;
    }
  }

  /**
   * Save In-Office coverage settings
   */
  async saveInOfficeCoverage(optionA = null, optionB = null) {
    const settings = {
      enabled: optionA !== null || optionB !== null,
      option_a: optionA || { base_zip: null, radius_miles: 10 },
      option_b: optionB || { zips: [] }
    };
    return this.updateCoverageArea('in_office', settings);
  }

  /**
   * Save House Calls coverage settings
   */
  async saveHouseCallsCoverage(optionA = null, optionB = null) {
    const settings = {
      enabled: optionA !== null || optionB !== null,
      option_a: optionA || { base_zip: null, radius_miles: 10 },
      option_b: optionB || { zips: [] }
    };
    return this.updateCoverageArea('house_calls', settings);
  }

  /**
   * Save Virtual/Remote coverage settings
   */
  async saveVirtualRemoteCoverage(optionA = null, optionB = null) {
    const settings = {
      enabled: optionA !== null || optionB !== null,
      option_a: optionA || { nationwide: false },
      option_b: optionB || { states: [] }
    };
    return this.updateCoverageArea('virtual_remote', settings);
  }

  /**
   * Get specific travel type coverage
   */
  getTravelTypeCoverage(travelType) {
    return this.getCoverageAreaSettings()[travelType];
  }

  /**
   * Check if a travel type is enabled
   */
  isTravelTypeEnabled(travelType) {
    return this.getTravelTypeCoverage(travelType)?.enabled || false;
  }

  // ================================================================
  // SERVICE CATEGORIES
  // ================================================================

  /**
   * Load selected services from database
   */
  async loadSelectedServices() {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_selected_services')
        .select(`
          id,
          taxonomy_id,
          subcategory_id,
          is_active,
          price_per_service,
          created_at,
          updated_at,
          taxonomy_subcategories (
            id,
            name
          )
        `)
        .eq('practitioner_id', this.practitionerId);

      if (error) throw error;
      this.selectedServices = data || [];
      console.log('[MatchSettingsManager] Selected services loaded:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error loading selected services:', error);
      return [];
    }
  }

  /**
   * Get all selected services
   */
  getSelectedServices() {
    return this.selectedServices;
  }

  /**
   * Get only active services
   */
  getActiveServices() {
    return this.selectedServices.filter(s => s.is_active === true);
  }

  /**
   * Get only inactive services
   */
  getInactiveServices() {
    return this.selectedServices.filter(s => s.is_active === false);
  }

  /**
   * Add a new service category
   * Accepts either:
   * - categoryId (string like "acupuncture") + subcategoryName (string like "Fertility Support")
   * - OR taxonomyId (UUID) + subcategoryId (UUID)
   */
  async addServiceCategory(categoryIdOrTaxonomyId, subcategoryNameOrId, pricePerService = null) {
    try {
      let taxonomyId, subcategoryId;

      // Check if inputs are UUIDs or string IDs
      const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      
      if (isUUID(categoryIdOrTaxonomyId) && isUUID(subcategoryNameOrId)) {
        // Already UUIDs, use directly
        taxonomyId = categoryIdOrTaxonomyId;
        subcategoryId = subcategoryNameOrId;
      } else {
        // String IDs - look up the UUIDs
        const categoryId = categoryIdOrTaxonomyId;
        const subcategoryName = subcategoryNameOrId;

        // Look up taxonomy ID from category_id
        const { data: taxonomyData, error: taxonomyError } = await this.supabase
          .from('holistic_health_taxonomy')
          .select('id')
          .eq('category_id', categoryId)
          .single();

        if (taxonomyError || !taxonomyData) {
          throw new Error(`Category "${categoryId}" not found in taxonomy`);
        }
        taxonomyId = taxonomyData.id;

        // Look up subcategory ID from name
        const { data: subcatData, error: subcatError } = await this.supabase
          .from('taxonomy_subcategories')
          .select('id')
          .eq('taxonomy_id', taxonomyId)
          .eq('name', subcategoryName)
          .single();

        if (subcatError || !subcatData) {
          throw new Error(`Subcategory "${subcategoryName}" not found under category "${categoryId}"`);
        }
        subcategoryId = subcatData.id;
      }

      // Insert or update the service (upsert)
      // First try to find if it already exists
      const { data: existing } = await this.supabase
        .from('practitioner_selected_services')
        .select('id')
        .eq('practitioner_id', this.practitionerId)
        .eq('taxonomy_id', taxonomyId)
        .eq('subcategory_id', subcategoryId)
        .single();

      let data, error;
      
      if (existing) {
        // Update existing service with new price
        const result = await this.supabase
          .from('practitioner_selected_services')
          .update({
            price_per_service: pricePerService,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new service
        const result = await this.supabase
          .from('practitioner_selected_services')
          .insert({
            practitioner_id: this.practitionerId,
            taxonomy_id: taxonomyId,
            subcategory_id: subcategoryId,
            is_active: false,  // Default to inactive
            price_per_service: pricePerService  // Optional price per service
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      
      // Update cache
      const cacheIndex = this.selectedServices.findIndex(s => s.id === data.id);
      if (cacheIndex !== -1) {
        this.selectedServices[cacheIndex] = data;
      } else {
        this.selectedServices.push(data);
      }
      
      console.log('[MatchSettingsManager] Service category added/updated:', subcategoryNameOrId, 'Price:', pricePerService);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error adding service category:', error);
      throw error;
    }
  }

  /**
   * Toggle service category active/inactive
   */
  async toggleServiceCategory(serviceId, isActive) {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_selected_services')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      const index = this.selectedServices.findIndex(s => s.id === serviceId);
      if (index !== -1) {
        this.selectedServices[index] = data;
      }

      console.log('[MatchSettingsManager] Service category toggled:', serviceId, 'to', isActive);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error toggling service category:', error);
      throw error;
    }
  }

  /**
   * Update pricing for a specific service
   */
  async updateServicePrice(serviceId, priceAmount) {
    try {
      const updateData = {
        price_per_service: priceAmount,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('practitioner_selected_services')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      const index = this.selectedServices.findIndex(s => s.id === serviceId);
      if (index !== -1) {
        this.selectedServices[index] = data;
      }

      console.log('[MatchSettingsManager] Service price updated:', serviceId, 'to $' + (priceAmount ? priceAmount.toFixed(2) : 'default'));
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error updating service price:', error);
      throw error;
    }
  }

  /**
   * Sync all service pricing to practitioners table as JSONB array
   * Called after any price change to keep database in sync
   */
  async syncServicePricingToPractitioner(practitionerId) {
    try {
      // Build array of all selected services with their pricing
      const servicePricingArray = this.selectedServices.map(service => ({
        service_id: service.id,
        category_id: service.category_id,
        category_name: service.category_name,
        subcategory_name: service.subcategory_name,
        price_per_service: service.price_per_service || null
      }));

      // Save to practitioners table as JSONB in pricing column
      const { error } = await this.supabase
        .from('practitioners')
        .update({
          pricing: servicePricingArray,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', practitionerId);

      if (error) throw error;

      console.log('[MatchSettingsManager] ✓ Service pricing synced to practitioners.pricing:', servicePricingArray);
      return true;
    } catch (error) {
      console.error('[MatchSettingsManager] Error syncing service pricing:', error);
      throw error;
    }
  }

  /**
   * Remove service category
   */
  async removeServiceCategory(serviceId) {
    try {
      const { error } = await this.supabase
        .from('practitioner_selected_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      this.selectedServices = this.selectedServices.filter(s => s.id !== serviceId);
      console.log('[MatchSettingsManager] Service category removed:', serviceId);
      return true;
    } catch (error) {
      console.error('[MatchSettingsManager] Error removing service category:', error);
      throw error;
    }
  }

  // ================================================================
  // AVAILABILITY & SCHEDULE
  // ================================================================

  /**
   * Load practitioner data (including availability_schedule)
   */
  async loadPractitionerData() {
    try {
      const { data, error } = await this.supabase
        .from('practitioners')
        .select('id, availability_schedule')
        .eq('id', this.practitionerId)
        .single();

      if (error) throw error;
      this.practitioners = data;
      console.log('[MatchSettingsManager] Practitioner data loaded');
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error loading practitioner data:', error);
      return null;
    }
  }

  /**
   * Get availability schedule
   */
  getAvailabilitySchedule() {
    return this.practitioners?.availability_schedule || this.getDefaultAvailabilitySchedule();
  }

  /**
   * Get default availability schedule
   */
  getDefaultAvailabilitySchedule() {
    return {
      timezone: 'America/Denver',
      week: {
        monday: { available: true, open: '09:00', close: '17:00' },
        tuesday: { available: true, open: '09:00', close: '17:00' },
        wednesday: { available: true, open: '09:00', close: '17:00' },
        thursday: { available: true, open: '09:00', close: '17:00' },
        friday: { available: true, open: '09:00', close: '17:00' },
        saturday: { available: false, open: null, close: null },
        sunday: { available: false, open: null, close: null }
      }
    };
  }

  /**
   * Update availability schedule
   */
  async updateAvailabilitySchedule(schedule) {
    try {
      const { data, error } = await this.supabase
        .from('practitioners')
        .update({ availability_schedule: schedule, updated_at: new Date().toISOString() })
        .eq('id', this.practitionerId)
        .select()
        .single();

      if (error) throw error;
      this.practitioners = data;
      console.log('[MatchSettingsManager] Availability schedule updated');
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error updating availability schedule:', error);
      throw error;
    }
  }

  /**
   * Update specific day's availability
   */
  async updateDayAvailability(day, available, openTime = null, closeTime = null) {
    const schedule = this.getAvailabilitySchedule();
    schedule.week[day] = {
      available,
      open: available ? openTime : null,
      close: available ? closeTime : null
    };
    return this.updateAvailabilitySchedule(schedule);
  }

  /**
   * Update timezone
   */
  async updateTimezone(timezone) {
    const schedule = this.getAvailabilitySchedule();
    schedule.timezone = timezone;
    return this.updateAvailabilitySchedule(schedule);
  }

  // ================================================================
  // MATCHING STATUS
  // ================================================================

  /**
   * Activate matching
   */
  async activateMatching() {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .update({ 
          is_matching_active: true, 
          matching_activated_at: new Date().toISOString(),
          is_paused: false,
          pause_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('practitioner_id', this.practitionerId)
        .select()
        .single();

      if (error) throw error;
      this.matchSettings = data;
      console.log('[MatchSettingsManager] Matching activated');
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error activating matching:', error);
      throw error;
    }
  }

  /**
   * Deactivate matching
   */
  async deactivateMatching() {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .update({ 
          is_matching_active: false, 
          updated_at: new Date().toISOString()
        })
        .eq('practitioner_id', this.practitionerId)
        .select()
        .single();

      if (error) throw error;
      this.matchSettings = data;
      console.log('[MatchSettingsManager] Matching deactivated');
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error deactivating matching:', error);
      throw error;
    }
  }

  /**
   * Pause matching until a specific time
   */
  async pauseMatching(pauseUntil, reason = null) {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .update({ 
          is_paused: true, 
          pause_until: pauseUntil,
          pause_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('practitioner_id', this.practitionerId)
        .select()
        .single();

      if (error) throw error;
      this.matchSettings = data;
      console.log('[MatchSettingsManager] Matching paused until:', pauseUntil);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error pausing matching:', error);
      throw error;
    }
  }

  /**
   * Resume matching
   */
  async resumeMatching() {
    try {
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .update({ 
          is_paused: false, 
          pause_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('practitioner_id', this.practitionerId)
        .select()
        .single();

      if (error) throw error;
      this.matchSettings = data;
      console.log('[MatchSettingsManager] Matching resumed');
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error resuming matching:', error);
      throw error;
    }
  }

  /**
   * Check if matching is active
   */
  isMatchingActive() {
    return this.matchSettings?.is_matching_active || false;
  }

  /**
   * Check if matching is paused
   */
  isMatchingPaused() {
    return this.matchSettings?.is_paused || false;
  }

  /**
   * Get pause status details
   */
  getPauseStatus() {
    return {
      isPaused: this.isMatchingPaused(),
      pauseUntil: this.matchSettings?.pause_until,
      pauseReason: this.matchSettings?.pause_reason,
      pausedAt: this.matchSettings?.paused_at
    };
  }

  // ================================================================
  // SYNC & UTILITY
  // ================================================================

  /**
   * Refresh all data from database
   */
  async refreshAll() {
    await this.loadMatchSettings();
    await this.loadSelectedServices();
    await this.loadPractitionerData();
    console.log('[MatchSettingsManager] All data refreshed');
  }

  /**
   * Export all settings as JSON (for backup/debugging)
   */
  exportSettings() {
    return {
      matchSettings: this.matchSettings,
      selectedServices: this.selectedServices,
      practitionerData: this.practitioners,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Get complete settings summary
   */
  getSummary() {
    return {
      practitionerId: this.practitionerId,
      matchingActive: this.isMatchingActive(),
      matchingPaused: this.isMatchingPaused(),
      coverageAreas: {
        inOffice: this.isTravelTypeEnabled('in_office'),
        houseCalls: this.isTravelTypeEnabled('house_calls'),
        virtualRemote: this.isTravelTypeEnabled('virtual_remote')
      },
      serviceCategories: {
        total: this.selectedServices.length,
        active: this.getActiveServices().length,
        inactive: this.getInactiveServices().length
      },
      timezone: this.getAvailabilitySchedule().timezone
    };
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatchSettingsManager;
}
