// Sample vehicle data
const vehicles = [
  {
    id: 1,
    name: "Toyota Camry",
    class: "midsize",
    image: "/placeholder.svg?height=200&width=300",
    pricePerHour: 12,
    pricePerDay: 45,
    pricePerWeek: 280,
    pricePerMonth: 1000,
    features: ["5 Seats", "Automatic", "AC", "GPS"],
    available: true,
    fuelType: "Gasoline",
    year: 2023,
  },
  {
    id: 2,
    name: "Honda Civic",
    class: "compact",
    image: "/placeholder.svg?height=200&width=300",
    pricePerHour: 10,
    pricePerDay: 35,
    pricePerWeek: 220,
    pricePerMonth: 800,
    features: ["5 Seats", "Manual", "AC", "Bluetooth"],
    available: true,
    fuelType: "Gasoline",
    year: 2023,
  },
  {
    id: 3,
    name: "BMW 3 Series",
    class: "luxury",
    image: "/placeholder.svg?height=200&width=300",
    pricePerHour: 25,
    pricePerDay: 120,
    pricePerWeek: 750,
    pricePerMonth: 2800,
    features: ["5 Seats", "Automatic", "Leather", "Premium Audio"],
    available: true,
    fuelType: "Gasoline",
    year: 2024,
  },
  {
    id: 4,
    name: "Ford Explorer",
    class: "suv",
    image: "/placeholder.svg?height=200&width=300",
    pricePerHour: 18,
    pricePerDay: 65,
    pricePerWeek: 400,
    pricePerMonth: 1500,
    features: ["7 Seats", "AWD", "AC", "Cargo Space"],
    available: true,
    fuelType: "Gasoline",
    year: 2023,
  },
  {
    id: 5,
    name: "Nissan Versa",
    class: "economy",
    image: "/placeholder.svg?height=200&width=300",
    pricePerHour: 8,
    pricePerDay: 25,
    pricePerWeek: 150,
    pricePerMonth: 500,
    features: ["5 Seats", "Manual", "AC", "Fuel Efficient"],
    available: true,
    fuelType: "Gasoline",
    year: 2022,
  },
  {
    id: 6,
    name: "Mercedes Sprinter",
    class: "van",
    image: "/placeholder.svg?height=200&width=300",
    pricePerHour: 22,
    pricePerDay: 85,
    pricePerWeek: 520,
    pricePerMonth: 1900,
    features: ["12 Seats", "Diesel", "AC", "Commercial"],
    available: true,
    fuelType: "Diesel",
    year: 2023,
  },
]

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
    })
  }

  // Load popular cars on homepage
  if (document.getElementById("popular-cars")) {
    loadPopularCars()
  }
})

// Load popular cars for homepage
function loadPopularCars() {
  const container = document.getElementById("popular-cars")
  const popularVehicles = vehicles.slice(0, 3) // Show first 3 vehicles

  container.innerHTML = popularVehicles
    .map(
      (vehicle) => `
        <div class="car-card">
            <img src="${vehicle.image}" alt="${vehicle.name}">
            <div class="car-info">
                <h3>${vehicle.name}</h3>
                <div class="car-class">${vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1)}</div>
                <div class="car-features">
                    ${vehicle.features
                      .slice(0, 3)
                      .map((feature) => `<span>${feature}</span>`)
                      .join("")}
                </div>
                <div class="car-price">From $${vehicle.pricePerDay}/day</div>
                <a href="booking.html?vehicle=${vehicle.id}" class="btn btn-primary">Book Now</a>
            </div>
        </div>
    `,
    )
    .join("")
}

// Utility functions
function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

function generateBookingId() {
  return "RCH" + Date.now().toString().slice(-6)
}

// Local storage utilities
function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function getFromLocalStorage(key) {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

// Export vehicles data for other scripts
window.vehiclesData = vehicles
