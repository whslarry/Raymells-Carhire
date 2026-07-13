import { initializeSupabase, supabase } from './supabase.js';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSupabase();
  initializeBooking();
});

// State
let currentStep = 1;
let bookingData = {
  pickup_date: '',
  pickup_time: '',
  return_date: '',
  rental_type: '',
  duration_amount: 0,
  vehicle_id: null,
  vehicle_name: '',
  total_price: 0,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  license_number: ''
};
let availableVehicles = [];
let selectedVehicleId = null;

/**
 * Initialize booking page
 */
async function initializeBooking() {
  try {
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Prefill user info
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile) {
        const [firstName, ...lastNameParts] = (profile.full_name || '').split(' ');
        document.getElementById('first-name').value = firstName || '';
        document.getElementById('last-name').value = lastNameParts.join(' ') || '';
        document.getElementById('email').value = session.user.email;
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('license').value = profile.license_number || '';
        
        // Lock fields if logged in
        document.getElementById('first-name').readOnly = true;
        document.getElementById('last-name').readOnly = true;
        document.getElementById('email').readOnly = true;
      }
    }
    
    // Set minimum pickup date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickup-date').setAttribute('min', today);
    
    setupEventListeners();
  } catch (error) {
    console.error('[v0] Booking initialization error:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Duration type change
  document.getElementById('rental-duration').addEventListener('change', (e) => {
    const durationDetails = document.getElementById('duration-details');
    const label = document.querySelector('#duration-details label');
    const input = document.getElementById('duration-amount');
    
    if (e.target.value) {
      durationDetails.style.display = 'block';
      switch (e.target.value) {
        case 'hourly':
          label.textContent = 'Number of Hours';
          input.placeholder = 'Enter hours (1-24)';
          input.max = 24;
          break;
        case 'daily':
          label.textContent = 'Number of Days';
          input.placeholder = 'Enter days';
          input.max = 365;
          break;
        case 'weekly':
          label.textContent = 'Number of Weeks';
          input.placeholder = 'Enter weeks';
          input.max = 52;
          break;
        case 'monthly':
          label.textContent = 'Number of Months';
          input.placeholder = 'Enter months';
          input.max = 12;
          break;
      }
    } else {
      durationDetails.style.display = 'none';
    }
  });

  // Navigation buttons
  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStep === 1) goToStep2();
      else if (currentStep === 2) goToStep3();
      else if (currentStep === 3) goToStep4();
    });
  });

  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentStep--;
      showStep(currentStep);
    });
  });

  // Form submission
  document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

/**
 * Go to step 2 - Vehicle selection
 */
async function goToStep2() {
  const pickupDate = document.getElementById('pickup-date').value;
  const pickupTime = document.getElementById('pickup-time').value;
  const rentalType = document.getElementById('rental-duration').value;
  const durationAmount = document.getElementById('duration-amount').value;

  if (!pickupDate || !pickupTime || !rentalType || !durationAmount) {
    alert('Please fill in all required fields');
    return;
  }

  // Calculate return date
  const pickup = new Date(pickupDate + 'T' + pickupTime);
  const returnDt = new Date(pickup);

  switch (rentalType) {
    case 'hourly':
      returnDt.setHours(returnDt.getHours() + parseInt(durationAmount));
      break;
    case 'daily':
      returnDt.setDate(returnDt.getDate() + parseInt(durationAmount));
      break;
    case 'weekly':
      returnDt.setDate(returnDt.getDate() + parseInt(durationAmount) * 7);
      break;
    case 'monthly':
      returnDt.setMonth(returnDt.getMonth() + parseInt(durationAmount));
      break;
  }

  bookingData.pickup_date = pickup.toISOString();
  bookingData.pickup_time = pickupTime;
  bookingData.return_date = returnDt.toISOString();
  bookingData.rental_type = rentalType;
  bookingData.duration_amount = parseInt(durationAmount);

  // Load vehicles
  await loadAvailableVehicles();
  currentStep = 2;
  showStep(2);
}

/**
 * Load available vehicles
 */
async function loadAvailableVehicles() {
  try {
    const pickupDate = new Date(bookingData.pickup_date);
    const returnDate = new Date(bookingData.return_date);

    // Get all active vehicles
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    // Filter for available vehicles (no conflicting bookings)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .eq('status', 'confirmed')
      .gte('return_date', bookingData.pickup_date)
      .lte('pickup_date', bookingData.return_date);

    const bookedVehicleIds = (bookings || []).map(b => b.vehicle_id);
    availableVehicles = vehicles.filter(v => !bookedVehicleIds.includes(v.id));

    displayVehicleSelection();
  } catch (error) {
    console.error('[v0] Load vehicles error:', error);
    alert('Error loading vehicles');
  }
}

/**
 * Display vehicle selection
 */
