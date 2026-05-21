import { initializeSupabase, supabase } from './supabase.js';

// Initialize
let map = null;
let vehicleMarker = null;
let trackingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initializeSupabase();
  
  // Check for booking ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  
  if (bookingId) {
    document.getElementById('booking-id').value = bookingId;
    handleTrackingSubmit();
  }
  
  document.getElementById('tracking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleTrackingSubmit();
  });
});

/**
 * Handle tracking form submission
 */
async function handleTrackingSubmit() {
  const bookingId = document.getElementById('booking-id').value.trim();
  
  if (!bookingId) {
    alert('Please enter a booking ID');
    return;
  }

  try {
    // Fetch booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, vehicles(name, class, year, fuel_type), vehicle_locations(latitude, longitude, timestamp)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      alert('Booking not found. Please check your booking ID.');
      return;
    }

    // Display results
    displayTrackingResults(booking);
    initializeMap(booking);
    startRealTimeTracking(bookingId);
  } catch (error) {
    console.error('[v0] Tracking error:', error);
    alert('Error fetching booking details');
  }
}

/**
 * Display tracking results
 */
function displayTrackingResults(booking) {
  const resultsDiv = document.getElementById('tracking-results');
  const vehicleDetails = document.getElementById('vehicle-details');
  
  const pickupDate = new Date(booking.pickup_date);
  const returnDate = new Date(booking.return_date);
  
  vehicleDetails.innerHTML = `
    <div class="info-item">
      <span class="info-label">Vehicle:</span>
      <span class="info-value">${booking.vehicles?.name || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Class:</span>
      <span class="info-value">${booking.vehicles?.class || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Year:</span>
      <span class="info-value">${booking.vehicles?.year || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Fuel Type:</span>
      <span class="info-value">${booking.vehicles?.fuel_type || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Status:</span>
      <span class="info-value"><span class="status-badge ${booking.status}">${booking.status}</span></span>
    </div>
    <div class="info-item">
      <span class="info-label">Total Cost:</span>
      <span class="info-value">$${parseFloat(booking.total_price).toFixed(2)}</span>
    </div>
  `;

  // Display location info
  if (booking.vehicle_locations && booking.vehicle_locations.length > 0) {
    const location = booking.vehicle_locations[0];
    document.getElementById('location-info').innerHTML = `
      <p><strong>Latitude:</strong> ${location.latitude.toFixed(6)}</p>
      <p><strong>Longitude:</strong> ${location.longitude.toFixed(6)}</p>
      <p><strong>Last Updated:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
    `;
  } else {
    document.getElementById('location-info').innerHTML = `
      <p><strong>Location:</strong> Tracking data not yet available</p>
      <p>Location updates will appear here when vehicle is in use</p>
    `;
  }

  // Display status timeline
  displayStatusTimeline(booking);

  // Display alerts
  displayAlerts(booking);

  resultsDiv.style.display = 'block';
  window.scrollTo(0, resultsDiv.offsetTop - 100);
}

/**
 * Display status timeline
 */
function displayStatusTimeline(booking) {
  const timeline = document.getElementById('status-timeline');
  
  const events = [];
  const createdDate = new Date(booking.created_at || booking.pickup_date);
  const pickupDate = new Date(booking.pickup_date);
  const returnDate = new Date(booking.return_date);
  const now = new Date();

  events.push({
    status: 'Booking Confirmed',
    date: createdDate,
    icon: 'fa-calendar-check',
    completed: true
  });

  events.push({
    status: 'Vehicle Prepared',
    date: new Date(createdDate.getTime() + 3600000),
    icon: 'fa-wrench',
    completed: now > new Date(createdDate.getTime() + 3600000)
  });

  events.push({
    status: 'Ready for Pickup',
    date: pickupDate,
    icon: 'fa-check-circle',
    completed: now > pickupDate,
    active: now <= pickupDate && now > new Date(createdDate.getTime() + 3600000)
  });

  if (booking.status === 'completed') {
    events.push({
      status: 'Vehicle Returned',
      date: returnDate,
      icon: 'fa-undo',
      completed: true
    });
  } else if (now > pickupDate) {
    events.push({
      status: 'In Use',
      date: now,
      icon: 'fa-road',
      completed: false,
      active: true
    });
  }

  timeline.innerHTML = events
    .map(event => `
      <div class="timeline-item ${event.completed ? 'completed' : ''} ${event.active ? 'active' : ''}">
        <div class="timeline-marker">
          <i class="fas ${event.icon}"></i>
        </div>
        <div class="timeline-content">
          <h4>${event.status}</h4>
          <p>${event.date.toLocaleString()}</p>
        </div>
      </div>
    `)
    .join('');
}

