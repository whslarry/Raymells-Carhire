document.addEventListener("DOMContentLoaded", () => {
  // Check if admin is logged in
  if (!sessionStorage.getItem("adminLoggedIn")) {
    window.location.href = "login.html"
    return
  }

  loadDashboardData()

  function loadDashboardData() {
    // Load statistics
    loadStatistics()

    // Load recent bookings
    loadRecentBookings()

    // Load vehicle status
    loadVehicleStatus()

    // Initialize revenue chart
    initializeRevenueChart()
  }

  function loadStatistics() {
    const vehicles = window.vehiclesData || []
    const bookings = getFromLocalStorage("bookings") || []
    const customers = getUniqueCustomers(bookings)
    const monthlyRevenue = calculateMonthlyRevenue(bookings)

    document.getElementById("total-vehicles").textContent = vehicles.length
    document.getElementById("active-bookings").textContent = bookings.length
    document.getElementById("total-customers").textContent = customers.length
    document.getElementById("monthly-revenue").textContent = formatPrice(monthlyRevenue)
  }

  function loadRecentBookings() {
    const bookings = getFromLocalStorage("bookings") || []
    const recentBookings = bookings.slice(-5).reverse()

    const tbody = document.getElementById("recent-bookings")
    tbody.innerHTML = recentBookings
      .map(
        (booking) => `
            <tr>
                <td>${booking.bookingId}</td>
                <td>${booking.firstName} ${booking.lastName}</td>
                <td>${booking.selectedVehicle.name}</td>
                <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
            </tr>
        `,
      )
      .join("")
  }

  function loadVehicleStatus() {
    const vehicles = window.vehiclesData || []
    const container = document.getElementById("vehicle-status")

    container.innerHTML = vehicles
      .map(
        (vehicle) => `
            <div class="vehicle-status-item">
                <div class="vehicle-info">
                    <h4>${vehicle.name}</h4>
                    <p>${vehicle.class}</p>
                </div>
                <div class="status-indicator ${vehicle.available ? "available" : "rented"}">
                    ${vehicle.available ? "Available" : "Rented"}
                </div>
            </div>
        `,
      )
      .join("")
  }

  function getUniqueCustomers(bookings) {
    const customers = new Set()
    bookings.forEach((booking) => {
      customers.add(booking.email)
    })
    return Array.from(customers)
  }

  function calculateMonthlyRevenue(bookings) {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
      })
      .reduce((total, booking) => {
        const basePrice = getPriceForDuration(booking.selectedVehicle, booking.rentalDuration)
        return total + basePrice * Number.parseInt(booking.durationAmount)
      }, 0)
  }

  function initializeRevenueChart() {
    // Simple chart implementation (in real app, use Chart.js or similar)
    const canvas = document.getElementById("revenue-chart")
    const ctx = canvas.getContext("2d")

    // Sample data for demonstration
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const revenue = [5000, 7500, 6200, 8900, 9500, 11200]

    // Simple bar chart
    canvas.width = 400
    canvas.height = 200

    const barWidth = 50
    const barSpacing = 10
    const maxRevenue = Math.max(...revenue)

    ctx.fillStyle = "#2c5aa0"

    revenue.forEach((value, index) => {
      const barHeight = (value / maxRevenue) * 150
      const x = index * (barWidth + barSpacing) + 20
      const y = 180 - barHeight

      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw labels
      ctx.fillStyle = "#333"
      ctx.font = "12px Arial"
      ctx.fillText(months[index], x + 15, 195)
      ctx.fillText("$" + value / 1000 + "k", x + 10, y - 5)
      ctx.fillStyle = "#2c5aa0"
    })
  }

  function getPriceForDuration(vehicle, duration) {
    switch (duration) {
      case "hourly":
        return vehicle.pricePerHour
      case "daily":
        return vehicle.pricePerDay
      case "weekly":
        return vehicle.pricePerWeek
      case "monthly":
        return vehicle.pricePerMonth
      default:
        return vehicle.pricePerDay
    }
  }

  function getFromLocalStorage(key) {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  function formatPrice(price) {
    return `$${price.toFixed(2)}`
  }
})
