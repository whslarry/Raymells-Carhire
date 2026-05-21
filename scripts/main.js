// Import authentication functions
import { 
  getSession, 
  getCurrentUser, 
  signOut,
  isAdmin 
} from '../api/auth.js';

import {
  getAllVehicles
} from '../api/vehicles.js';

// Global state
window.currentUser = null;
window.isAdminUser = false;
let vehiclesData = [];

// Mobile menu toggle and initialization
document.addEventListener("DOMContentLoaded", async () => {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
    })
  }

  // Initialize authentication
  await initializeAuth();

  // Load popular cars on homepage
  if (document.getElementById("popular-cars")) {
    await loadPopularCars();
  }
});

// Initialize authentication and set up user info
async function initializeAuth() {
  try {
    const { user, session } = await getSession();
    window.currentUser = user;

    if (user) {
      window.isAdminUser = await isAdmin(user.id);
      updateUserMenu(user);
    } else {
      updateUserMenu(null);
    }
  } catch (error) {
    console.error('[v0] Auth initialization error:', error);
  }
}

// Update navbar with user info
function updateUserMenu(user) {
  const navMenu = document.querySelector('.nav-menu');
  if (!navMenu) return;

  let userMenuHTML = '';
  if (user) {
    userMenuHTML = `
      <li class="user-menu">
        <a href="#" class="user-toggle">${user.email} ▼</a>
        <div class="user-dropdown" style="display: none;">
          <a href="dashboard.html" class="dropdown-item">Dashboard</a>
          ${window.isAdminUser ? '<a href="admin/dashboard.html" class="dropdown-item">Admin</a>' : ''}
          <a href="#" class="dropdown-item" onclick="handleLogout(event)">Logout</a>
        </div>
      </li>
    `;
  } else {
    userMenuHTML = `
      <li><a href="auth/login.html" class="auth-link">Login</a></li>
      <li><a href="auth/signup.html" class="auth-link">Sign Up</a></li>
    `;
  }

  // Find and replace existing user menu or add new one
  const existingUserMenu = navMenu.querySelector('.user-menu, .auth-links');
  if (existingUserMenu) {
    existingUserMenu.remove();
  }

  // Insert before admin link if exists
  const adminLink = navMenu.querySelector('.admin-link');
  if (adminLink && user) {
    adminLink.parentElement.insertAdjacentHTML('beforebegin', userMenuHTML);
  } else if (user) {
    navMenu.insertAdjacentHTML('beforeend', userMenuHTML);
  } else {
    navMenu.insertAdjacentHTML('beforeend', userMenuHTML);
  }

  // Setup dropdown toggle
  if (user) {
    const userToggle = document.querySelector('.user-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    if (userToggle && userDropdown) {
      userToggle.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
          userDropdown.style.display = 'none';
        }
      });
    }
  }
}

// Handle logout
async function handleLogout(event) {
  event.preventDefault();
  try {
    const { error } = await signOut();
    if (error) throw error;
    window.currentUser = null;
    window.isAdminUser = false;
    window.location.href = 'index.html';
  } catch (error) {
    console.error('[v0] Logout error:', error);
    alert('Error logging out. Please try again.');
  }
}

// Load popular cars for homepage
async function loadPopularCars() {
  try {
    const container = document.getElementById("popular-cars")
    if (!container) return;

    container.innerHTML = '<p>Loading vehicles...</p>';

    // Fetch vehicles from Supabase
    const { vehicles, error } = await getAllVehicles({ status: 'available' });
    
    if (error) throw error;

    if (!vehicles || vehicles.length === 0) {
      container.innerHTML = '<p>No vehicles available at the moment.</p>';
      return;
    }

    const popularVehicles = vehicles.slice(0, 3); // Show first 3 vehicles
    const pricing = popularVehicles.map(v => v.vehicle_pricing?.[0] || {});

    container.innerHTML = popularVehicles
      .map((vehicle, idx) => {
        const price = pricing[idx] || {};
        return `
          <div class="car-card">
              <img src="/placeholder.svg?height=200&width=300" alt="${vehicle.name}">
              <div class="car-info">
                  <h3>${vehicle.name}</h3>
                  <div class="car-class">${vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1)}</div>
                  <div class="car-features">
                      ${(vehicle.features || [])
                        .slice(0, 3)
                        .map((feature) => `<span>${feature}</span>`)
                        .join("")}
                  </div>
                  <div class="car-price">From $${price.price_per_day || 'N/A'}/day</div>
                  <a href="vehicles.html?id=${vehicle.id}" class="btn btn-primary">Book Now</a>
              </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error('[v0] Load popular cars error:', error);
    const container = document.getElementById("popular-cars");
    if (container) {
      container.innerHTML = '<p>Error loading vehicles. Please try again later.</p>';
    }
  }
}

// Utility functions
export function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Export global functions for use in HTML
window.handleLogout = handleLogout;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
