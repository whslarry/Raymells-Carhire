// Main JavaScript file with Supabase integration

// Load Supabase from CDN
if (!window.supabase) {
  const script = document.createElement("script")
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
  script.onload = () => {
    // Initialize after Supabase loads
    initializeApp()
  }
  document.head.appendChild(script)
} else {
  initializeApp()
}

function initializeApp() {
  // Mobile menu toggle
  document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger")
    const navMenu = document.querySelector(".nav-menu")

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        navMenu.classList.toggle("active")
      })

      // Close menu when clicking on a link
      document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("active")
        })
      })
    }

    // Load Supabase client if not already loaded
    if (typeof DatabaseService === "undefined") {
      // Declare DatabaseService before using it. Assuming it's defined in supabase-client.js
      window.DatabaseService = window.DatabaseService || {}
      loadSupabaseClient()
    }
  })
}

// Loading state management
function showLoading(element) {
  if (element) {
    element.innerHTML = '<div class="loading">Loading...</div>'
  }
}

function hideLoading() {
  document.querySelectorAll(".loading").forEach((el) => el.remove())
}

// Error handling
function showError(message, element = null) {
  const errorDiv = document.createElement("div")
  errorDiv.className = "error-message"
  errorDiv.innerHTML = `
    <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
      <strong>Error:</strong> ${message}
    </div>
  `

  if (element) {
    element.appendChild(errorDiv)
  } else {
    document.body.appendChild(errorDiv)
  }

  // Auto remove after 5 seconds
  setTimeout(() => errorDiv.remove(), 5000)
}

// Success message
function showSuccess(message, element = null) {
  const successDiv = document.createElement("div")
  successDiv.className = "success-message"
  successDiv.innerHTML = `
    <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
      <strong>Success:</strong> ${message}
    </div>
  `

  if (element) {
    element.appendChild(successDiv)
  } else {
    document.body.appendChild(successDiv)
  }

  // Auto remove after 3 seconds
  setTimeout(() => successDiv.remove(), 3000)
}

// Load Supabase client dynamically
async function loadSupabaseClient() {
  try {
    // This would be loaded from your environment variables
    const supabaseScript = document.createElement("script")
    supabaseScript.src = "supabase-client.js"
    document.head.appendChild(supabaseScript)
  } catch (error) {
    console.error("Error loading Supabase client:", error)
  }
}

// Add loading styles
const loadingStyles = document.createElement("style")
loadingStyles.textContent = `
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    font-size: 1.1rem;
    color: #666;
  }
  
  .loading::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message, .success-message {
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 1001;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`
document.head.appendChild(loadingStyles)
