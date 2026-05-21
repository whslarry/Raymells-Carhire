// Customer Dashboard Module
import {
  getSession,
  getCustomerProfile,
  updateCustomerProfile,
  signOut
} from '../api/auth.js';

import {
  getCustomerBookings,
  cancelBooking
} from '../api/bookings.js';

// State
let currentUser = null;
let currentProfile = null;
let currentBookings = [];
let filterStatus = 'all';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await initializeDashboard();
  setupEventListeners();
});

/**
 * Initialize dashboard with user data
 */
async function initializeDashboard() {
  try {
    // Check authentication
    const { user } = await getSession();
    if (!user) {
      window.location.href = 'auth/login.html';
      return;
    }

    currentUser = user;
    
    // Load profile
    const { profile } = await getCustomerProfile(user.id);
    if (profile) {
      currentProfile = profile;
      displayProfile();
    }

    // Load bookings
    await loadBookings();

  } catch (error) {
    console.error('[v0] Dashboard init error:', error);
    alert('Error loading dashboard. Please try again.');
  }
}

/**
 * Display user profile in form fields
 */
function displayProfile() {
  document.getElementById('user-name').textContent = currentProfile.full_name || 'User';
  document.getElementById('user-email').textContent = currentUser.email;

  document.getElementById('profile-name').value = currentProfile.full_name || '';
  document.getElementById('profile-email').value = currentUser.email;
  document.getElementById('profile-phone').value = currentProfile.phone || '';
  document.getElementById('profile-address').value = currentProfile.address || '';
  document.getElementById('profile-license').value = currentProfile.license_number || '';
  document.getElementById('profile-license-expiry').value = currentProfile.license_expiry || '';
}

/**
 * Load customer bookings
 */
async function loadBookings() {
  try {
    const { bookings } = await getCustomerBookings(currentProfile.id);
    currentBookings = bookings || [];
    displayBookings();
  } catch (error) {
    console.error('[v0] Load bookings error:', error);
  }
}

/**
 * Display bookings list
 */
