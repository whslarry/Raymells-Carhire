// Sample data for the application
const carsData = [
  {
    id: 1,
    make: "Toyota",
    model: "Camry",
    year: 2023,
    class: "compact",
    dailyRate: 45,
    hourlyRate: 8,
    features: ["Air Conditioning", "Bluetooth", "GPS Navigation", "Backup Camera"],
    available: true,
    image: "/placeholder.svg?height=250&width=350",
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2023,
    class: "economy",
    dailyRate: 35,
    hourlyRate: 6,
    features: ["Air Conditioning", "Bluetooth", "Fuel Efficient"],
    available: true,
    image: "/placeholder.svg?height=250&width=350",
  },
  {
    id: 3,
    make: "BMW",
    model: "X5",
    year: 2023,
    class: "suv",
    dailyRate: 85,
    hourlyRate: 15,
    features: ["Leather Seats", "Premium Sound", "All-Wheel Drive", "Panoramic Roof"],
    available: true,
    image: "/placeholder.svg?height=250&width=350",
  },
  {
    id: 4,
    make: "Mercedes",
    model: "E-Class",
    year: 2023,
    class: "luxury",
    dailyRate: 120,
    hourlyRate: 20,
    features: ["Premium Interior", "Advanced Safety", "Massage Seats", "Premium Sound"],
    available: false,
    image: "/placeholder.svg?height=250&width=350",
  },
  {
    id: 5,
    make: "Ford",
    model: "Focus",
    year: 2022,
    class: "economy",
    dailyRate: 30,
    hourlyRate: 5,
    features: ["Air Conditioning", "Bluetooth", "Fuel Efficient"],
    available: true,
    image: "/placeholder.svg?height=250&width=350",
  },
  {
    id: 6,
    make: "Audi",
    model: "Q7",
    year: 2023,
    class: "suv",
    dailyRate: 95,
    hourlyRate: 16,
    features: ["7 Seats", "Premium Interior", "All-Wheel Drive", "Advanced Tech"],
    available: true,
    image: "/placeholder.svg?height=250&width=350",
  },
]

const bookingsData = [
  {
    id: "RCH-2024-001",
    customer: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    vehicle: "Toyota Camry",
    startDate: "2024-01-15T10:00",
    endDate: "2024-01-17T10:00",
    status: "active",
    total: 120,
    location: "Downtown Office",
  },
  {
    id: "RCH-2024-002",
    customer: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567891",
    vehicle: "BMW X5",
    startDate: "2024-01-10T09:00",
    endDate: "2024-01-12T09:00",
    status: "completed",
    total: 280,
    location: "Airport Terminal",
  },
  {
    id: "RCH-2024-003",
    customer: "Mike Johnson",
    email: "mike@example.com",
    phone: "+1234567892",
    vehicle: "Honda Civic",
    startDate: "2024-01-20T14:00",
    endDate: "2024-01-22T14:00",
    status: "active",
    total: 90,
    location: "City Center",
  },
]

const customersData = [
  {
    id: "CUST-001",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    totalBookings: 5,
  },
  {
    id: "CUST-002",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567891",
    totalBookings: 3,
  },
  {
    id: "CUST-003",
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+1234567892",
    totalBookings: 2,
  },
]

// Navigation functionality
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
    })
  }

  // Initialize page-specific functionality
  const currentPage = window.location.pathname.split("/").pop() || "index.html"

  switch (currentPage) {
    case "cars.html":
      initializeCarsPage()
      break
    case "booking.html":
      initializeBookingPage()
      break
    case "admin.html":
      initializeAdminPage()
      break
  }
})

// Cars page functionality
function initializeCarsPage() {
  displayCars(carsData)

  // Filter functionality
  const classFilter = document.getElementById("classFilter")
  const priceFilter = document.getElementById("priceFilter")

  if (classFilter) {
    classFilter.addEventListener("change", filterCars)
  }
  if (priceFilter) {
    priceFilter.addEventListener("change", filterCars)
  }
}

