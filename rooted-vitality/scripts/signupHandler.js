// ======================================================
// CLIENT SIGNUP HANDLER — Rooted Vitality (Enhanced)
// ======================================================
// Purpose: Handle client registration via Supabase Auth
// Includes password confirmation and email verification
// ======================================================

window.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('rvSignupForm');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // ============ 1. Collect Form Data ============
    const firstName = form.querySelector('#firstName').value.trim();
    const lastName  = form.querySelector('#lastName').value.trim();
    const email     = form.querySelector('#email').value.trim();
    const phone     = form.querySelector('#phone').value.trim();
    const password  = form.querySelector('#password').value.trim();
    const confirmPassword = form.querySelector('#confirmPassword').value.trim();
    const age       = form.querySelector('#age').value || null;
    const sex       = form.querySelector('#sex').value || null;
    const termsAccepted = form.querySelector('#terms').checked;

    // ============ 2. Validate Required Fields ============
    if (!firstName || !lastName || !email || !phone || !password) {
      alert('Please complete all required fields (marked with *).');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match. Please check your entries.');
      return;
    }

    if (!termsAccepted) {
      alert('You must accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    // ============ 3. Disable Submit Button (UX) ============
    const submitBtn = form.querySelector('.signup-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      // ============ 4. Create Supabase Auth User ============
      // Since no email verification required, user goes straight to index
      const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/rooted-vitality/index.html`
        }
      });

      if (authError) {
        // Log full error details for debugging (suppress in console for common errors)
        if (authError.status !== 500) {
          console.error('❌ [Signup] Auth error full details:', authError);
          console.error('❌ [Signup] Auth error message:', authError.message);
          console.error('❌ [Signup] Auth error status:', authError.status);
          console.error('❌ [Signup] Auth error code:', authError.code);
        }
        
        // Parse Supabase error for friendly message
        let friendlyMessage = 'Signup failed. Please try again.';
        
        if (authError.message.includes('already registered')) {
          friendlyMessage = 'This email address is already registered. Please log in or use a different email.';
        } else if (authError.message.includes('invalid email')) {
          friendlyMessage = 'Please enter a valid email address.';
        } else if (authError.message.includes('password')) {
          friendlyMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (authError.message.includes('network') || authError.message.includes('Connection')) {
          friendlyMessage = 'Network error. Please check your connection and try again.';
        } else if (authError.status === 500) {
          friendlyMessage = `Server error. Please try again in a moment.`;
        } else {
          friendlyMessage = `Signup failed: ${authError.message}`;
        }
        
        throw new Error(friendlyMessage);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account.');
      }

      // ============ 5. Update Profile Data ============
      // Profile is auto-created by database trigger, now update with additional fields
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        phone,
        age: age ? parseInt(age) : null,
        sex: sex || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 [Signup] Updating profile data:', profileData);
      
      const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .update(profileData)
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('❌ [Signup] Profile error details:', profileError);
        console.error('❌ [Signup] Error code:', profileError.code);
        console.error('❌ [Signup] Error message:', profileError.message);
        console.error('❌ [Signup] Error hint:', profileError.hint);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('✅ [Signup] Profile created successfully!');

      // ============ 6. Success: Show Message & Redirect ============
      // No email verification required - redirect straight to index
      alert('Account created! Welcome to Rooted Vitality.');
      window.location.href = '/rooted-vitality/index.html';

    } catch (error) {
      console.error('Signup error:', error);
      alert(`Signup failed: ${error.message}`);
      
      // ============ 7. Re-enable Button on Error ============
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
