// Vehicles API Module
// Handles vehicle management and retrieval

import getSupabaseClient from '../config/supabase.js';

/**
 * Get all vehicles
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - { vehicles, error }
 */
export async function getAllVehicles(filters = {}) {
  try {
    const supabase = await getSupabaseClient();
    let query = supabase.from('vehicles').select(`
      *,
      vehicle_pricing (*)
    `);

    if (filters.class) {
      query = query.eq('class', filters.class);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.fuelType) {
      query = query.eq('fuel_type', filters.fuelType);
    }

    const { data: vehicles, error } = await query.order('name');

    if (error) throw error;
    return { vehicles, error: null };
  } catch (error) {
    console.error('[v0] Get vehicles error:', error);
    return { vehicles: [], error };
  }
}

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - { vehicle, error }
 */
export async function getVehicleById(vehicleId) {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_pricing (*)
      `)
      .eq('id', vehicleId)
      .single();

    if (error) throw error;
    return { vehicle, error: null };
  } catch (error) {
    console.error('[v0] Get vehicle error:', error);
    return { vehicle: null, error };
  }
}

/**
 * Get available vehicles for rental period
 * @param {string} pickupDate - Pickup date ISO string
 * @param {string} returnDate - Return date ISO string
 * @param {string} vehicleClass - Optional vehicle class filter
 * @returns {Promise<Object>} - { vehicles, error }
 */
export async function getAvailableVehicles(pickupDate, returnDate, vehicleClass = null) {
  try {
    const supabase = await getSupabaseClient();
    let query = supabase.from('vehicles').select(`
      *,
      vehicle_pricing (*)
    `).eq('status', 'available');

    if (vehicleClass) {
      query = query.eq('class', vehicleClass);
    }

    const { data: vehicles, error } = await query;

    if (error) throw error;

    // Filter out vehicles with conflicting bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .eq('status', 'confirmed')
      .eq('status', 'active')
      .gte('return_date', pickupDate)
      .lte('pickup_date', returnDate);

    if (bookingError && bookingError.code !== 'PGRST116') {
      throw bookingError;
    }

    const bookedVehicleIds = new Set(bookings?.map(b => b.vehicle_id) || []);
    const availableVehicles = vehicles.filter(v => !bookedVehicleIds.has(v.id));

    return { vehicles: availableVehicles, error: null };
  } catch (error) {
    console.error('[v0] Get available vehicles error:', error);
    return { vehicles: [], error };
  }
}

/**
 * Get vehicles by class
 * @param {string} vehicleClass - Vehicle class (economy, compact, midsize, luxury, suv, van)
 * @returns {Promise<Object>} - { vehicles, error }
 */
export async function getVehiclesByClass(vehicleClass) {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_pricing (*)
      `)
      .eq('class', vehicleClass)
      .order('name');

    if (error) throw error;
    return { vehicles, error: null };
  } catch (error) {
    console.error('[v0] Get vehicles by class error:', error);
    return { vehicles: [], error };
  }
}

/**
 * Create new vehicle (admin only)
 * @param {Object} vehicleData - Vehicle data
 * @returns {Promise<Object>} - { vehicle, error }
 */
export async function createVehicle(vehicleData) {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) throw error;
    return { vehicle, error: null };
  } catch (error) {
    console.error('[v0] Create vehicle error:', error);
    return { vehicle: null, error };
  }
}

/**
 * Update vehicle (admin only)
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} vehicleData - Vehicle data to update
 * @returns {Promise<Object>} - { vehicle, error }
 */
export async function updateVehicle(vehicleId, vehicleData) {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return { vehicle, error: null };
  } catch (error) {
    console.error('[v0] Update vehicle error:', error);
    return { vehicle: null, error };
  }
}

/**
 * Delete vehicle (admin only)
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - { error }
 */
export async function deleteVehicle(vehicleId) {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[v0] Delete vehicle error:', error);
    return { error };
  }
}

/**
 * Update vehicle pricing
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} pricing - Pricing data
 * @returns {Promise<Object>} - { pricing, error }
 */
export async function updateVehiclePricing(vehicleId, pricing) {
  try {
    const supabase = await getSupabaseClient();
    const { data: existingPricing } = await supabase
      .from('vehicle_pricing')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();

    let result;
    if (existingPricing) {
      result = await supabase
        .from('vehicle_pricing')
        .update(pricing)
        .eq('vehicle_id', vehicleId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('vehicle_pricing')
        .insert([{ vehicle_id: vehicleId, ...pricing }])
        .select()
        .single();
    }

    const { data, error } = result;
    if (error) throw error;
    return { pricing: data, error: null };
  } catch (error) {
    console.error('[v0] Update pricing error:', error);
    return { pricing: null, error };
  }
}

/**
 * Get vehicle pricing
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - { pricing, error }
 */
export async function getVehiclePricing(vehicleId) {
  try {
    const supabase = await getSupabaseClient();
    const { data: pricing, error } = await supabase
      .from('vehicle_pricing')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { pricing, error: null };
  } catch (error) {
    console.error('[v0] Get pricing error:', error);
    return { pricing: null, error };
  }
}

/**
 * Get all vehicle classes
 * @returns {Promise<Object>} - { classes, error }
 */
export async function getVehicleClasses() {
  return {
    classes: ['economy', 'compact', 'midsize', 'luxury', 'suv', 'van'],
    error: null
  };
}

/**
 * Update vehicle location (GPS tracking)
 * @param {string} vehicleId - Vehicle ID
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} - { vehicle, error }
 */
export async function updateVehicleLocation(vehicleId, latitude, longitude) {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString()
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;

    // Log the location in vehicle_tracking table
    await supabase.from('vehicle_tracking').insert([
      {
        vehicle_id: vehicleId,
        latitude,
        longitude
      }
    ]);

    return { vehicle, error: null };
  } catch (error) {
    console.error('[v0] Update location error:', error);
    return { vehicle: null, error };
  }
}

/**
 * Get vehicle tracking history
 * @param {string} vehicleId - Vehicle ID
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Object>} - { locations, error }
 */
export async function getVehicleTrackingHistory(vehicleId, limit = 100) {
  try {
    const supabase = await getSupabaseClient();
    const { data: locations, error } = await supabase
      .from('vehicle_tracking')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { locations: locations.reverse(), error: null };
  } catch (error) {
    console.error('[v0] Get tracking history error:', error);
    return { locations: [], error };
  }
}
