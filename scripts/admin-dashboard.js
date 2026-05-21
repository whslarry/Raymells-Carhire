import { initializeSupabase, supabase } from './supabase.js';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSupabase();
  await checkAdminAuth();
  await loadDashboardData();
});

// State
let revenueChart = null;

/**
 * Check if user is authenticated as admin
 */
async function checkAdminAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    // Check if user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!admin) {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error('[v0] Admin auth check error:', error);
    window.location.href = 'login.html';
  }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
  try {
    await Promise.all([
      loadStatistics(),
      loadRecentBookings(),
      loadVehicleStatus(),
      initializeRevenueChart()
    ]);
  } catch (error) {
    console.error('[v0] Dashboard data load error:', error);
  }
}

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    // Get vehicle count
    const { data: vehicles, count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact' });

    // Get active bookings
    const { count: activeBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('status', 'confirmed');

    // Get customer count
    const { count: customerCount } = await supabase
      .from('customer_profiles')
      .select('*', { count: 'exact' });

    // Calculate monthly revenue
    const { data: monthlyBookings } = await supabase
      .from('bookings')
      .select('total_price, pickup_date')
      .gte('pickup_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const monthlyRevenue = (monthlyBookings || []).reduce((sum, b) => sum + (b.total_price || 0), 0);

    // Update UI
    document.getElementById('total-vehicles').textContent = vehicleCount || 0;
    document.getElementById('active-bookings').textContent = activeBookingsCount || 0;
    document.getElementById('total-customers').textContent = customerCount || 0;
    document.getElementById('monthly-revenue').textContent = `$${monthlyRevenue.toFixed(2)}`;
  } catch (error) {
    console.error('[v0] Statistics load error:', error);
  }
}

/**
 * Load recent bookings
 */
async function loadRecentBookings() {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_ref, pickup_date, status, customer_profiles(full_name), vehicles(name)')
      .order('pickup_date', { ascending: false })
      .limit(5);

    const tbody = document.getElementById('recent-bookings');
    
    if (!bookings || bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bookings yet</td></tr>';
      return;
    }

    tbody.innerHTML = bookings
      .map(booking => `
        <tr>
          <td>${booking.booking_ref}</td>
          <td>${booking.customer_profiles?.full_name || 'N/A'}</td>
          <td>${booking.vehicles?.name || 'N/A'}</td>
          <td>${new Date(booking.pickup_date).toLocaleDateString()}</td>
          <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
        </tr>
      `)
      .join('');
  } catch (error) {
    console.error('[v0] Recent bookings load error:', error);
  }
}

/**
 * Load vehicle status
 */
async function loadVehicleStatus() {
  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, name, class, status')
      .limit(6);

    const container = document.getElementById('vehicle-status');

    if (!vehicles || vehicles.length === 0) {
      container.innerHTML = '<p>No vehicles available</p>';
      return;
    }

    container.innerHTML = vehicles
      .map(vehicle => `
        <div class="vehicle-status-item">
          <div class="vehicle-info">
            <h4>${vehicle.name}</h4>
            <p>${vehicle.class}</p>
          </div>
          <div class="status-indicator ${vehicle.status === 'active' ? 'available' : 'rented'}">
            ${vehicle.status === 'active' ? 'Available' : 'Rented'}
          </div>
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('[v0] Vehicle status load error:', error);
  }
}

/**
 * Initialize revenue chart
 */
async function initializeRevenueChart() {
  try {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;

    // Get last 6 months of revenue
    const months = [];
    const revenues = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      months.push(date.toLocaleString('default', { month: 'short' }));

      // Get bookings for this month
      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('total_price')
        .gte('pickup_date', date.toISOString())
        .lt('pickup_date', nextDate.toISOString());

      const monthRevenue = (monthBookings || []).reduce((sum, b) => sum + (b.total_price || 0), 0);
      revenues.push(monthRevenue);
    }

    // Create chart
    const ctx = canvas.getContext('2d');
    
    if (revenueChart) {
      revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly Revenue',
          data: revenues,
          backgroundColor: '#2c5aa0',
          borderColor: '#1e4070',
          borderWidth: 1,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + (value / 1000).toFixed(0) + 'k';
              }
            }
          }
        }
      }
    });

    // Set canvas height
    canvas.style.height = '300px';
  } catch (error) {
    console.error('[v0] Revenue chart error:', error);
  }
}
