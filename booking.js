// Booking page functionality with Supabase integration

document.addEventListener("DOMContentLoaded", async () => {
  const bookingForm = document.getElementById("booking-form")
  const vehicleSelect = document.getElementById("vehicle-select")
  const rentalTypeSelect = document.getElementById("rental-type")
  const rentalDurationInput = document.getElementById("rental-duration")
  const pickupDateInput = document.getElementById("pickup-date")
  const returnDateInput = document.getElementById("return-date")
  const priceSummary = document.getElementById("price-summary")
  const priceDetails = document.getElementById("price-details")
  const totalPrice = document.getElementById("total-price")

  let availableVehicles = []

  // Load available vehicles from Supabase
  async function loadAvailableVehicles() {
    try {
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

      availableVehicles = await DatabaseService.getAvailableVehicles()
      populateVehicleSelect()
    } catch (error) {
      console.error("Error loading vehicles:", error)
      showError("Failed to load available vehicles. Please try again later.")
    }
  }

  // Populate vehicle dropdown
  function populateVehicleSelect() {
    vehicleSelect.innerHTML = '<option value="">Choose a vehicle...</option>'

    availableVehicles.forEach((vehicle) => {
      const option = document.createElement("option")
      option.value = vehicle.id
      option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year}) - ${DatabaseService.formatCurrency(vehicle.daily_rate)}/day`
      vehicleSelect.appendChild(option)
    })
  }

  // Calculate price
  function calculatePrice() {
    const vehicleId = Number.parseInt(vehicleSelect.value)
    const rentalType = rentalTypeSelect.value
    const duration = Number.parseInt(rentalDurationInput.value)

    if (!vehicleId || !rentalType || !duration) {
      priceSummary.style.display = "none"
      return
    }

    const vehicle = availableVehicles.find((v) => v.id === vehicleId)
    if (!vehicle) return

    let rate, total
    let rateLabel

    switch (rentalType) {
      case "hourly":
        rate = vehicle.hourly_rate
        total = rate * duration
        rateLabel = "per hour"
        break
      case "daily":
        rate = vehicle.daily_rate
        total = rate * duration
        rateLabel = "per day"
        break
      case "weekly":
        rate = vehicle.daily_rate * 7 * 0.85 // 15% discount for weekly
        total = rate * duration
        rateLabel = "per week"
        break
      case "monthly":
        rate = vehicle.daily_rate * 30 * 0.7 // 30% discount for monthly
        total = rate * duration
        rateLabel = "per month"
        break
      default:
        return
    }

    priceDetails.innerHTML = `
      <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model}</p>
      <p><strong>Rate:</strong> ${DatabaseService.formatCurrency(rate)} ${rateLabel}</p>
      <p><strong>Duration:</strong> ${duration} ${rentalType.replace("ly", "")}(s)</p>
    `

    totalPrice.textContent = `Total: ${DatabaseService.formatCurrency(total)}`
    priceSummary.style.display = "block"
  }

  // Auto-calculate return date
  function updateReturnDate() {
    const pickupDate = new Date(pickupDateInput.value)
    const rentalType = rentalTypeSelect.value
    const duration = Number.parseInt(rentalDurationInput.value)

    if (!pickupDate || !rentalType || !duration) return

    const returnDate = new Date(pickupDate)

    switch (rentalType) {
      case "hourly":
        returnDate.setHours(returnDate.getHours() + duration)
        break
      case "daily":
        returnDate.setDate(returnDate.getDate() + duration)
        break
      case "weekly":
        returnDate.setDate(returnDate.getDate() + duration * 7)
        break
      case "monthly":
        returnDate.setMonth(returnDate.getMonth() + duration)
        break
    }

    returnDateInput.value = returnDate.toISOString().slice(0, 16)
  }

  // Event listeners
  vehicleSelect.addEventListener("change", calculatePrice)
  rentalTypeSelect.addEventListener("change", () => {
    calculatePrice()
    updateReturnDate()
  })
  rentalDurationInput.addEventListener("input", () => {
    calculatePrice()
    updateReturnDate()
  })
  pickupDateInput.addEventListener("change", updateReturnDate)

  // Form submission
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const submitButton = bookingForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.textContent = "Processing..."

      const formData = new FormData(bookingForm)
      const vehicleId = Number.parseInt(formData.get("vehicleId"))
      const vehicle = availableVehicles.find((v) => v.id === vehicleId)

      if (!vehicle) {
        throw new Error("Please select a valid vehicle.")
      }

      // Calculate total price
      const rentalType = formData.get("rentalType")
      const duration = Number.parseInt(formData.get("rentalDuration"))
      let rate, total

      switch (rentalType) {
        case "hourly":
          rate = vehicle.hourly_rate
          total = rate * duration
          break
        case "daily":
          rate = vehicle.daily_rate
          total = rate * duration
          break
        case "weekly":
          rate = vehicle.daily_rate * 7 * 0.85
          total = rate * duration
          break
        case "monthly":
          rate = vehicle.daily_rate * 30 * 0.7
          total = rate * duration
          break
      }

      // Create booking object
      const booking = {
        id: DatabaseService.generateBookingId(),
        customerName: formData.get("customerName"),
        customerEmail: formData.get("customerEmail"),
        customerPhone: formData.get("customerPhone"),
        vehicleId: vehicleId,
        rentalType: rentalType,
        rentalDuration: duration,
        pickupDate: formData.get("pickupDate"),
        returnDate: formData.get("returnDate"),
        totalPrice: total,
      }

      // Save booking to Supabase
      await DatabaseService.createBooking(booking)

      // Show success message
      showSuccess(`Booking confirmed! Your booking ID is: ${booking.id}`)

      // Reset form
      bookingForm.reset()
      priceSummary.style.display = "none"

      // Reload available vehicles
      await loadAvailableVehicles()
    } catch (error) {
      console.error("Error creating booking:", error)
      showError(error.message || "Failed to create booking. Please try again.")
    } finally {
      const submitButton = bookingForm.querySelector('button[type="submit"]')
      submitButton.disabled = false
      submitButton.textContent = "Book Now"
    }
  })

  // Check for pre-selected vehicle from URL
  const urlParams = new URLSearchParams(window.location.search)
  const preSelectedVehicle = urlParams.get("vehicle")

  // Initialize
  await loadAvailableVehicles()

  if (preSelectedVehicle) {
    vehicleSelect.value = preSelectedVehicle
    calculatePrice()
  }

  // Set minimum date to today
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  pickupDateInput.min = now.toISOString().slice(0, 16)
})

// Mock functions for DatabaseService, showError, and showSuccess
// In a real application, these would be defined elsewhere.
const DatabaseService = {
  getAvailableVehicles: async () => {
    // Replace with actual data fetching logic
    return [
      { id: 1, make: "Toyota", model: "Camry", year: 2020, daily_rate: 50, hourly_rate: 10 },
      { id: 2, make: "Honda", model: "Civic", year: 2021, daily_rate: 45, hourly_rate: 9 },
    ]
  },
  formatCurrency: (amount) => `$${amount.toFixed(2)}`,
  generateBookingId: () => Math.random().toString(36).substring(2, 15),
  createBooking: async (booking) => {
    console.log("Booking created:", booking)
    // Simulate success
    return Promise.resolve()
  },
}

function showError(message) {
  alert("Error: " + message)
}

function showSuccess(message) {
  alert("Success: " + message)
}
