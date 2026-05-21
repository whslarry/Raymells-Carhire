// Authentication API Module
// Handles user authentication and customer/admin profile management

import getSupabaseClient from '../config/supabase.js';

/**
 * Sign up a new customer
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} profileData - Customer profile data
 * @returns {Promise<Object>} - { user, profile, error }
 */
export async function signUpCustomer(email, password, profileData) {
  try {
    const supabase = await getSupabaseClient();

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'customer'
        }
      }
    });

    if (authError) throw authError;

    // Create customer profile
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .insert([
        {
          user_id: authData.user.id,
          full_name: profileData.full_name,
          phone: profileData.phone,
          email: profileData.email,
          address: profileData.address,
          license_number: profileData.license_number,
          license_expiry: profileData.license_expiry
        }
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    return { user: authData.user, profile, error: null };
  } catch (error) {
    console.error('[v0] Sign up error:', error);
    return { user: null, profile: null, error };
  }
}

/**
 * Sign in a customer
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - { user, session, profile, error }
 */
export async function signInCustomer(email, password) {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Fetch customer profile
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    return { user: data.user, session: data.session, profile, error: null };
  } catch (error) {
    console.error('[v0] Sign in error:', error);
    return { user: null, session: null, profile: null, error };
  }
}

/**
 * Sign in as admin staff
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} - { user, session, staff, error }
 */
export async function signInAdmin(email, password) {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Verify user is admin staff
    const { data: staff, error: staffError } = await supabase
      .from('admin_staff')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (staffError) {
      throw new Error('User is not registered as admin staff');
    }

    return { user: data.user, session: data.session, staff, error: null };
  } catch (error) {
    console.error('[v0] Admin sign in error:', error);
    return { user: null, session: null, staff: null, error };
  }
}

/**
 * Sign out current user
 * @returns {Promise<Object>} - { error }
 */
export async function signOut() {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[v0] Sign out error:', error);
    return { error };
  }
}

/**
 * Get current session
 * @returns {Promise<Object>} - { user, session, error }
 */
export async function getSession() {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { user: data.session?.user, session: data.session, error: null };
  } catch (error) {
    console.error('[v0] Get session error:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Get current user
 * @returns {Promise<Object>} - { user, error }
 */
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error('[v0] Get user error:', error);
    return { user: null, error };
  }
}

/**
 * Update customer profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - { profile, error }
 */
export async function updateCustomerProfile(userId, profileData) {
  try {
    const supabase = await getSupabaseClient();

    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { profile, error: null };
  } catch (error) {
    console.error('[v0] Update profile error:', error);
    return { profile: null, error };
  }
}

/**
 * Get customer profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - { profile, error }
 */
export async function getCustomerProfile(userId) {
  try {
    const supabase = await getSupabaseClient();

    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { profile, error: null };
  } catch (error) {
    console.error('[v0] Get profile error:', error);
    return { profile: null, error };
  }
}

/**
 * Reset password
 * @param {string} email - User email
 * @returns {Promise<Object>} - { error }
 */
export async function resetPassword(email) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[v0] Reset password error:', error);
    return { error };
  }
}

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - { error }
 */
export async function updatePassword(newPassword) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[v0] Update password error:', error);
    return { error };
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const { user } = await getSession();
  return !!user;
}

/**
 * Check if user is admin
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function isAdmin(userId) {
  try {
    const supabase = await getSupabaseClient();

    const { data } = await supabase
      .from('admin_staff')
      .select('*')
      .eq('user_id', userId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}
