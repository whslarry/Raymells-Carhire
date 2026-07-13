import { initializeSupabase, supabase } from './supabase.js';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSupabase();
  loadBookingDetails();
});

/**
 * Load booking details from URL and database
 */
async function loadBookingDetails() {
  try {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('id');
    const bookingRef = params.get('ref');

    if (!bookingId) {
      showError('No booking ID provided');
      return;
    }

    // Fetch booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, vehicles(name, class, year, fuel_type), customer_profiles(full_name, email, phone)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      showError('Booking not found');
      return;
    }

    // Display booking reference
    document.getElementById('booking-ref').textContent = booking.booking_ref || bookingRef || 'N/A';

    // Display vehicle info
    if (booking.vehicles) {
      document.getElementById('vehicle-info').innerHTML = `
        <p><strong>${booking.vehicles.name}</strong></p>
        <p>${booking.vehicles.class} • ${booking.vehicles.year} • ${booking.vehicles.fuel_type}</p>
      `;
    }

    // Display rental info
    const pickupDate = new Date(booking.pickup_date);
    const returnDate = new Date(booking.return_date);
    document.getElementById('rental-info').innerHTML = `
      <p><strong>Pickup:</strong> ${pickupDate.toLocaleString()}</p>
      <p><strong>Return:</strong> ${returnDate.toLocaleString()}</p>
      <p><strong>Duration:</strong> ${booking.rental_type}</p>
    `;

    // Display total price
    document.getElementById('total-price').textContent = `$${parseFloat(booking.total_price).toFixed(2)}`;

    // Log confirmation
    console.log('[v0] Booking confirmation loaded:', booking.booking_ref);
  } catch (error) {
    console.error('[v0] Error loading booking details:', error);
    showError('Error loading booking details');
  }
}

/**
 * Show error message
 */
function showError(message) {
  const details = document.getElementById('booking-details');
  details.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
      <a href="booking.html" class="btn btn-primary">Return to Booking</a>
    </div>
  `;
}

/**
 * Copy booking reference to clipboard
 */
window.copyToClipboard = function() {
  const refElement = document.getElementById('booking-ref');
  const text = refElement.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
};