function displayVehicleSelection() {
  const container = document.getElementById('vehicle-selection');

  if (!availableVehicles || availableVehicles.length === 0) {
    container.innerHTML = '<p>No vehicles available for your selected dates.</p>';
    return;
  }

  container.innerHTML = availableVehicles
    .map(vehicle => {
      const price = getPriceForDuration(vehicle, bookingData.rental_type);
      const totalPrice = price * bookingData.duration_amount;

      return `
        <div class="vehicle-option" data-vehicle-id="${vehicle.id}">
          <img src="${vehicle.image_url || '/placeholder.svg'}" alt="${vehicle.name}">
          <div class="vehicle-details">
            <h4>${vehicle.name}</h4>
            <p class="vehicle-class">${vehicle.class || 'Standard'}</p>
            <div class="vehicle-features">
              ${(vehicle.features || []).slice(0, 3).map(f => `<span class="feature-tag">${f}</span>`).join('')}
            </div>
            <div class="vehicle-pricing">
              <span class="price">$${totalPrice.toFixed(2)}</span>
              <span class="duration">(${bookingData.duration_amount} ${bookingData.rental_type})</span>
            </div>
          </div>
          <button type="button" class="btn btn-secondary select-vehicle">Select</button>
        </div>
      `;
    })
    .join('');

  // Add selection listeners
  container.querySelectorAll('.select-vehicle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const vehicleId = parseInt(btn.closest('.vehicle-option').dataset.vehicleId);
      const vehicle = availableVehicles.find(v => v.id === vehicleId);
      
      selectVehicle(vehicleId, vehicle.name);
      
      // Update UI
      container.querySelectorAll('.vehicle-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      btn.closest('.vehicle-option').classList.add('selected');
      btn.textContent = 'Selected';
      btn.classList.add('selected');
    });
  });
}

/**
 * Select a vehicle
 */
function selectVehicle(vehicleId, vehicleName) {
  selectedVehicleId = vehicleId;
  bookingData.vehicle_id = vehicleId;
  bookingData.vehicle_name = vehicleName;

  // Calculate total price
  const vehicle = availableVehicles.find(v => v.id === vehicleId);
  const price = getPriceForDuration(vehicle, bookingData.rental_type);
  bookingData.total_price = price * bookingData.duration_amount;
}

/**
 * Get price for duration type
 */
function getPriceForDuration(vehicle, duration) {
  switch (duration) {
    case 'hourly':
      return vehicle.hourly_rate || 0;
    case 'daily':
      return vehicle.daily_rate || 0;
    case 'weekly':
      return vehicle.weekly_rate || 0;
    case 'monthly':
      return vehicle.monthly_rate || 0;
    default:
      return vehicle.daily_rate || 0;
  }
}

/**
 * Go to step 3 - Customer info
 */
function goToStep3() {
  if (!selectedVehicleId) {
    alert('Please select a vehicle');
    return;
  }

  currentStep = 3;
  showStep(3);
}

/**
 * Go to step 4 - Review booking
 */
function goToStep4() {
  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const license = document.getElementById('license').value.trim();

  if (!firstName || !lastName || !email || !phone || !license) {
    alert('Please fill in all required fields');
    return;
  }

  bookingData.first_name = firstName;
  bookingData.last_name = lastName;
  bookingData.email = email;
  bookingData.phone = phone;
  bookingData.license_number = license;

  displayBookingSummary();
  currentStep = 4;
  showStep(4);
}

/**
 * Display booking summary
 */
function displayBookingSummary() {
  const summary = document.getElementById('booking-summary');
  const pickupDate = new Date(bookingData.pickup_date);
  const returnDate = new Date(bookingData.return_date);

  summary.innerHTML = `
    <div class="summary-section">
      <h4>Vehicle Information</h4>
      <div class="summary-row">
        <span>Vehicle:</span>
        <span>${bookingData.vehicle_name}</span>
      </div>
    </div>

    <div class="summary-section">
      <h4>Rental Period</h4>
      <div class="summary-row">
        <span>Pickup:</span>
        <span>${pickupDate.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>Return:</span>
        <span>${returnDate.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>Duration:</span>
        <span>${bookingData.duration_amount} ${bookingData.rental_type}(s)</span>
      </div>
    </div>

    <div class="summary-section">
      <h4>Customer Information</h4>
      <div class="summary-row">
        <span>Name:</span>
        <span>${bookingData.first_name} ${bookingData.last_name}</span>
      </div>
      <div class="summary-row">
        <span>Email:</span>
        <span>${bookingData.email}</span>
      </div>
      <div class="summary-row">
        <span>Phone:</span>
        <span>${bookingData.phone}</span>
      </div>
    </div>

    <div class="summary-section">
      <h4>Pricing</h4>
      <div class="summary-row total">
        <span>Total Price:</span>
        <span>$${bookingData.total_price.toFixed(2)}</span>
      </div>
    </div>
  `;
}

/**
 * Handle booking submission
 */
async function handleBookingSubmit(e) {
  e.preventDefault();

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('Please log in to complete booking');
      window.location.href = 'auth/login.html';
      return;
    }

    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    // Get customer profile
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!profile) throw new Error('Customer profile not found');

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{
        customer_id: profile.id,
        vehicle_id: bookingData.vehicle_id,
        pickup_date: bookingData.pickup_date,
        return_date: bookingData.return_date,
        rental_type: bookingData.rental_type,
        total_price: bookingData.total_price,
        status: 'confirmed',
        booking_ref: generateBookingRef()
      }])
      .select()
      .single();

    if (error) throw error;

    // Redirect to confirmation
    window.location.href = `booking-confirmation.html?id=${booking.id}&ref=${booking.booking_ref}`;
  } catch (error) {
    console.error('[v0] Booking submission error:', error);
    alert('Error creating booking: ' + error.message);
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm Booking';
  }
}

/**
 * Generate booking reference
 */
function generateBookingRef() {
  return 'BK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * Show step
 */
function showStep(step) {
  document.querySelectorAll('.form-step').forEach(s => {
    s.classList.remove('active');
  });
  const stepEl = document.getElementById(`step${step}`);
  if (stepEl) stepEl.classList.add('active');
  window.scrollTo(0, 0);
}
