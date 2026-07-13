// Vehicles Page Module
import { getAllVehicles } from '../api/vehicles.js';

let allVehicles = [];
let currentFilters = {
  class: '',
  priceRange: '',
  search: ''
};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  await loadVehicles();
  setupFilters();
});

/**
 * Load all vehicles from database
 */
async function loadVehicles() {
  try {
    const grid = document.getElementById('vehicles-grid');
    grid.innerHTML = '<p class="loading">Loading vehicles...</p>';

    const { vehicles, error } = await getAllVehicles({ status: 'available' });

    if (error) throw error;

    allVehicles = vehicles || [];
    displayVehicles(allVehicles);
  } catch (error) {
    console.error('[v0] Load vehicles error:', error);
    const grid = document.getElementById('vehicles-grid');
    grid.innerHTML = '<p class="error">Error loading vehicles. Please try again later.</p>';
  }
}

/**
 * Display vehicles in grid
 */
function displayVehicles(vehicles) {
  const grid = document.getElementById('vehicles-grid');

  if (!vehicles || vehicles.length === 0) {
    grid.innerHTML = '<p class="empty">No vehicles found matching your criteria.</p>';
    return;
  }

  grid.innerHTML = vehicles
    .map(vehicle => {
      const pricing = vehicle.vehicle_pricing?.[0] || {};
      const imageUrl = '/placeholder.svg?height=200&width=300';

      return `
        <div class="vehicle-card">
          <div class="vehicle-image">
            <img src="${imageUrl}" alt="${vehicle.name}">
            <span class="vehicle-badge">${vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1)}</span>
          </div>
          <div class="vehicle-info">
            <h3>${vehicle.name}</h3>
            <p class="vehicle-year">${vehicle.year} • ${vehicle.fuel_type}</p>
            
            <div class="vehicle-features">
              ${(vehicle.features || [])
                .slice(0, 3)
                .map(f => `<span class="feature-tag">${f}</span>`)
                .join('')}
            </div>

            <div class="vehicle-pricing">
              <div class="price-item">
                <span class="label">Hour:</span>
                <span class="price">$${pricing.price_per_hour || 'N/A'}</span>
              </div>
              <div class="price-item">
                <span class="label">Day:</span>
                <span class="price">$${pricing.price_per_day || 'N/A'}</span>
              </div>
              <div class="price-item">
                <span class="label">Week:</span>
                <span class="price">$${pricing.price_per_week || 'N/A'}</span>
              </div>
            </div>

            <button class="btn btn-primary btn-book" onclick="bookVehicle('${vehicle.id}', '${vehicle.name}')">
              Book Now
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Setup filter event listeners
 */
function setupFilters() {
  const classFilter = document.getElementById('classFilter');
  const priceFilter = document.getElementById('priceFilter');
  const searchInput = document.getElementById('searchInput');

  classFilter.addEventListener('change', (e) => {
    currentFilters.class = e.target.value;
    applyFilters();
  });

  priceFilter.addEventListener('change', (e) => {
    currentFilters.priceRange = e.target.value;
    applyFilters();
  });

  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    applyFilters();
  });
}

/**
 * Apply filters to vehicles
 */
function applyFilters() {
  let filtered = [...allVehicles];

  // Filter by class
  if (currentFilters.class) {
    filtered = filtered.filter(v => v.class === currentFilters.class);
  }

  // Filter by price range
  if (currentFilters.priceRange) {
    const pricing = filtered.map(v => v.vehicle_pricing?.[0] || {});
    const [minPrice, maxPrice] = currentFilters.priceRange.split('-');

    filtered = filtered.filter((v, idx) => {
      const dayPrice = parseFloat(pricing[idx].price_per_day || 0);
      const min = parseInt(minPrice);
      const max = currentFilters.priceRange.includes('+') ? Infinity : parseInt(maxPrice);
      return dayPrice >= min && dayPrice <= max;
    });
  }

  // Filter by search term
  if (currentFilters.search) {
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(currentFilters.search) ||
      v.class.toLowerCase().includes(currentFilters.search)
    );
  }

  displayVehicles(filtered);
}

/**
 * Book vehicle handler
 */
window.bookVehicle = function(vehicleId, vehicleName) {
  // Redirect to booking page with vehicle ID
  window.location.href = `booking.html?vehicle=${vehicleId}&name=${encodeURIComponent(vehicleName)}`;
};
