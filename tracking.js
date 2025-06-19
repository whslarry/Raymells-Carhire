// Tracking page functionality with Supabase integration

document.addEventListener("DOMContentLoaded", () => {
  const trackingForm = document.getElementById("tracking-form")
  const trackingResults = document.getElementById("tracking-results")
  const vehicleInfo = document.getElementById("vehicle-info")
  const locationInfo = document.getElementById("location-info")
  const rentalStatus = document.getElementById("rental-status")

  // Declare DatabaseService, showError, and supabase
  let DatabaseService
  let showError
  let supabase

  trackingForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const submitButton = trackingForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.textContent = "Searching..."

      const bookingId = document.getElementById("booking-id").value.trim()

      // Wait for DatabaseService to be available
      if (typeof DatabaseService === "undefined") {
        await new Promise((resolve) => {
          const checkService = setInterval(() => {
            if (typeof DatabaseService !== "undefined") {
              clearInterval(checkService)
              resolve()
            }
          }, 100)
        })
      }

      // Find booking in Supabase
      const booking = await DatabaseService.getBookingById(bookingId)

      if (!booking) {
        throw new Error("Booking ID not found. Please check your booking ID and try again.")
      }

      // Display vehicle information
      vehicleInfo.innerHTML = `
        <div class="info-grid">
          <div class="info-item">
            <strong>Vehicle:</strong> ${booking.vehicles.make} ${booking.vehicles.model} (${booking.vehicles.year})
          </div>
          <div class="info-item">
            <strong>Category:</strong> ${booking.vehicles.category.charAt(0).toUpperCase() + booking.vehicles.category.slice(1)}
          </div>
          <div class="info-item">
            <strong>License Plate:</strong> ${generateLicensePlate()}
          </div>
          <div class="info-item">
            <strong>Customer:</strong> ${booking.customer_name}
          </div>
        </div>
      `

      // Get tracking data from Supabase
      const trackingData = await getVehicleTracking(booking.vehicle_id, bookingId)

      // Display location
      const currentLocationDiv = locationInfo.querySelector("div")
      if (trackingData) {
        currentLocationDiv.innerHTML = `
          <p>📍 Current Location</p>
          <p style="color: #666; margin-top: 0.5rem;"><strong>${trackingData.address}</strong></p>
          <p style="color: #666; font-size: 0.9rem;">Coordinates: ${trackingData.latitude.toFixed(4)}, ${trackingData.longitude.toFixed(4)}</p>
          <p style="color: #666; font-size: 0.9rem;">Last Updated: ${new Date(trackingData.last_updated).toLocaleString()}</p>
          <div style="background: #e9ecef; height: 200px; border-radius: 5px; margin-top: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
            <span style="color: #666;">📍 Vehicle Location</span>
            <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">
              Speed: ${trackingData.speed || 0} mph
            </div>
          </div>
        `
      } else {
        currentLocationDiv.innerHTML = `
          <p>📍 GPS Tracking</p>
          <p style="color: #666; margin-top: 0.5rem;">Location data not available</p>
          <div style="background: #f8f9fa; height: 200px; border-radius: 5px; margin-top: 1rem; display: flex; align-items: center; justify-content: center;">
            <span style="color: #666;">Tracking data will appear here when available</span>
          </div>
        `
      }

      // Display rental status
      const pickupDate = new Date(booking.pickup_date)
      const returnDate = new Date(booking.return_date)
      const now = new Date()

      let statusText, statusClass
      if (now < pickupDate) {
        statusText = "Upcoming"
        statusClass = "status available"
      } else if (now >= pickupDate && now <= returnDate) {
        statusText = "Active Rental"
        statusClass = "status rented"
      } else {
        statusText = "Completed"
        statusClass = "status maintenance"
      }

      rentalStatus.innerHTML = `
        <div class="status-grid">
          <div class="status-item">
            <strong>Booking ID:</strong> ${booking.booking_id}
          </div>
          <div class="status-item">
            <strong>Status:</strong> <span class="${statusClass}">${statusText}</span>
          </div>
          <div class="status-item">
            <strong>Pickup Date:</strong> ${DatabaseService.formatDate(booking.pickup_date)}
          </div>
          <div class="status-item">
            <strong>Return Date:</strong> ${DatabaseService.formatDate(booking.return_date)}
          </div>
          <div class="status-item">
            <strong>Duration:</strong> ${booking.rental_duration} ${booking.rental_type.replace("ly", "")}(s)
          </div>
          <div class="status-item">
            <strong>Total Cost:</strong> ${DatabaseService.formatCurrency(booking.total_price)}
          </div>
        </div>
      `

      // Show results
      trackingResults.style.display = "block"
    } catch (error) {
      console.error("Error tracking vehicle:", error)
      showError(error.message || "Failed to track vehicle. Please try again.")
    } finally {
      const submitButton = trackingForm.querySelector('button[type="submit"]')
      submitButton.disabled = false
      submitButton.textContent = "Track Vehicle"
    }
  })

  // Get vehicle tracking data from Supabase
  async function getVehicleTracking(vehicleId, bookingId) {
    try {
      const { data, error } = await supabase
        .from("vehicle_tracking")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("booking_id", bookingId)
        .order("last_updated", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching tracking data:", error)
      return null
    }
  }

  // Generate mock license plate
  function generateLicensePlate() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    let plate = ""

    // Generate format: ABC-1234
    for (let i = 0; i < 3; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    plate += "-"
    for (let i = 0; i < 4; i++) {
      plate += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }

    return plate
  }
})
