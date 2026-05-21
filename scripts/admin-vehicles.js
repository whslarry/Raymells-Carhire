import { initializeSupabase, supabase } from './supabase.js';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSupabase();
  await checkAdminAuth();
  loadVehicles();
  setupFormListener();
});

let currentVehicleId = null;

/**
 * Check admin auth
 */
async function checkAdminAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('[v0] Auth check error:', error);
    window.location.href = 'login.html';
  }
}

/**
 * Load all vehicles
 */
async function loadVehicles() {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('name');

    if (error) throw error;

    const tbody = document.getElementById('vehicles-table');

    if (!vehicles || vehicles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No vehicles found</td></tr>';
      return;
    }

    tbody.innerHTML = vehicles
      .map(vehicle => `
        <tr>
          <td><strong>${vehicle.name}</strong></td>
          <td>${vehicle.class}</td>
          <td>${vehicle.year}</td>
          <td><span class="status-badge ${vehicle.status}">${vehicle.status}</span></td>
          <td>$${parseFloat(vehicle.daily_rate).toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editVehicle(${vehicle.id})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${vehicle.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `)
      .join('');
  } catch (error) {
    console.error('[v0] Load vehicles error:', error);
    document.getElementById('vehicles-table').innerHTML = 
      '<tr><td colspan="6" style="text-align:center; color:red;">Error loading vehicles</td></tr>';
  }
}

/**
 * Show add vehicle modal
 */
window.showAddVehicleModal = function() {
  currentVehicleId = null;
  document.getElementById('vehicle-form').reset();
  document.querySelector('.modal-header h2').textContent = 'Add New Vehicle';
  document.getElementById('vehicle-modal').style.display = 'block';
};

/**
 * Close vehicle modal
 */
window.closeVehicleModal = function() {
  document.getElementById('vehicle-modal').style.display = 'none';
  currentVehicleId = null;
};

/**
 * Edit vehicle
 */
window.editVehicle = async function(vehicleId) {
  try {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) throw error;

    // Populate form
    document.getElementById('vehicle-name').value = vehicle.name;
    document.getElementById('vehicle-class').value = vehicle.class;
    document.getElementById('vehicle-year').value = vehicle.year;
    document.getElementById('vehicle-fuel').value = vehicle.fuel_type;
    document.getElementById('vehicle-hourly').value = vehicle.hourly_rate;
    document.getElementById('vehicle-daily').value = vehicle.daily_rate;
    document.getElementById('vehicle-weekly').value = vehicle.weekly_rate;
    document.getElementById('vehicle-monthly').value = vehicle.monthly_rate;
    document.getElementById('vehicle-features').value = (vehicle.features || []).join(', ');
    document.getElementById('vehicle-status').value = vehicle.status;

    currentVehicleId = vehicleId;
    document.querySelector('.modal-header h2').textContent = 'Edit Vehicle';
    document.getElementById('vehicle-modal').style.display = 'block';
  } catch (error) {
    console.error('[v0] Edit vehicle error:', error);
    alert('Error loading vehicle');
  }
};

/**
 * Delete vehicle
 */
window.deleteVehicle = async function(vehicleId) {
  if (!confirm('Are you sure you want to delete this vehicle?')) return;

  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;

    alert('Vehicle deleted successfully');
    loadVehicles();
  } catch (error) {
    console.error('[v0] Delete vehicle error:', error);
    alert('Error deleting vehicle');
  }
};

/**
 * Setup form listener
 */
function setupFormListener() {
  document.getElementById('vehicle-form').addEventListener('submit', handleVehicleSubmit);
}

/**
 * Handle vehicle form submission
 */
async function handleVehicleSubmit(e) {
  e.preventDefault();

  const vehicleData = {
    name: document.getElementById('vehicle-name').value,
    class: document.getElementById('vehicle-class').value,
    year: parseInt(document.getElementById('vehicle-year').value),
    fuel_type: document.getElementById('vehicle-fuel').value,
    hourly_rate: parseFloat(document.getElementById('vehicle-hourly').value),
    daily_rate: parseFloat(document.getElementById('vehicle-daily').value),
    weekly_rate: parseFloat(document.getElementById('vehicle-weekly').value),
    monthly_rate: parseFloat(document.getElementById('vehicle-monthly').value),
    features: document.getElementById('vehicle-features').value.split(',').map(f => f.trim()).filter(f => f),
    status: document.getElementById('vehicle-status').value
  };

  try {
    let result;
    
    if (currentVehicleId) {
      // Update existing vehicle
      result = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', currentVehicleId)
        .select();
    } else {
      // Insert new vehicle
      result = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select();
    }

    if (result.error) throw result.error;

    alert(currentVehicleId ? 'Vehicle updated successfully' : 'Vehicle added successfully');
    closeVehicleModal();
    loadVehicles();
  } catch (error) {
    console.error('[v0] Vehicle save error:', error);
    alert('Error saving vehicle: ' + error.message);
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('vehicle-modal');
  if (event.target === modal) {
    closeVehicleModal();
  }
};
