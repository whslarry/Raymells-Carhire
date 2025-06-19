// Fleet page functionality with Supabase integration

document.addEventListener("DOMContentLoaded", async () => {
  const fleetGrid = document.getElementById("fleet-grid")
  const filterButtons = document.querySelectorAll(".filter-btn")

  let vehicleData = []

  // Mock loading, error, and hiding functions (replace with your actual implementation)
  function showLoading(element) {
    element.innerHTML = '<div class="loading">Loading...</div>'
  }

  function hideLoading() {
    const loadingElement = document.querySelector(".loading")
    if (loadingElement) {
      loadingElement.remove()
    }
  }

  function showError(message, parentElement) {
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message
    parentElement.appendChild(errorDiv)
  }

  // Load vehicles from Supabase
  async function loadVehicles() {
    try {
      showLoading(fleetGrid)

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

      vehicleData = await DatabaseService.getVehicles()
      displayVehicles(vehicleData)
    } catch (error) {
      console.error("Error loading vehicles:", error)
      showError("Failed to load vehicles. Please try again later.", fleetGrid.parentElement)
    } finally {
      hideLoading()
    }
  }

  // Display vehicles
  function displayVehicles(vehicles) {
    fleetGrid.innerHTML = ""

    if (vehicles.length === 0) {
      fleetGrid.innerHTML = '<div class="no-vehicles">No vehicles available at the moment.</div>'
      return
    }

    vehicles.forEach((vehicle) => {
      const vehicleCard = document.createElement("div")
      vehicleCard.className = "class-card"
      vehicleCard.innerHTML = `
        <img src="${vehicle.image_url || "/placeholder.svg?height=200&width=300"}" alt="${vehicle.make} ${vehicle.model}">
        <div style="padding: 1rem;">
          <h3>${vehicle.make} ${vehicle.model} (${vehicle.year})</h3>
          <p>Category: ${vehicle.category.charAt(0).toUpperCase() + vehicle.category.slice(1)}</p>
          <div class="vehicle-features">
            ${vehicle.features ? vehicle.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("") : ""}
          </div>
          <div class="pricing">
            <div class="price">From ${DatabaseService.formatCurrency(vehicle.daily_rate)}/day</div>
            <div class="price">From ${DatabaseService.formatCurrency(vehicle.hourly_rate)}/hour</div>
          </div>
          <div class="status ${vehicle.status}">${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}</div>
          ${
            vehicle.status === "available"
              ? `<a href="booking.html?vehicle=${vehicle.id}" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Book Now</a>`
              : `<button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;" disabled>Not Available</button>`
          }
        </div>
      `
      fleetGrid.appendChild(vehicleCard)
    })
  }

  // Filter functionality
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"))
      this.classList.add("active")

      // Filter vehicles
      const category = this.dataset.category
      const filteredVehicles =
        category === "all" ? vehicleData : vehicleData.filter((vehicle) => vehicle.category === category)

      displayVehicles(filteredVehicles)
    })
  })

  // Initial load
  await loadVehicles()
})

// Add no vehicles style
const noVehiclesStyle = document.createElement("style")
noVehiclesStyle.textContent = `
  .no-vehicles {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-size: 1.2rem;
    grid-column: 1 / -1;
  }
`
document.head.appendChild(noVehiclesStyle)