function displayCars(cars) {
  const container = document.getElementById("carsContainer")
  if (!container) return

  container.innerHTML = cars
    .map(
      (car) => `
        <div class="car-card" data-class="${car.class}" data-price="${car.dailyRate}">
            <img src="${car.image}" alt="${car.make} ${car.model}">
            <div class="car-info">
                <h3>${car.make} ${car.model} (${car.year})</h3>
                <div class="car-class">${car.class.charAt(0).toUpperCase() + car.class.slice(1)} Class</div>
                <ul class="car-features">
                    ${car.features.map((feature) => `<li>• ${feature}</li>`).join("")}
                </ul>
                <div class="car-pricing">
                    <div class="price-item">
                        <div class="price-value">$${car.hourlyRate}</div>
                        <div class="price-label">per hour</div>
                    </div>
                    <div class="price-item">
                        <div class="price-value">$${car.dailyRate}</div>
                        <div class="price-label">per day</div>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="bookCar(${car.id})" ${!car.available ? "disabled" : ""}>
                    ${car.available ? "Book Now" : "Not Available"}
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

function filterCars() {
  const classFilter = document.getElementById("classFilter").value
  const priceFilter = document.getElementById("priceFilter").value

  let filteredCars = carsData

  if (classFilter) {
    filteredCars = filteredCars.filter((car) => car.class === classFilter)
  }

  if (priceFilter) {
    const [min, max] = priceFilter.split("-").map((p) => p.replace("+", ""))
    filteredCars = filteredCars.filter((car) => {
      if (max) {
        return car.dailyRate >= Number.parseInt(min) && car.dailyRate <= Number.parseInt(max)
      } else {
        return car.dailyRate >= Number.parseInt(min)
      }
    })
  }

  displayCars(filteredCars)
}

function bookCar(carId) {
  const car = carsData.find((c) => c.id === carId)
  if (car) {
    localStorage.setItem("selectedCar", JSON.stringify(car))
    window.location.href = "booking.html"
  }
}

// Booking page functionality
function initializeBookingPage() {
  populateCarSelect()
  setupBookingForm()

  // Load selected car if coming from cars page
  const selectedCar = localStorage.getItem("selectedCar")
  if (selectedCar) {
    const car = JSON.parse(selectedCar)
    document.getElementById("carSelect").value = car.id
    updatePricing()
    localStorage.removeItem("selectedCar")
  }
}

function populateCarSelect() {
  const carSelect = document.getElementById("carSelect")
  if (!carSelect) return

  const availableCars = carsData.filter((car) => car.available)
  carSelect.innerHTML =
    '<option value="">Choose a car...</option>' +
    availableCars
      .map(
        (car) =>
          `<option value="${car.id}" data-daily="${car.dailyRate}" data-hourly="${car.hourlyRate}">
                ${car.make} ${car.model} (${car.year}) - $${car.dailyRate}/day
            </option>`,
      )
      .join("")
}

function setupBookingForm() {
  const form = document.getElementById("bookingForm")
  const carSelect = document.getElementById("carSelect")
  const rentalType = document.getElementById("rentalType")
  const duration = document.getElementById("duration")

  if (carSelect) carSelect.addEventListener("change", updatePricing)
  if (rentalType) rentalType.addEventListener("change", updatePricing)
  if (duration) duration.addEventListener("input", updatePricing)

  if (form) {
    form.addEventListener("submit", handleBookingSubmit)
  }
}

function updatePricing() {
  const carSelect = document.getElementById("carSelect")
  const rentalType = document.getElementById("rentalType")
  const duration = document.getElementById("duration")
  const baseRate = document.getElementById("baseRate")
  const durationDisplay = document.getElementById("durationDisplay")
  const totalPrice = document.getElementById("totalPrice")

  if (!carSelect.value || !rentalType.value || !duration.value) {
    if (baseRate) baseRate.textContent = "$0"
    if (durationDisplay) durationDisplay.textContent = "0 days"
    if (totalPrice) totalPrice.textContent = "$0"
    return
  }

  const selectedOption = carSelect.options[carSelect.selectedIndex]
  const dailyRate = Number.parseInt(selectedOption.dataset.daily)
  const hourlyRate = Number.parseInt(selectedOption.dataset.hourly)
  const durationValue = Number.parseInt(duration.value)

  let rate, total, durationText

  if (rentalType.value === "hourly") {
    rate = hourlyRate
    total = rate * durationValue
    durationText = `${durationValue} hour${durationValue !== 1 ? "s" : ""}`
  } else {
    rate = dailyRate
    total = rate * durationValue
    durationText = `${durationValue} day${durationValue !== 1 ? "s" : ""}`
  }

  if (baseRate) baseRate.textContent = `$${rate}`
  if (durationDisplay) durationDisplay.textContent = durationText
  if (totalPrice) totalPrice.textContent = `$${total}`
}

function handleBookingSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const bookingData = Object.fromEntries(formData)

  // Generate booking ID
  const bookingId = `RCH-${new Date().getFullYear()}-${String(bookingsData.length + 1).padStart(3, "0")}`

  // Add booking to data
  const selectedCar = carsData.find((car) => car.id == bookingData.carSelect)
  const newBooking = {
    id: bookingId,
    customer: `${bookingData.firstName} ${bookingData.lastName}`,
    email: bookingData.email,
    phone: bookingData.phone,
    vehicle: `${selectedCar.make} ${selectedCar.model}`,
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    status: "active",
    total: Number.parseInt(document.getElementById("totalPrice").textContent.replace("$", "")),
    location: "Pending Pickup",
  }

  bookingsData.push(newBooking)

  alert(`Booking confirmed! Your booking ID is: ${bookingId}`)
  e.target.reset()
  updatePricing()
}

// Tracking functionality
function trackCar() {
  const bookingId = document.getElementById("bookingId").value.trim()
  const resultsDiv = document.getElementById("trackingResults")
  const errorDiv = document.getElementById("trackingError")

  if (!bookingId) {
    alert("Please enter a booking ID")
    return
  }

  const booking = bookingsData.find((b) => b.id.toLowerCase() === bookingId.toLowerCase())

  if (booking) {
    displayTrackingResults(booking)
    resultsDiv.style.display = "block"
    errorDiv.style.display = "none"
  } else {
    resultsDiv.style.display = "none"
    errorDiv.style.display = "block"
  }
}

function displayTrackingResults(booking) {
  document.getElementById("displayBookingId").textContent = booking.id
  document.getElementById("displayVehicle").textContent = booking.vehicle
  document.getElementById("displayCustomer").textContent = booking.customer

  const statusElement = document.getElementById("displayStatus")
  statusElement.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
  statusElement.className = `status-badge ${booking.status}`

  // Simulate location data
  document.getElementById("currentAddress").textContent = booking.location
  document.getElementById("currentCoordinates").textContent = "40.7128° N, 74.0060° W"

  // Simulate trip data
  document.getElementById("tripDistance").textContent = Math.floor(Math.random() * 200) + " km"
  document.getElementById("tripDuration").textContent =
    Math.floor(Math.random() * 24) + "h " + Math.floor(Math.random() * 60) + "m"
  document.getElementById("fuelLevel").textContent = Math.floor(Math.random() * 40) + 60 + "%"
  document.getElementById("avgSpeed").textContent = Math.floor(Math.random() * 30) + 40 + " km/h"
}

// Admin functionality
function initializeAdminPage() {
  showSection("dashboard")
  populateAdminTables()
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active")
  })

  // Remove active class from all nav links
  document.querySelectorAll(".admin-nav .nav-link").forEach((link) => {
    link.classList.remove("active")
  })

  // Show selected section
  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.add("active")
  }

  // Add active class to clicked nav link
  const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`)
  if (activeLink) {
    activeLink.classList.add("active")
  }
}

