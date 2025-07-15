document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form")
  const steps = document.querySelectorAll(".form-step")
  const nextButtons = document.querySelectorAll(".next-step")
  const prevButtons = document.querySelectorAll(".prev-step")
  const durationSelect = document.getElementById("rental-duration")
  const durationDetails = document.getElementById("duration-details")

  let currentStep = 0
  const bookingData = {}

  // Initialize booking form
  initializeBookingForm()

  function initializeBookingForm() {
    // Set minimum date to today
    const today = new Date().toISOString().split("T")[0]
    document.getElementById("pickup-date").min = today

    // Handle duration selection
    durationSelect.addEventListener("change", function () {
      if (this.value) {
        durationDetails.style.display = "block"
        const label = document.querySelector("#duration-details label")
        const input = document.getElementById("duration-amount")

        switch (this.value) {
          case "hourly":
            label.textContent = "Number of Hours"
            input.placeholder = "Enter hours (min 1, max 24)"
            input.max = 24
            break
          case "daily":
            label.textContent = "Number of Days"
            input.placeholder = "Enter days"
            input.max = 365
            break
          case "weekly":
            label.textContent = "Number of Weeks"
            input.placeholder = "Enter weeks"
            input.max = 52
            break
          case "monthly":
            label.textContent = "Number of Months"
            input.placeholder = "Enter months"
            input.max = 12
            break
        }
      } else {
        durationDetails.style.display = "none"
      }
    })

    // Handle step navigation
    nextButtons.forEach((button) => {
      button.addEventListener("click", nextStep)
    })

    prevButtons.forEach((button) => {
      button.addEventListener("click", prevStep)
    })

    // Handle form submission
    form.addEventListener("submit", handleBookingSubmission)
  }

  function nextStep() {
    if (validateCurrentStep()) {
      saveCurrentStepData()

      if (currentStep === 0) {
        loadAvailableVehicles()
      } else if (currentStep === 2) {
        generateBookingSummary()
      }

      steps[currentStep].classList.remove("active")
      currentStep++
      steps[currentStep].classList.add("active")
    }
  }

  function prevStep() {
    steps[currentStep].classList.remove("active")
    currentStep--
    steps[currentStep].classList.add("active")
  }

  function validateCurrentStep() {
    const currentStepElement = steps[currentStep]
    const requiredFields = currentStepElement.querySelectorAll("[required]")

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        field.focus()
        alert("Please fill in all required fields.")
        return false
      }
    }

    // Additional validation for step 1
    if (currentStep === 0) {
      const duration = document.getElementById("rental-duration").value
      const amount = document.getElementById("duration-amount").value

      if (duration && !amount) {
        alert("Please specify the duration amount.")
        return false
      }
    }

    // Additional validation for step 2
    if (currentStep === 1) {
      if (!bookingData.selectedVehicle) {
        alert("Please select a vehicle.")
        return false
      }
    }

    return true
  }

  function saveCurrentStepData() {
    switch (currentStep) {
      case 0:
        bookingData.pickupDate = document.getElementById("pickup-date").value
        bookingData.pickupTime = document.getElementById("pickup-time").value
        bookingData.rentalDuration = document.getElementById("rental-duration").value
        bookingData.durationAmount = document.getElementById("duration-amount").value
        break
      case 2:
        bookingData.firstName = document.getElementById("first-name").value
        bookingData.lastName = document.getElementById("last-name").value
        bookingData.email = document.getElementById("email").value
        bookingData.phone = document.getElementById("phone").value
        bookingData.license = document.getElementById("license").value
        break
    }
  }

  function loadAvailableVehicles() {
    const container = document.getElementById("vehicle-selection")
    const vehicles = window.vehiclesData || []

    container.innerHTML = vehicles
      .map(
        (vehicle) => `
            <div class="vehicle-option" data-vehicle-id="${vehicle.id}">
                <img src="${vehicle.image}" alt="${vehicle.name}">
                <div class="vehicle-details">
                    <h4>${vehicle.name}</h4>
                    <p class="vehicle-class">${vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1)}</p>
                    <div class="vehicle-features">
                        ${vehicle.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("")}
                    </div>
                    <div class="vehicle-pricing">
                        <span class="price">$${getPriceForDuration(vehicle, bookingData.rentalDuration)}</span>
                        <span class="duration">/${bookingData.rentalDuration.slice(0, -2)}</span>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary select-vehicle">Select</button>
            </div>
        `,
      )
      .join("")

    // Add event listeners for vehicle selection
    container.querySelectorAll(".select-vehicle").forEach((button) => {
      button.addEventListener("click", function () {
        const vehicleOption = this.closest(".vehicle-option")
        const vehicleId = Number.parseInt(vehicleOption.dataset.vehicleId)
        const vehicle = vehicles.find((v) => v.id === vehicleId)

        // Remove previous selection
        container.querySelectorAll(".vehicle-option").forEach((option) => {
          option.classList.remove("selected")
        })

        // Mark current selection
        vehicleOption.classList.add("selected")
        bookingData.selectedVehicle = vehicle

        // Update button text
        this.textContent = "Selected"
        this.classList.add("selected")
      })
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

  function generateBookingSummary() {
    const container = document.getElementById("booking-summary")
    const vehicle = bookingData.selectedVehicle
    const basePrice = getPriceForDuration(vehicle, bookingData.rentalDuration)
    const totalPrice = basePrice * Number.parseInt(bookingData.durationAmount)

    container.innerHTML = `
            <div class="summary-section">
                <h4>Rental Details</h4>
                <div class="summary-row">
                    <span>Pickup Date:</span>
                    <span>${bookingData.pickupDate} at ${bookingData.pickupTime}</span>
                </div>
                <div class="summary-row">
                    <span>Duration:</span>
                    <span>${bookingData.durationAmount} ${bookingData.rentalDuration.slice(0, -2)}(s)</span>
                </div>
            </div>
            
            <div class="summary-section">
                <h4>Vehicle Information</h4>
                <div class="summary-row">
                    <span>Vehicle:</span>
                    <span>${vehicle.name}</span>
                </div>
                <div class="summary-row">
                    <span>Class:</span>
                    <span>${vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1)}</span>
                </div>
                <div class="summary-row">
                    <span>Features:</span>
                    <span>${vehicle.features.join(", ")}</span>
                </div>
            </div>
            
            <div class="summary-section">
                <h4>Customer Information</h4>
                <div class="summary-row">
                    <span>Name:</span>
                    <span>${bookingData.firstName} ${bookingData.lastName}</span>
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
            
            <div class="summary-section pricing-summary">
                <h4>Pricing</h4>
                <div class="summary-row">
                    <span>Rate:</span>
                    <span>$${basePrice}/${bookingData.rentalDuration.slice(0, -2)}</span>
                </div>
                <div class="summary-row">
                    <span>Quantity:</span>
                    <span>${bookingData.durationAmount}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>$${totalPrice}</span>
                </div>
            </div>
        `
  }

  function handleBookingSubmission(e) {
    e.preventDefault()

    // Generate booking ID
    const bookingId = generateBookingId()
    bookingData.bookingId = bookingId
    bookingData.status = "confirmed"
    bookingData.createdAt = new Date().toISOString()

    // Save booking to localStorage (in real app, this would go to a server)
    const existingBookings = getFromLocalStorage("bookings") || []
    existingBookings.push(bookingData)
    saveToLocalStorage("bookings", existingBookings)

    // Show success message
    alert(`Booking confirmed! Your booking ID is: ${bookingId}`)

    // Redirect to tracking page
    window.location.href = `tracking.html?booking=${bookingId}`
  }

  function generateBookingId() {
    return Math.random().toString(36).substr(2, 9)
  }

  function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key))
  }

  function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }
})
