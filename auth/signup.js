// Customer Sign Up Module
import { signUpCustomer } from '../api/auth.js';

const signupForm = document.getElementById('signup-form');
const formError = document.getElementById('form-error');

// Handle form submission
if (signupForm) {
  signupForm.addEventListener('submit', handleSignUp);
}

/**
 * Handle customer sign up
 * @param {Event} event - Form submit event
 */
async function handleSignUp(event) {
  event.preventDefault();

  // Clear previous errors
  formError.textContent = '';
  document.querySelectorAll('.error-message').forEach(el => {
    if (el.id !== 'form-error') el.textContent = '';
  });

  // Get form data
  const formData = new FormData(signupForm);
  const email = formData.get('email').trim();
  const password = formData.get('password');
  const passwordConfirm = formData.get('password-confirm');
  const fullName = formData.get('full-name').trim();
  const phone = formData.get('phone').trim();
  const address = formData.get('address').trim();
  const licenseNumber = formData.get('license-number').trim();
  const licenseExpiry = formData.get('license-expiry');

  // Validate input
  let hasErrors = false;

  if (!email) {
    document.getElementById('email-error').textContent = 'Email is required';
    hasErrors = true;
  } else if (!email.includes('@')) {
    document.getElementById('email-error').textContent = 'Please enter a valid email';
    hasErrors = true;
  }

  if (!password) {
    document.getElementById('password-error').textContent = 'Password is required';
    hasErrors = true;
  } else if (password.length < 6) {
    document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
    hasErrors = true;
  }

  if (password !== passwordConfirm) {
    document.getElementById('password-confirm-error').textContent = 'Passwords do not match';
    hasErrors = true;
  }

  if (!fullName) {
    document.getElementById('full-name-error').textContent = 'Full name is required';
    hasErrors = true;
  }

  if (!phone) {
    document.getElementById('phone-error').textContent = 'Phone number is required';
    hasErrors = true;
  }

  if (!address) {
    document.getElementById('address-error').textContent = 'Address is required';
    hasErrors = true;
  }

  if (!licenseNumber) {
    document.getElementById('license-number-error').textContent = 'License number is required';
    hasErrors = true;
  }

  if (!licenseExpiry) {
    document.getElementById('license-expiry-error').textContent = 'License expiry date is required';
    hasErrors = true;
  } else {
    // Check if license expiry is in the future
    const expiryDate = new Date(licenseExpiry);
    const today = new Date();
    if (expiryDate < today) {
      document.getElementById('license-expiry-error').textContent = 'License expiry date must be in the future';
      hasErrors = true;
    }
  }

  if (hasErrors) {
    return;
  }

  try {
    // Show loading state
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    // Attempt sign up
    const profileData = {
      full_name: fullName,
      phone,
      email,
      address,
      license_number: licenseNumber,
      license_expiry: licenseExpiry
    };

    const { user, error } = await signUpCustomer(email, password, profileData);

    if (error) {
      formError.textContent = error.message || 'Sign up failed. Please try again.';
      console.error('[v0] Sign up error:', error);
      return;
    }

    if (user) {
      // Show success message and redirect
      alert('Account created successfully! Please check your email to verify your account.');
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('[v0] Sign up exception:', error);
    formError.textContent = 'An unexpected error occurred. Please try again.';
  } finally {
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}