function populateAdminTables() {
  populateVehiclesTable()
  populateBookingsTable()
  populateCustomersTable()
}

function populateVehiclesTable() {
  const tbody = document.getElementById("vehiclesTableBody")
  if (!tbody) return

  tbody.innerHTML = carsData
    .map(
      (car) => `
        <tr>
            <td>${car.id}</td>
            <td>${car.make} ${car.model} (${car.year})</td>
            <td>${car.class.charAt(0).toUpperCase() + car.class.slice(1)}</td>
            <td>$${car.dailyRate}</td>
            <td><span class="status-badge ${car.available ? "active" : "cancelled"}">${car.available ? "Available" : "Rented"}</span></td>
            <td>
                <button class="btn btn-small btn-primary" onclick="editVehicle(${car.id})">Edit</button>
                <button class="btn btn-small btn-secondary" onclick="deleteVehicle(${car.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("")
}

function populateBookingsTable() {
  const tbody = document.getElementById("bookingsTableBody")
  if (!tbody) return

  tbody.innerHTML = bookingsData
    .map(
      (booking) => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.customer}</td>
            <td>${booking.vehicle}</td>
            <td>${new Date(booking.startDate).toLocaleDateString()}</td>
            <td>${new Date(booking.endDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
            <td>$${booking.total}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="editBooking('${booking.id}')">Edit</button>
                <button class="btn btn-small btn-secondary" onclick="cancelBooking('${booking.id}')">Cancel</button>
            </td>
        </tr>
    `,
    )
    .join("")
}

