document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("admin-login-form")

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    // Simple authentication (in real app, this would be server-side)
    if (username === "admin" && password === "admin123") {
      // Set admin session
      sessionStorage.setItem("adminLoggedIn", "true")
      window.location.href = "dashboard.html"
    } else {
      alert("Invalid credentials. Please try again.")
    }
  })
})
