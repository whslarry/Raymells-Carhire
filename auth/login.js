// Customer Login Module
import { signInCustomer } from '../api/auth.js';

const loginForm = document.getElementById('login-form');
const formError = document.getElementById('form-error');

// Handle form submission
if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

/**
 * Handle customer login
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
  event.preventDefault();

  // Clear previous errors
  formError.textContent = '';
  document.querySelectorAll('.error-message').forEach(el => {
    if (el.id !== 'form-error') el.textContent = '';
  });

  // Get form data
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Validate input
  if (!email) {
    document.getElementById('email-error').textContent = 'Email is required';
    return;
  }

  if (!password) {
    document.getElementById('password-error').textContent = 'Password is required';
    return;
  }

  try {
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    // Attempt login
    const { user, error } = await signInCustomer(email, password);

    if (error) {
      formError.textContent = error.message || 'Login failed. Please check your credentials and try again.';
      console.error('[v0] Login error:', error);
      return;
    }

    if (user) {
      // Redirect to dashboard
      window.location.href = '../dashboard.html';
    }
  } catch (error) {
    console.error('[v0] Login exception:', error);
    formError.textContent = 'An unexpected error occurred. Please try again.';
  } finally {
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}