function populateCustomersTable() {
  const tbody = document.getElementById("customersTableBody")
  if (!tbody) return

  tbody.innerHTML = customersData
    .map(
      (customer) => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalBookings}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="viewCustomer('${customer.id}')">View</button>
                <button class="btn btn-small btn-secondary" onclick="editCustomer('${customer.id}')">Edit</button>
            </td>
        </tr>
    `,
    )
    .join("")
}

// Admin modal functions
function showAddVehicleForm() {
  document.getElementById("addVehicleModal").style.display = "flex"
}

function closeAddVehicleForm() {
  document.getElementById("addVehicleModal").style.display = "none"
  document.getElementById("addVehicleForm").reset()
}

// Admin action functions (placeholders)
function editVehicle(id) {
  alert(`Edit vehicle ${id} - This would open an edit form`)
}

function deleteVehicle(id) {
  if (confirm("Are you sure you want to delete this vehicle?")) {
    const index = carsData.findIndex((car) => car.id === id)
    if (index > -1) {
      carsData.splice(index, 1)
      populateVehiclesTable()
    }
  }
}

function editBooking(id) {
  alert(`Edit booking ${id} - This would open an edit form`)
}

function cancelBooking(id) {
  if (confirm("Are you sure you want to cancel this booking?")) {
    const booking = bookingsData.find((b) => b.id === id)
    if (booking) {
      booking.status = "cancelled"
      populateBookingsTable()
    }
  }
}

function viewCustomer(id) {
  alert(`View customer ${id} - This would show customer details`)
}

function editCustomer(id) {
  alert(`Edit customer ${id} - This would open an edit form`)
}

// Add vehicle form submission
document.addEventListener("DOMContentLoaded", () => {
  const addVehicleForm = document.getElementById("addVehicleForm")
  if (addVehicleForm) {
    addVehicleForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const formData = new FormData(e.target)
      const vehicleData = Object.fromEntries(formData)

      const newVehicle = {
        id: carsData.length + 1,
        make: vehicleData.make,
        model: vehicleData.model,
        year: Number.parseInt(vehicleData.year),
        class: vehicleData.class,
        dailyRate: Number.parseFloat(vehicleData.dailyRate),
        hourlyRate: Number.parseFloat(vehicleData.hourlyRate),
        features: ["Air Conditioning", "Bluetooth"], // Default features
        available: true,
        image: "/placeholder.svg?height=250&width=350",
      }

      carsData.push(newVehicle)
      populateVehiclesTable()
      closeAddVehicleForm()
      alert("Vehicle added successfully!")
    })
  }
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  const modal = document.getElementById("addVehicleModal")
  if (e.target === modal) {
    closeAddVehicleForm()
  }
})
