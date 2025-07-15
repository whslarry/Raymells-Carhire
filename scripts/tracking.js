document.addEventListener("DOMContentLoaded", () => {
  const trackingForm = document.getElementById("tracking-form")
  const trackingResults = document.getElementById("tracking-results")

  // Check if there's a booking ID in the URL
  const urlParams = new URLSearchParams(window.location.search)
  const bookingId = urlParams.get("booking")

  if (bookingId) {
    document.getElementById("booking-id").value = bookingId
    trackVehicle(bookingId)
  }

  trackingForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const bookingId = document.getElementById("booking-id").value
    trackVehicle(bookingId)
  })

  function trackVehicle(bookingId) {
    // In a real application, this would make an API call
    const bookings = window.localStorage.getItem("bookings") ? JSON.parse(window.localStorage.getItem("bookings")) : []
    const booking = bookings.find((b) => b.bookingId === bookingId)

    if (booking) {
      displayTrackingResults(booking)
    } else {
      alert("Booking not found. Please check your booking ID.")
    }
  }

  function displayTrackingResults(booking) {
    trackingResults.style.display = "block"

    // Populate vehicle details
    const vehicleDetails = document.getElementById("vehicle-details")
    vehicleDetails.innerHTML = `
            <div class="info-item">
                <span class="info-label">Vehicle:</span>
                <span class="info-value">${booking.selectedVehicle.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">License Plate:</span>
                <span class="info-value">ABC-${booking.selectedVehicle.id}23</span>
            </div>
            <div class="info-item">
                <span class="info-label">Class:</span>
                <span class="info-value">${booking.selectedVehicle.class.charAt(0).toUpperCase() + booking.selectedVehicle.class.slice(1)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fuel Level:</span>
                <span class="info-value">85%</span>
            </div>
        `

    // Populate location info
    const locationInfo = document.getElementById("location-info")
    locationInfo.innerHTML = `
            <div class="location-details">
                <p><strong>Current Location:</strong> Downtown Business District</p>
                <p><strong>Address:</strong> 123 Main Street, City Center</p>
                <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Speed:</strong> 0 mph (Parked)</p>
            </div>
        `

    // Populate status timeline
    const statusTimeline = document.getElementById("status-timeline")
    statusTimeline.innerHTML = `
            <div class="timeline-item completed">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Booking Confirmed</h4>
                    <p>${new Date(booking.createdAt).toLocaleString()}</p>
                </div>
            </div>
            <div class="timeline-item completed">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Vehicle Prepared</h4>
                    <p>${new Date(Date.now() - 3600000).toLocaleString()}</p>
                </div>
            </div>
            <div class="timeline-item active">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Ready for Pickup</h4>
                    <p>Vehicle is ready at our location</p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>In Use</h4>
                    <p>Pending pickup</p>
                </div>
            </div>
        `

    // Populate alerts
    const alertsContainer = document.getElementById("alerts-container")
    alertsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <span>Vehicle is ready for pickup at our main location.</span>
            </div>
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <span>All safety checks completed successfully.</span>
            </div>
        `
  }

  function getFromLocalStorage(key) {
    return window.localStorage.getItem(key) ? JSON.parse(window.localStorage.getItem(key)) : []
  }
})
