// Vehicle Tracking API Module
// Handles real-time GPS tracking and vehicle location updates

import supabase from '../config/supabase.js';

/**
 * Record vehicle location
 * @param {string} vehicleId - Vehicle ID
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {number} speed - Speed in km/h
 * @param {number} heading - Direction in degrees
 * @param {number} batteryPercentage - Battery percentage
 * @returns {Promise<Object>} - { location, error }
 */
export async function recordVehicleLocation(vehicleId, latitude, longitude, speed = 0, heading = 0, batteryPercentage = null) {
  try {
    const supabase = await getSupabaseClient();
    const { data: location, error } = await supabase
      .from('vehicle_tracking')
      .insert([
        {
          vehicle_id: vehicleId,
          latitude,
          longitude,
          speed,
          heading,
          battery_percentage: batteryPercentage
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update vehicle's current location
    await supabase
      .from('vehicles')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString()
      })
      .eq('id', vehicleId);

    return { location, error: null };
  } catch (error) {
    console.error('[v0] Record location error:', error);
    return { location: null, error };
  }
}

/**
 * Get latest location for all vehicles
 * @returns {Promise<Object>} - { vehicles, error }
 */
export async function getLatestVehicleLocations() {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        name,
        registration_plate,
        class,
        status,
        current_latitude,
        current_longitude,
        last_location_update,
        vehicle_pricing (*)
      `)
      .not('current_latitude', 'is', null);

    if (error) throw error;
    return { vehicles, error: null };
  } catch (error) {
    console.error('[v0] Get vehicle locations error:', error);
    return { vehicles: [], error };
  }
}

/**
 * Get latest location for a specific vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - { location, error }
 */
export async function getLatestVehicleLocation(vehicleId) {
  try {
    const supabase = await getSupabaseClient();
    const { data: location, error } = await supabase
      .from('vehicle_tracking')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { location, error: null };
  } catch (error) {
    console.error('[v0] Get latest location error:', error);
    return { location: null, error };
  }
}

/**
 * Get vehicle location history
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - { locations, error }
 */
export async function getVehicleLocationHistory(vehicleId, filters = {}) {
  try {
    let query = supabase
      .from('vehicle_tracking')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (filters.startDate) {
      query = query.gte('recorded_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('recorded_at', filters.endDate);
    }

    const limit = filters.limit || 500;
    const { data: locations, error } = await query
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { locations: locations.reverse(), error: null };
  } catch (error) {
    console.error('[v0] Get location history error:', error);
    return { locations: [], error };
  }
}

/**
 * Get vehicle tracking summary
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} - { summary, error }
 */
export async function getVehicleTrackingSummary(vehicleId) {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError) throw vehicleError;

    const { data: locations, error: locError } = await supabase
      .from('vehicle_tracking')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (locError && locError.code !== 'PGRST116') {
      throw locError;
    }

    const latestLocation = locations?.[0] || null;

    const summary = {
      vehicle_id: vehicleId,
      vehicle_name: vehicle.name,
      registration_plate: vehicle.registration_plate,
      status: vehicle.status,
      current_latitude: vehicle.current_latitude,
      current_longitude: vehicle.current_longitude,
      last_location_update: vehicle.last_location_update,
      last_speed: latestLocation?.speed || 0,
      last_heading: latestLocation?.heading || 0,
      battery_percentage: latestLocation?.battery_percentage || null
    };

    return { summary, error: null };
  } catch (error) {
    console.error('[v0] Get tracking summary error:', error);
    return { summary: null, error };
  }
}

/**
 * Get all vehicles tracking data (for map display)
 * @returns {Promise<Object>} - { trackingData, error }
 */
export async function getAllVehiclesTrackingData() {
  try {
    const supabase = await getSupabaseClient();
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        name,
        registration_plate,
        class,
        status,
        current_latitude,
        current_longitude,
        last_location_update,
        vehicle_pricing (*)
      `)
      .not('current_latitude', 'is', null)
      .order('name');

    if (error) throw error;

    // Get latest location for each vehicle
    const trackingData = await Promise.all(
      vehicles.map(async (vehicle) => {
        const { location } = await getLatestVehicleLocation(vehicle.id);
        return {
          ...vehicle,
          speed: location?.speed || 0,
          heading: location?.heading || 0,
          battery_percentage: location?.battery_percentage || null
        };
      })
    );

    return { trackingData, error: null };
  } catch (error) {
    console.error('[v0] Get all tracking data error:', error);
    return { trackingData: [], error };
  }
}

/**
 * Subscribe to real-time vehicle tracking updates
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToVehicleTracking(callback) {
  const subscription = supabase
    .channel('vehicle_tracking_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'vehicle_tracking'
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to specific vehicle location updates
 * @param {string} vehicleId - Vehicle ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToVehicleLocationUpdates(vehicleId, callback) {
  const subscription = supabase
    .channel(`vehicle_location_${vehicleId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vehicles',
        filter: `id=eq.${vehicleId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get distance traveled by vehicle in time period
 * @param {string} vehicleId - Vehicle ID
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {Promise<Object>} - { distance, error }
 */
export async function getDistanceTraveled(vehicleId, startDate, endDate) {
  try {
    const supabase = await getSupabaseClient();
    const { locations, error } = await getVehicleLocationHistory(vehicleId, {
      startDate,
      endDate,
      limit: 10000
    });

    if (error) throw error;

    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      const curr = locations[i];
      const next = locations[i + 1];
      totalDistance += calculateDistance(curr.latitude, curr.longitude, next.latitude, next.longitude);
    }

    return { distance: parseFloat(totalDistance.toFixed(2)), error: null };
  } catch (error) {
    console.error('[v0] Get distance traveled error:', error);
    return { distance: 0, error };
  }
}
