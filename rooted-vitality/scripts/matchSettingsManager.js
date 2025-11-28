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
    
    // Verify authenticated user matches practitioner ID
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user && user.id !== practitionerId) {
        console.warn('[MatchSettingsManager] WARNING: Auth user ID does not match practitioner ID', {
          authUserId: user.id,
          practitionerId: practitionerId
        });
      } else if (user) {
        console.log('[MatchSettingsManager] Auth user verified:', user.id);
      }
    } catch (err) {
      console.warn('[MatchSettingsManager] Could not verify auth user:', err);
    }
    
    // Load practitioner data FIRST so practitionerSerial is available for other queries
    await this.loadPractitionerData();
    await this.loadMatchSettings();
    await this.loadSelectedServices();
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
      console.log('[MatchSettingsManager] loadMatchSettings() called');
      console.log('[MatchSettingsManager] DEBUG - this.practitionerSerial:', this.practitionerSerial);
      console.log('[MatchSettingsManager] DEBUG - this.practitionerId:', this.practitionerId);
      
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .select('*')
        .eq('practitioner_serial', this.practitionerSerial);

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
      // Debug: Check current auth user and practitioner data
      const { data: { user } } = await this.supabase.auth.getUser();
      console.log('[MatchSettingsManager] DEBUG - Auth user ID:', user?.id);
      console.log('[MatchSettingsManager] DEBUG - Practitioner ID:', this.practitionerId);
      console.log('[MatchSettingsManager] DEBUG - Practitioner Serial:', this.practitionerSerial);
      
      // Verify the practitioner exists with this ID
      const { data: practitionerCheck } = await this.supabase
        .from('practitioners')
        .select('id, serial_number')
        .eq('id', this.practitionerId)
        .single();
      console.log('[MatchSettingsManager] DEBUG - Practitioner check:', practitionerCheck);

      const defaultSettings = {
        practitioner_serial: this.practitionerSerial,
        matching_enabled: false,
        matching_paused: false,
        paused_at: null,
        target_response_time_minutes: 24,
        max_active_matches: 10,
        auto_accept_matches: false,
        notification_frequency: 'daily',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[MatchSettingsManager] DEBUG - Attempting insert with data:', defaultSettings);

      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) {
        console.error('[MatchSettingsManager] DEBUG - Insert error:', error);
        throw error;
      }

      this.matchSettings = data;
      console.log('[MatchSettingsManager] Default match settings created:', data);
      return data;
    } catch (error) {
      console.error('[MatchSettingsManager] Error creating default match settings:', error);
      // Return an in-memory default if we can't persist to DB
      this.matchSettings = {
        practitioner_serial: this.practitionerSerial,
        matching_enabled: false,
        matching_paused: false,
        target_response_time_minutes: 24,
        max_active_matches: 10,
        auto_accept_matches: false,
        notification_frequency: 'daily'
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
        .eq('practitioner_serial', this.practitionerSerial)
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
      // First, get all practitioner services with basic info
      const { data: services, error: servicesError } = await this.supabase
        .from('practitioner_selected_services')
        .select('id, taxonomy_id, subcategory_id, is_active, price_per_service, created_at, updated_at')
        .eq('practitioner_serial', this.practitionerSerial);

      if (servicesError) {
        console.error('[MatchSettingsManager] Query error details:', servicesError);
        throw servicesError;
      }

      if (!services || services.length === 0) {
        this.selectedServices = [];
        console.log('[MatchSettingsManager] No selected services found');
        return [];
      }

      // Get all taxonomy categories and subcategories in one query
      const taxonomyIds = [...new Set(services.map(s => s.taxonomy_id))];
      const subcategoryIds = [...new Set(services.map(s => s.subcategory_id))];

      const { data: taxonomies } = await this.supabase
        .from('holistic_health_taxonomy')
        .select('id, name')
        .in('id', taxonomyIds);

      const { data: subcategories } = await this.supabase
        .from('taxonomy_subcategories')
        .select('id, name')
        .in('id', subcategoryIds);

      // Create lookup maps
      const taxMap = {};
      const subMap = {};
      (taxonomies || []).forEach(t => { taxMap[t.id] = t.name; });
      (subcategories || []).forEach(s => { subMap[s.id] = s.name; });

      // Transform data to include names
      this.selectedServices = services.map(service => ({
        ...service,
        category_name: taxMap[service.taxonomy_id] || 'Unknown',
        category_id: service.taxonomy_id,
        subcategory_name: subMap[service.subcategory_id] || 'Unknown'
      }));

      console.log('[MatchSettingsManager] Selected services loaded:', this.selectedServices.length);
      return this.selectedServices;
    } catch (error) {
      console.error('[MatchSettingsManager] Error loading selected services:', error);
      this.selectedServices = [];
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
      
      console.log('[MatchSettingsManager] addServiceCategory called with:', { categoryIdOrTaxonomyId, subcategoryNameOrId, pricePerService, isFirstUUID: isUUID(categoryIdOrTaxonomyId), isSecondUUID: isUUID(subcategoryNameOrId) });
      
      // If first param is UUID and second param is NOT UUID, then first is taxonomyId and second is subcategoryName
      if (isUUID(categoryIdOrTaxonomyId) && !isUUID(subcategoryNameOrId)) {
        // UU UUID for taxonomy, string name for subcategory
        taxonomyId = categoryIdOrTaxonomyId;
        const subcategoryName = subcategoryNameOrId;

        console.log('[MatchSettingsManager] Using as UUID taxonomy + subcategory name:', { taxonomyId, subcategoryName });

        // Look up subcategory ID from name
        const { data: subcatData, error: subcatError } = await this.supabase
          .from('taxonomy_subcategories')
          .select('id')
          .eq('taxonomy_id', taxonomyId)
          .eq('name', subcategoryName)
          .single();

        console.log('[MatchSettingsManager] Subcategory lookup result:', { subcatData, subcatError });

        if (subcatError || !subcatData) {
          throw new Error(`Subcategory "${subcategoryName}" not found under taxonomy "${taxonomyId}". Error: ${subcatError?.message || 'Not found'}`);
        }
        subcategoryId = subcatData.id;
      } else if (isUUID(categoryIdOrTaxonomyId) && isUUID(subcategoryNameOrId)) {
        // Both are UUIDs - use directly
        taxonomyId = categoryIdOrTaxonomyId;
        subcategoryId = subcategoryNameOrId;
        console.log('[MatchSettingsManager] Using both as UUIDs directly');
      } else {
        // Neither are UUIDs - look up by category_id and subcategory name
        const categoryId = categoryIdOrTaxonomyId;
        const subcategoryName = subcategoryNameOrId;

        console.log('[MatchSettingsManager] Looking up taxonomy for categoryId:', categoryId);
        
        // Look up taxonomy ID from category_id
        const { data: taxonomyData, error: taxonomyError } = await this.supabase
          .from('holistic_health_taxonomy')
          .select('id')
          .eq('category_id', categoryId)
          .single();

        console.log('[MatchSettingsManager] Taxonomy lookup result:', { taxonomyData, taxonomyError });

        if (taxonomyError || !taxonomyData) {
          throw new Error(`Category "${categoryId}" not found in taxonomy. Error: ${taxonomyError?.message || 'Not found'}`);
        }
        taxonomyId = taxonomyData.id;

        console.log('[MatchSettingsManager] Looking up subcategory:', subcategoryName, 'under taxonomy:', taxonomyId);

        // Look up subcategory ID from name
        const { data: subcatData, error: subcatError } = await this.supabase
          .from('taxonomy_subcategories')
          .select('id')
          .eq('taxonomy_id', taxonomyId)
          .eq('name', subcategoryName)
          .single();

        console.log('[MatchSettingsManager] Subcategory lookup result:', { subcatData, subcatError });

        if (subcatError || !subcatData) {
          throw new Error(`Subcategory "${subcategoryName}" not found under category "${categoryId}". Error: ${subcatError?.message || 'Not found'}`);
        }
        subcategoryId = subcatData.id;
      }

      // Try direct INSERT with onConflict for upsert behavior
      // This avoids separate SELECT/UPDATE queries that might trigger RLS differently
      console.log('[MatchSettingsManager] Attempting to insert service with conflict handling');
      
      const insertData = {
        practitioner_serial: this.practitionerSerial,
        taxonomy_id: taxonomyId,
        subcategory_id: subcategoryId,
        is_active: false,  // Default to inactive
        price_per_service: pricePerService || null
      };

      console.log('[MatchSettingsManager] Insert data:', insertData);

      // Try simple INSERT first
      let result = await this.supabase
        .from('practitioner_selected_services')
        .insert([insertData])
        .select();

      let data = result.data?.[0];
      let error = result.error;

      // If RLS error, try getting current user info for debugging
      if (error && error.code === '42501') {
        try {
          const { data: { user } } = await this.supabase.auth.getUser();
          console.warn('[MatchSettingsManager] RLS Policy Error - Auth user:', user?.id, 'Practitioner Serial:', this.practitionerSerial);
        } catch (e) {
          console.warn('[MatchSettingsManager] Could not get current user for RLS debug');
        }
      }

      // If unique constraint error, try update via raw SQL or different approach
      if (error && error.code === '23505') {
        console.log('[MatchSettingsManager] Unique constraint violation, trying alternative update');
        
        // Build filter to find existing row
        const { data: existing } = await this.supabase
          .from('practitioner_selected_services')
          .select('id')
          .eq('practitioner_serial', this.practitionerSerial)
          .eq('taxonomy_id', taxonomyId)
          .eq('subcategory_id', subcategoryId)
          .maybeSingle();  // Use maybeSingle() instead of single() to avoid RLS issues

        if (existing?.id) {
          console.log('[MatchSettingsManager] Found existing service, updating:', existing.id);
          
          const updateResult = await this.supabase
            .from('practitioner_selected_services')
            .update({
              price_per_service: pricePerService || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          
          data = updateResult.data;
          error = updateResult.error;
        } else {
          console.warn('[MatchSettingsManager] Could not find existing record to update');
        }
      }

      if (error) {
        console.error('[MatchSettingsManager] Failed to insert/update service:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        
        // If RLS error, provide helpful message
        if (error.code === '42501') {
          console.error('[MatchSettingsManager] RLS POLICY ERROR: The database policy is blocking this insert. Ensure the RLS policy on practitioner_selected_services allows INSERT for authenticated users with matching practitioner_serial.');
          throw new Error(`Database permission error: The RLS policy on practitioner_selected_services is blocking this operation. Contact administrator. Details: ${error.message}`);
        }
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

      // Extract unique category names for service_category_names array
      const categoryNamesSet = new Set(this.selectedServices.map(s => s.category_name));
      const serviceCategoryNames = Array.from(categoryNamesSet).filter(name => name); // Remove falsy values

      // Extract unique subcategory names for service_subcategory_names array
      const subcategoryNamesSet = new Set(this.selectedServices.map(s => s.subcategory_name));
      const serviceSubcategoryNames = Array.from(subcategoryNamesSet).filter(name => name); // Remove falsy values

      // Save to practitioners table
      const { error } = await this.supabase
        .from('practitioners')
        .update({
          pricing: servicePricingArray,
          service_category_names: serviceCategoryNames,
          service_subcategory_names: serviceSubcategoryNames,
          updated_at: new Date().toISOString()
        })
        .eq('id', practitionerId);

      if (error) throw error;

      console.log('[MatchSettingsManager] ✓ Service pricing synced to practitioners.pricing:', servicePricingArray);
      console.log('[MatchSettingsManager] ✓ Service categories synced to practitioners.service_category_names:', serviceCategoryNames);
      console.log('[MatchSettingsManager] ✓ Service subcategories synced to practitioners.service_subcategory_names:', serviceSubcategoryNames);
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
      console.log('[MatchSettingsManager] removeServiceCategory called with:', {
        serviceId,
        practitionerSerial: this.practitionerSerial,
        practitionerId: this.practitionerId
      });

      // Use RPC function to delete service (bypasses RLS)
      console.log('[MatchSettingsManager] Calling delete_practitioner_service RPC for:', serviceId);

      const { data: deleteResult, error: deleteError } = await this.supabase.rpc(
        'delete_practitioner_service',
        { p_service_id: serviceId }
      );

      if (deleteError) {
        console.error('[MatchSettingsManager] RPC DELETE error:', deleteError);
        throw deleteError;
      }

      console.log('[MatchSettingsManager] ✓ Service deleted via RPC:', deleteResult);

      // Remove from local array
      this.selectedServices = this.selectedServices.filter(s => s.id !== serviceId);
      console.log('[MatchSettingsManager] Removed from local array, now have:', this.selectedServices.length, 'services');

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
        .select('id, serial_number, availability_schedule')
        .eq('id', this.practitionerId)
        .single();

      if (error) throw error;
      this.practitioners = data;
      // Set the practitioner serial for use in queries
      this.practitionerSerial = data.serial_number;
      console.log('[MatchSettingsManager] Practitioner data loaded, serial:', this.practitionerSerial);
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
      const activatedAt = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('practitioner_match_settings')
        .update({ 
          is_matching_active: true, 
          matching_activated_at: activatedAt,
          is_paused: false,
          pause_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('practitioner_serial', this.practitionerSerial)
        .select()
        .single();

      if (error) throw error;
      this.matchSettings = data;
      console.log('[MatchSettingsManager] Matching activated at:', activatedAt);
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
        .eq('practitioner_serial', this.practitionerSerial)
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
        .eq('practitioner_serial', this.practitionerSerial)
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
        .eq('practitioner_serial', this.practitionerSerial)
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

























