/**
 * Display alerts
 */
function displayAlerts(booking) {
  const alertsContainer = document.getElementById('alerts-container');
  const alerts = [];

  if (booking.status === 'confirmed') {
    alerts.push({
      type: 'info',
      icon: 'fa-info-circle',
      message: 'Vehicle is ready for pickup at our main location'
    });
    alerts.push({
      type: 'success',
      icon: 'fa-check-circle',
      message: 'All safety checks completed successfully'
    });
  } else if (booking.status === 'in-use') {
    alerts.push({
      type: 'info',
      icon: 'fa-car',
      message: 'Vehicle is currently in use. Tracking in real-time'
    });
  } else if (booking.status === 'completed') {
    alerts.push({
      type: 'success',
      icon: 'fa-check-circle',
      message: 'Vehicle has been returned. Thank you for using our service'
    });
  }

  alertsContainer.innerHTML = alerts
    .map(alert => `
      <div class="alert alert-${alert.type}">
        <i class="fas ${alert.icon}"></i>
        <span>${alert.message}</span>
      </div>
    `)
    .join('');
}

/**
 * Initialize Leaflet map
 */
function initializeMap(booking) {
  const mapContainer = document.getElementById('map-container');
  
  // Clear previous map
  if (map) {
    map.remove();
  }

  // Default location (NYC)
  let lat = 40.7128;
  let lng = -74.0060;

  // Use booking location if available
  if (booking.vehicle_locations && booking.vehicle_locations.length > 0) {
    const location = booking.vehicle_locations[0];
    lat = location.latitude;
    lng = location.longitude;
  }

  // Create new map
  map = L.map(mapContainer).setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Add vehicle marker
  vehicleMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`<b>${booking.vehicles?.name}</b><br/>Current Location`)
    .openPopup();

  // Set map height
  mapContainer.style.height = '400px';
  map.invalidateSize();
}

/**
 * Start real-time tracking
 */
function startRealTimeTracking(bookingId) {
  // Clear existing interval
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }

  // Update location every 10 seconds
  trackingInterval = setInterval(async () => {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, vehicles(name), vehicle_locations(latitude, longitude, timestamp)')
        .eq('id', bookingId)
        .single();

      if (booking && booking.vehicle_locations && booking.vehicle_locations.length > 0) {
        const location = booking.vehicle_locations[0];

        // Update map marker
        if (vehicleMarker) {
          vehicleMarker.setLatLng([location.latitude, location.longitude]);
          map.setView([location.latitude, location.longitude], 15);
        }

        // Update location info
        document.getElementById('location-info').innerHTML = `
          <p><strong>Latitude:</strong> ${location.latitude.toFixed(6)}</p>
          <p><strong>Longitude:</strong> ${location.longitude.toFixed(6)}</p>
          <p><strong>Last Updated:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
        `;
      }
    } catch (error) {
      console.error('[v0] Real-time tracking error:', error);
    }
  }, 10000);
}

/**
 * Update vehicle location (for admin/vehicle IoT)
 */
export async function updateVehicleLocation(bookingId, latitude, longitude) {
  try {
    const { error } = await supabase
      .from('vehicle_locations')
      .insert([{
        booking_id: bookingId,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[v0] Update vehicle location error:', error);
    return false;
  }
}
