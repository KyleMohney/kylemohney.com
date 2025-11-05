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
    const confirmEmail = form.querySelector('#confirmEmail').value.trim();
    const phone     = form.querySelector('#phone').value.trim();
    const zipcode   = form.querySelector('#zipcode').value.trim();
    const dob       = form.querySelector('#dob').value;
    const sex       = form.querySelector('#sex').value || null;
    const password  = form.querySelector('#password').value.trim();
    const confirmPassword = form.querySelector('#confirmPassword').value.trim();
    const termsAccepted = form.querySelector('#terms').checked;

    // ============ 2. Validate Required Fields ============
    if (!firstName || !lastName || !email || !confirmEmail || !phone || !password || !dob) {
      alert('Please complete all required fields (marked with *).');
      return;
    }

    if (email !== confirmEmail) {
      alert('Email addresses do not match. Please check your entries.');
      return;
    }

    // Calculate age from DOB and verify 18+
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 18) {
      alert('You must be at least 18 years old to use Rooted Vitality.');
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

      // ============ 5. Create Client Record ============
      // Create a new client record with signup data
      
      // Generate serial number for client
      let serialNumber = '';
      try {
        console.log('[Signup] Attempting to generate serial number...');
        console.log('[Signup] serialNumberManager available:', !!window.serialNumberManager);
        console.log('[Signup] supabaseClient available:', !!window.supabaseClient);
        
        serialNumber = await window.serialNumberManager.generateSerialNumber('client');
        console.log('✅ [Signup] Generated client serial number:', serialNumber);
      } catch (serialError) {
        console.error('⚠️ [Signup] Error generating serial number:', serialError.message);
        console.error('⚠️ [Signup] Full error:', serialError);
        // Continue signup even if serial number generation fails - it's not critical
      }
      
      const clientData = {
        user_id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone,
        zipcode,
        age,
        sex,
        account_status: 'active',
        account_standing: 'good',
        serial_number: serialNumber || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 [Signup] Creating client record:', clientData);
      
      const { error: clientError } = await window.supabaseClient
        .from('clients')
        .insert([clientData]);

      if (clientError) {
        console.error('❌ [Signup] Client record error details:', clientError);
        console.error('❌ [Signup] Error code:', clientError.code);
        console.error('❌ [Signup] Error message:', clientError.message);
        console.error('❌ [Signup] Error hint:', clientError.hint);
        throw new Error(`Client record creation failed: ${clientError.message}`);
      }

      console.log('✅ [Signup] Client record created successfully!');

      // ============ 6. Success: Show Message & Redirect ============
      // Wait briefly for Supabase to persist session, then redirect
      alert('Account created! Welcome to Rooted Vitality.');
      
      // Give Supabase time to persist the session to localStorage
      setTimeout(() => {
        window.location.href = '/rooted-vitality/index.html';
      }, 500);

    } catch (error) {
      console.error('Signup error:', error);
      alert(`Signup failed: ${error.message}`);
      
      // ============ 7. Re-enable Button on Error ============
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
