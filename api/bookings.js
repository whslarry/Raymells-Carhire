import { supabase } from './supabase.js';

/**
 * Create a new booking
 */
export async function createBooking(bookingData) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;
    return { booking: data };
  } catch (error) {
    return { error };
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(bookingId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return { booking: data };
  } catch (error) {
    return { error };
  }
}

/**
 * Get customer bookings
 */
export async function getCustomerBookings(customerId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, vehicles(name, image_url, class)')
      .eq('customer_id', customerId)
      .order('pickup_date', { ascending: false });

    if (error) throw error;
    return { bookings: data };
  } catch (error) {
    return { error };
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(bookingId, status) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { booking: data };
  } catch (error) {
    return { error };
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(bookingId, reason = '') {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { booking: data };
  } catch (error) {
    return { error };
  }
}

/**
 * Calculate rental price
 */
export function calculateRentalPrice(pickupDate, returnDate, rentalType, pricing = {}) {
  const pickup = new Date(pickupDate);
  const returnDt = new Date(returnDate);
  const diffMs = returnDt - pickup;

  let units = 0;
  let rate = 0;

  switch (rentalType) {
    case 'hourly':
      units = diffMs / (1000 * 60 * 60);
      rate = pricing.hourly_rate || 0;
      break;
    case 'daily':
      units = diffMs / (1000 * 60 * 60 * 24);
      rate = pricing.daily_rate || 0;
      break;
    case 'weekly':
      units = diffMs / (1000 * 60 * 60 * 24 * 7);
      rate = pricing.weekly_rate || 0;
      break;
    case 'monthly':
      units = diffMs / (1000 * 60 * 60 * 24 * 30);
      rate = pricing.monthly_rate || 0;
      break;
  }

  const totalPrice = Math.ceil(units) * rate;
  return {
    units: Math.ceil(units),
    rate,
    totalPrice: isNaN(totalPrice) ? 0 : totalPrice
  };
}

/**
 * Get available vehicles for date range
 */
export async function getAvailableVehicles(pickupDate, returnDate) {
  try {
    // Get all vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active');

    if (vehiclesError) throw vehiclesError;

    // Get conflicting bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .eq('status', 'confirmed')
      .gte('return_date', pickupDate)
      .lte('pickup_date', returnDate);

    if (bookingsError) throw bookingsError;

    const bookedVehicleIds = (bookings || []).map(b => b.vehicle_id);
    const available = vehicles.filter(v => !bookedVehicleIds.includes(v.id));

    return { vehicles: available };
  } catch (error) {
    return { error };
  }
}

/**
 * Get all bookings (admin)
 */
export async function getAllBookings(filters = {}) {
  try {
    let query = supabase
      .from('bookings')
      .select('*, customer_profiles(full_name, email), vehicles(name, class)');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.vehicleId) {
      query = query.eq('vehicle_id', filters.vehicleId);
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query.order('pickup_date', { ascending: false });

    if (error) throw error;
    return { bookings: data };
  } catch (error) {
    return { error };
  }
}

/**
 * Get booking statistics
 */
export async function getBookingStats() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status, total_price');

    if (error) throw error;

    const stats = {
      totalBookings: data.length,
      confirmedBookings: data.filter(b => b.status === 'confirmed').length,
      totalRevenue: data.reduce((sum, b) => sum + (b.total_price || 0), 0)
    };

    return { stats };
  } catch (error) {
    return { error };
  }
}
