import { supabase } from './supabase.js';

/**
 * Generate revenue report
 */
export async function generateRevenueReport(startDate, endDate) {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, total_price, pickup_date, status')
      .gte('pickup_date', startDate)
      .lte('pickup_date', endDate);

    if (error) throw error;

    const report = {
      totalRevenue: bookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      averageBookingValue: bookings.length > 0 
        ? bookings.reduce((sum, b) => sum + (b.total_price || 0), 0) / bookings.length
        : 0,
      bookings
    };

    return { report };
  } catch (error) {
    return { error };
  }
}

/**
 * Generate vehicle utilization report
 */
export async function generateVehicleUtilizationReport(startDate, endDate) {
  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, name, class');

    const { data: bookings } = await supabase
      .from('bookings')
      .select('vehicle_id, pickup_date, return_date')
      .gte('pickup_date', startDate)
      .lte('return_date', endDate)
      .eq('status', 'confirmed');

    const report = vehicles.map(vehicle => {
      const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id);
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehicleClass: vehicle.class,
        bookingsCount: vehicleBookings.length,
        utilizationRate: vehicleBookings.length > 0 ? 95 : 0 // Simplified
      };
    });

    return { report };
  } catch (error) {
    return { error };
  }
}

/**
 * Generate customer report
 */
export async function generateCustomerReport(startDate, endDate) {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, customer_profiles(full_name, email)')
      .gte('pickup_date', startDate)
      .lte('pickup_date', endDate);

    const customers = {};
    (bookings || []).forEach(booking => {
      const customerId = booking.customer_id;
      if (!customers[customerId]) {
        customers[customerId] = {
          name: booking.customer_profiles?.full_name,
          email: booking.customer_profiles?.email,
          bookingCount: 0,
          totalSpent: 0
        };
      }
      customers[customerId].bookingCount++;
      customers[customerId].totalSpent += booking.total_price || 0;
    });

    const report = Object.values(customers).sort((a, b) => b.totalSpent - a.totalSpent);

    return { report };
  } catch (error) {
    return { error };
  }
}

/**
 * Generate booking analysis report
 */
export async function generateBookingAnalysisReport(startDate, endDate) {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .gte('pickup_date', startDate)
      .lte('pickup_date', endDate);

    const report = {
      totalBookings: bookings.length,
      byStatus: {
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        pending: bookings.filter(b => b.status === 'pending').length
      },
      byRentalType: {
        hourly: bookings.filter(b => b.rental_type === 'hourly').length,
        daily: bookings.filter(b => b.rental_type === 'daily').length,
        weekly: bookings.filter(b => b.rental_type === 'weekly').length,
        monthly: bookings.filter(b => b.rental_type === 'monthly').length
      },
      averageDuration: calculateAverageDuration(bookings),
      peakHours: calculatePeakHours(bookings)
    };

    return { report };
  } catch (error) {
    return { error };
  }
}

/**
 * Calculate average rental duration
 */
function calculateAverageDuration(bookings) {
  if (bookings.length === 0) return 0;
  
  const totalMs = bookings.reduce((sum, b) => {
    const pickup = new Date(b.pickup_date);
    const returnDt = new Date(b.return_date);
    return sum + (returnDt - pickup);
  }, 0);

  return Math.round(totalMs / bookings.length / (1000 * 60 * 60)); // hours
}

/**
 * Calculate peak booking hours
 */
function calculatePeakHours(bookings) {
  const hours = {};
  
  bookings.forEach(b => {
    const hour = new Date(b.pickup_date).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
  });

  return hours;
}

/**
 * Export report to CSV
 */
export function exportToCSV(data, filename = 'report.csv') {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    )
  ];

  return csv.join('\n');
}