function displayBookings() {
  const container = document.getElementById('bookings-list');

  if (!currentBookings || currentBookings.length === 0) {
    container.innerHTML = '<p class="empty-message">You have no bookings yet. <a href="booking.html">Book a vehicle</a></p>';
    return;
  }

  // Filter bookings
  let filteredBookings = currentBookings;
  if (filterStatus !== 'all') {
    filteredBookings = currentBookings.filter(b => b.status === filterStatus);
  }

  if (filteredBookings.length === 0) {
    container.innerHTML = `<p class="empty-message">No bookings with status: ${filterStatus}</p>`;
    return;
  }

  container.innerHTML = filteredBookings
    .map(booking => {
      const vehicle = booking.vehicles || {};
      const pickup = new Date(booking.pickup_date).toLocaleDateString();
      const returnDate = new Date(booking.return_date).toLocaleDateString();
      const statusClass = `status-${booking.status}`;

      return `
        <div class="booking-card">
          <div class="booking-header">
            <div class="booking-info">
              <h3>${vehicle.name || 'Unknown Vehicle'}</h3>
              <p class="booking-ref">Ref: ${booking.booking_ref}</p>
            </div>
            <span class="booking-status ${statusClass}">${booking.status.toUpperCase()}</span>
          </div>
          
          <div class="booking-details">
            <div class="detail-group">
              <span class="label">Pickup:</span>
              <span class="value">${pickup}</span>
            </div>
            <div class="detail-group">
              <span class="label">Return:</span>
              <span class="value">${returnDate}</span>
            </div>
            <div class="detail-group">
              <span class="label">Total Price:</span>
              <span class="value">$${parseFloat(booking.total_price).toFixed(2)}</span>
            </div>
            <div class="detail-group">
              <span class="label">Location:</span>
              <span class="value">${booking.pickup_location}</span>
            </div>
          </div>

          <div class="booking-actions">
            ${booking.status === 'pending' || booking.status === 'confirmed' ? `
              <button class="btn btn-small btn-danger" onclick="cancelBookingHandler('${booking.id}')">Cancel</button>
            ` : ''}
            <button class="btn btn-small btn-primary" onclick="viewBookingDetails('${booking.id}')">View Details</button>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Sidebar menu
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.classList.contains('logout-btn')) {
      item.addEventListener('click', handleLogout);
    } else {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        switchSection(section);
      });
    }
  });

  // Booking filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatus = btn.dataset.filter;
      displayBookings();
    });
  });

  // Profile update
  document.getElementById('update-profile-btn').addEventListener('click', updateProfile);

  // Password change
  document.getElementById('password-form').addEventListener('submit', updatePassword);

  // Delete account
  document.getElementById('delete-account-btn').addEventListener('click', deleteAccount);
}

/**
 * Switch dashboard section
 */
function switchSection(section) {
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Update menu
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected section
  const sectionId = `${section}-section`;
  const sectionElement = document.getElementById(sectionId);
  if (sectionElement) {
    sectionElement.classList.add('active');
  }

  // Update menu item
  const menuItem = document.querySelector(`[data-section="${section}"]`);
  if (menuItem) {
    menuItem.classList.add('active');
  }
}

/**
 * Update customer profile
 */
async function updateProfile() {
  try {
    const messageEl = document.getElementById('profile-message');
    messageEl.textContent = 'Updating...';
    messageEl.className = 'message loading';

    const updateData = {
      phone: document.getElementById('profile-phone').value,
      address: document.getElementById('profile-address').value
    };

    const { profile, error } = await updateCustomerProfile(currentUser.id, updateData);

    if (error) throw error;

    currentProfile = profile;
    messageEl.textContent = 'Profile updated successfully!';
    messageEl.className = 'message success';

    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 3000);
  } catch (error) {
    console.error('[v0] Update profile error:', error);
    const messageEl = document.getElementById('profile-message');
    messageEl.textContent = 'Error updating profile. Please try again.';
    messageEl.className = 'message error';
  }
}

/**
 * Update password
 */
async function updatePassword(e) {
  e.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    const messageEl = document.getElementById('password-message');
    messageEl.textContent = 'Passwords do not match.';
    messageEl.className = 'message error';
    return;
  }

  if (newPassword.length < 6) {
    const messageEl = document.getElementById('password-message');
    messageEl.textContent = 'Password must be at least 6 characters.';
    messageEl.className = 'message error';
    return;
  }

  try {
    const messageEl = document.getElementById('password-message');
    messageEl.textContent = 'Updating password...';
    messageEl.className = 'message loading';

    // Note: For security, password change should be handled server-side
    // This is a placeholder - implement via server endpoint
    alert('Password update feature coming soon. For security, please use the password reset via email.');

    messageEl.textContent = '';
    messageEl.className = 'message';
  } catch (error) {
    console.error('[v0] Update password error:', error);
    const messageEl = document.getElementById('password-message');
    messageEl.textContent = 'Error updating password. Please try again.';
    messageEl.className = 'message error';
  }
}

/**
 * Delete account
 */
async function deleteAccount() {
  if (!confirm('Are you sure? This action cannot be undone.')) {
    return;
  }

  try {
    alert('Account deletion feature coming soon. Please contact support.');
  } catch (error) {
    console.error('[v0] Delete account error:', error);
  }
}

/**
 * Cancel booking
 */
window.cancelBookingHandler = async function(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  try {
    const { error } = await cancelBooking(bookingId);
    if (error) throw error;
    await loadBookings();
  } catch (error) {
    console.error('[v0] Cancel booking error:', error);
    alert('Error canceling booking. Please try again.');
  }
};

/**
 * View booking details
 */
window.viewBookingDetails = function(bookingId) {
  alert('Booking details view coming soon.');
};

/**
 * Handle logout
 */
async function handleLogout(e) {
  e.preventDefault();
  try {
    const { error } = await signOut();
    if (error) throw error;
    window.location.href = 'index.html';
  } catch (error) {
    console.error('[v0] Logout error:', error);
    alert('Error logging out. Please try again.');
  }
}
