// Admin dashboard functionality with Supabase integration

document.addEventListener("DOMContentLoaded", () => {
  const adminLogin = document.getElementById("admin-login")
  const adminDashboard = document.getElementById("admin-dashboard")
  const loginForm = document.getElementById("login-form")
  const logoutBtn = document.getElementById("logout-btn")

  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  // Admin credentials (in real app, this would be server-side)
  const adminCredentials = {
    username: "admin",
    password: "password",
  }

  let vehicleData = []
  let bookingData = []

  // Mock functions for demonstration purposes
  const showError = (message) => {
    alert(`Error: ${message}`)
  }

  const showSuccess = (message) => {
    alert(`Success: ${message}`)
  }

  const showLoading = (element) => {
    element.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>"
  }

  const DatabaseService = {
    getStatistics: async () => {
      // Mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            totalVehicles: 10,
            availableVehicles: 5,
            rentedVehicles: 5,
            totalBookings: 20,
          })
        }, 500)
      })
    },
    getVehicles: async () => {
      // Mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              make: "Toyota",
              model: "Camry",
              year: 2020,
              category: "sedan",
              status: "available",
              daily_rate: 50,
            },
            { id: 2, make: "Honda", model: "Civic", year: 2021, category: "sedan", status: "rented", daily_rate: 60 },
          ])
        }, 500)
      })
    },
    getBookings: async () => {
      // Mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              booking_id: 1,
              customer_name: "John Doe",
              vehicles: { make: "Toyota", model: "Camry", year: 2020 },
              rental_duration: 3,
              rental_type: "daily",
              total_price: 150,
              status: "active",
            },
            {
              booking_id: 2,
              customer_name: "Jane Smith",
              vehicles: { make: "Honda", model: "Civic", year: 2021 },
              rental_duration: 7,
              rental_type: "daily",
              total_price: 420,
              status: "completed",
            },
          ])
        }, 500)
      })
    },
    addVehicle: async (vehicle) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Vehicle added:", vehicle)
          resolve()
        }, 500)
      })
    },
    updateVehicle: async (vehicleId, updates) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Vehicle updated:", vehicleId, updates)
          resolve()
        }, 500)
      })
    },
    deleteVehicle: async (vehicleId) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Vehicle deleted:", vehicleId)
          resolve()
        }, 500)
      })
    },
    formatCurrency: (amount) => {
      return `$${amount.toFixed(2)}`
    },
  }

  // Login functionality
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const username = document.getElementById("admin-username").value
    const password = document.getElementById("admin-password").value

    if (username === adminCredentials.username && password === adminCredentials.password) {
      adminLogin.style.display = "none"
      adminDashboard.style.display = "block"
      loadDashboardData()
    } else {
      showError("Invalid credentials. Please try again.")
    }
  })

  // Logout functionality
  logoutBtn.addEventListener("click", () => {
    adminDashboard.style.display = "none"
    adminLogin.style.display = "block"
    loginForm.reset()
  })

  // Tab functionality
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabName = this.dataset.tab

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      this.classList.add("active")

      // Show corresponding tab content
      tabContents.forEach((content) => {
        content.classList.remove("active")
        if (content.id === tabName + "-tab") {
          content.classList.add("active")
        }
      })
    })
  })

  // Load dashboard data
  async function loadDashboardData() {
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

      await Promise.all([updateStatistics(), loadVehiclesTable(), loadBookingsTable()])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      showError("Failed to load dashboard data. Please refresh the page.")
    }
  }

  // Update statistics
  async function updateStatistics() {
    try {
      const stats = await DatabaseService.getStatistics()

      document.getElementById("total-vehicles").textContent = stats.totalVehicles
      document.getElementById("available-vehicles").textContent = stats.availableVehicles
      document.getElementById("rented-vehicles").textContent = stats.rentedVehicles
      document.getElementById("total-bookings").textContent = stats.totalBookings
    } catch (error) {
      console.error("Error updating statistics:", error)
    }
  }

  // Load vehicles table
  async function loadVehiclesTable() {
    try {
      const tbody = document.querySelector("#vehicles-table tbody")
      showLoading(tbody)

      vehicleData = await DatabaseService.getVehicles()
      tbody.innerHTML = ""

      vehicleData.forEach((vehicle) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${vehicle.id}</td>
          <td>${vehicle.make} ${vehicle.model} (${vehicle.year})</td>
          <td>${vehicle.category.charAt(0).toUpperCase() + vehicle.category.slice(1)}</td>
          <td><span class="status ${vehicle.status}">${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}</span></td>
          <td>${DatabaseService.formatCurrency(vehicle.daily_rate)}</td>
          <td>
            <button class="btn btn-secondary" onclick="editVehicle(${vehicle.id})" style="margin-right: 0.5rem;">Edit</button>
            <button class="btn btn-secondary" onclick="deleteVehicle(${vehicle.id})" style="background: #dc3545;">Delete</button>
          </td>
        `
        tbody.appendChild(row)
      })
    } catch (error) {
      console.error("Error loading vehicles table:", error)
      showError("Failed to load vehicles data.")
    }
  }

  // Load bookings table
  async function loadBookingsTable() {
    try {
      const tbody = document.querySelector("#bookings-table tbody")
      showLoading(tbody)

      bookingData = await DatabaseService.getBookings()
      tbody.innerHTML = ""

      bookingData.forEach((booking) => {
        const row = document.createElement("tr")
        const vehicleName = booking.vehicles
          ? `${booking.vehicles.make} ${booking.vehicles.model} (${booking.vehicles.year})`
          : "Vehicle Info N/A"

        row.innerHTML = `
          <td>${booking.booking_id}</td>
          <td>${booking.customer_name}</td>
          <td>${vehicleName}</td>
          <td>${booking.rental_duration} ${booking.rental_type.replace("ly", "")}(s)</td>
          <td>${DatabaseService.formatCurrency(booking.total_price)}</td>
          <td><span class="status ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
        `
        tbody.appendChild(row)
      })
    } catch (error) {
      console.error("Error loading bookings table:", error)
      showError("Failed to load bookings data.")
    }
  }

  // Add vehicle form
  const addVehicleForm = document.getElementById("add-vehicle-form")
  addVehicleForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const submitButton = addVehicleForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.textContent = "Adding..."

      const formData = new FormData(addVehicleForm)

      const newVehicle = {
        make: formData.get("make"),
        model: formData.get("model"),
        year: Number.parseInt(formData.get("year")),
        category: formData.get("category"),
        dailyRate: Number.parseFloat(formData.get("dailyRate")),
        hourlyRate: Number.parseFloat(formData.get("hourlyRate")),
        features: ["Air Conditioning", "Bluetooth"], // Default features
      }

      await DatabaseService.addVehicle(newVehicle)

      // Refresh dashboard
      await loadDashboardData()

      // Reset form
      addVehicleForm.reset()

      showSuccess("Vehicle added successfully!")
    } catch (error) {
      console.error("Error adding vehicle:", error)
      showError(error.message || "Failed to add vehicle. Please try again.")
    } finally {
      const submitButton = addVehicleForm.querySelector('button[type="submit"]')
      submitButton.disabled = false
      submitButton.textContent = "Add Vehicle"
    }
  })

  // Global functions for vehicle management
  window.editVehicle = async (vehicleId) => {
    try {
      const vehicle = vehicleData.find((v) => v.id === vehicleId)
      if (!vehicle) return

      const newDailyRate = prompt(`Edit daily rate for ${vehicle.make} ${vehicle.model}:`, vehicle.daily_rate)
      if (newDailyRate && !isNaN(newDailyRate)) {
        const updates = {
          daily_rate: Number.parseFloat(newDailyRate),
          hourly_rate: Math.round(Number.parseFloat(newDailyRate) / 5), // Auto-calculate hourly rate
        }

        await DatabaseService.updateVehicle(vehicleId, updates)
        await loadVehiclesTable()
        await updateStatistics()

        showSuccess("Vehicle updated successfully!")
      }
    } catch (error) {
      console.error("Error updating vehicle:", error)
      showError("Failed to update vehicle. Please try again.")
    }
  }

  window.deleteVehicle = async (vehicleId) => {
    try {
      const vehicle = vehicleData.find((v) => v.id === vehicleId)
      if (!vehicle) return

      if (vehicle.status === "rented") {
        showError("Cannot delete a vehicle that is currently rented.")
        return
      }

      if (confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) {
        await DatabaseService.deleteVehicle(vehicleId)
        await loadDashboardData()
        showSuccess("Vehicle deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      showError("Failed to delete vehicle. Please try again.")
    }
  }
})
