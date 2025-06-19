// Supabase client configuration
const SUPABASE_URL = "YOUR_SUPABASE_URL"
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"

// Create Supabase client
const { createClient } = supabase

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Database service functions
class DatabaseService {
  // Vehicle operations
  static async getVehicles() {
    try {
      const { data, error } = await supabase.from("vehicles").select("*").order("id", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      return []
    }
  }

  static async getAvailableVehicles() {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "available")
        .order("daily_rate", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching available vehicles:", error)
      return []
    }
  }

  static async getVehicleById(id) {
    try {
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching vehicle:", error)
      return null
    }
  }

  static async addVehicle(vehicle) {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert([
          {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            category: vehicle.category,
            daily_rate: vehicle.dailyRate,
            hourly_rate: vehicle.hourlyRate,
            status: "available",
            features: vehicle.features || ["Air Conditioning", "Bluetooth"],
            image_url: vehicle.image || "/placeholder.svg?height=200&width=300",
          },
        ])
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error("Error adding vehicle:", error)
      throw error
    }
  }

  static async updateVehicle(id, updates) {
    try {
      const { data, error } = await supabase.from("vehicles").update(updates).eq("id", id).select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error("Error updating vehicle:", error)
      throw error
    }
  }

  static async deleteVehicle(id) {
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      throw error
    }
  }

  // Booking operations
  static async getBookings() {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            make,
            model,
            year
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching bookings:", error)
      return []
    }
  }

  static async getBookingById(id) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            make,
            model,
            year,
            category
          )
        `)
        .eq("booking_id", id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching booking:", error)
      return null
    }
  }

  static async createBooking(booking) {
    try {
      // Start a transaction
      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            booking_id: booking.id,
            customer_name: booking.customerName,
            customer_email: booking.customerEmail,
            customer_phone: booking.customerPhone,
            vehicle_id: booking.vehicleId,
            rental_type: booking.rentalType,
            rental_duration: booking.rentalDuration,
            pickup_date: booking.pickupDate,
            return_date: booking.returnDate,
            total_price: booking.totalPrice,
            status: "confirmed",
          },
        ])
        .select()

      if (error) throw error

      // Update vehicle status to rented
      await this.updateVehicle(booking.vehicleId, { status: "rented" })

      return data[0]
    } catch (error) {
      console.error("Error creating booking:", error)
      throw error
    }
  }

  static async updateBookingStatus(bookingId, status) {
    try {
      const { data, error } = await supabase.from("bookings").update({ status }).eq("booking_id", bookingId).select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error("Error updating booking status:", error)
      throw error
    }
  }

  // Statistics
  static async getStatistics() {
    try {
      const [vehiclesResult, bookingsResult] = await Promise.all([
        supabase.from("vehicles").select("status"),
        supabase.from("bookings").select("status"),
      ])

      const vehicles = vehiclesResult.data || []
      const bookings = bookingsResult.data || []

      return {
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === "available").length,
        rentedVehicles: vehicles.filter((v) => v.status === "rented").length,
        maintenanceVehicles: vehicles.filter((v) => v.status === "maintenance").length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter((b) => b.status === "confirmed").length,
        completedBookings: bookings.filter((b) => b.status === "completed").length,
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
      return {
        totalVehicles: 0,
        availableVehicles: 0,
        rentedVehicles: 0,
        maintenanceVehicles: 0,
        totalBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
      }
    }
  }

  // Utility functions
  static generateBookingId() {
    return "BK" + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase()
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  static formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

// Make DatabaseService available globally
window.DatabaseService = DatabaseService
window.supabase = supabase
