// ======================================================
// CLIENT SIGNUP HANDLER — Rooted Vitality (Enhanced)
// ======================================================
// Purpose: Handle client registration via Supabase Auth
// Includes password confirmation and email verification
// ======================================================

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Signup] Page loaded, initializing signup handler...');
  
  // Check if Supabase is loaded
  if (!window.supabaseClient) {
    console.error('[Signup] CRITICAL: Supabase client not initialized!');
    console.error('[Signup] window.supabaseClient:', window.supabaseClient);
    alert('Authentication system not ready. Please refresh the page.');
    return;
  }
  
  console.log('[Signup] Supabase client confirmed initialized');
  
  const form = document.getElementById('rvSignupForm');
  
  if (!form) {
    console.error('[Signup] CRITICAL: Signup form not found in DOM!');
    alert('Page not ready. Please refresh.');
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    console.log('[Signup] Form submitted');

    // ============ 1. Collect Form Data ============
    const firstName = form.querySelector('#firstName').value.trim();
    const lastName  = form.querySelector('#lastName').value.trim();
    const email     = form.querySelector('#email').value.trim();
    const confirmEmail = form.querySelector('#confirmEmail').value.trim();
    const phone     = form.querySelector('#phone').value.trim();
    const address   = form.querySelector('#address').value.trim();
    const city      = form.querySelector('#city').value.trim();
    const state     = form.querySelector('#state').value.trim().toUpperCase();
    const zipcode   = form.querySelector('#zipcode').value.trim();
    const dob       = form.querySelector('#dob').value;
    const sex       = form.querySelector('#sex').value || null;
    const password  = form.querySelector('#password').value.trim();
    const confirmPassword = form.querySelector('#confirmPassword').value.trim();
    const termsAccepted = form.querySelector('#terms').checked;

    // ============ 2. Validate Required Fields ============
    if (!firstName || !lastName || !email || !confirmEmail || !phone || !address || !city || !state || !zipcode || !sex || !password || !dob) {
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

    // Validate phone has at least some digits
    const phoneDigitsOnly = phone.replace(/\D/g, '');
    if (phoneDigitsOnly.length === 0) {
      alert('Please enter a valid phone number with at least one digit.');
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
      // Match schema in guidedOnboarding.js for consistency
      
      // Normalize phone to 10 digits only (remove formatting)
      // phoneDigitsOnly was already validated above to have at least 1 digit
      const normalizedPhone = phoneDigitsOnly.slice(-10); // Take last 10 digits in case of country codes
      
      const clientData = {
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
        address: address,
        city: city,
        state: state,
        zipcode: zipcode.trim().slice(0, 10), // Ensure max 10 chars
        sex: sex,
        age: age,
        date_of_birth: dob
      };
      
      console.log('📝 [Signup] Field lengths:');
      console.log('  - id length:', authData.user.id.length, 'value:', authData.user.id);
      console.log('  - email length:', email.length, 'value:', email);
      console.log('  - first_name length:', firstName.length, 'value:', firstName);
      console.log('  - last_name length:', lastName.length, 'value:', lastName);
      console.log('  - phone length:', normalizedPhone.length, 'original:', phone, 'normalized:', normalizedPhone);
      console.log('  - zipcode length:', zipcode.length, 'original:', zipcode, 'normalized:', clientData.zipcode);
      console.log('  - sex length:', sex ? sex.length : 0, 'value:', sex);
      console.log('  - age type:', typeof age, 'value:', age);
      console.log('📝 [Signup] Creating client record:', clientData);
      
      const { error: clientError } = await window.supabaseClient
        .from('clients')
        .insert([clientData]);

      if (clientError) {
        console.error('❌ [Signup] Client record error details:', clientError);
        console.error('❌ [Signup] Error code:', clientError.code);
        console.error('❌ [Signup] Error message:', clientError.message);
        console.error('[Signup] Error hint:', clientError.hint);
        console.error('[Signup] Full error object:', JSON.stringify(clientError, null, 2));
        
        // Provide user-friendly error message
        let friendlyMsg = 'Failed to create your profile. ';
        if (clientError.message.includes('duplicate')) {
          friendlyMsg += 'This email is already in use.';
        } else if (clientError.message.includes('not_unique')) {
          friendlyMsg += 'This email is already in use.';
        } else if (clientError.message.includes('relation does not exist')) {
          friendlyMsg += 'System configuration issue. Please contact support.';
        } else {
          friendlyMsg += clientError.message;
        }
        
        throw new Error(friendlyMsg);
      }

      console.log('[Signup] Client record created successfully!');

      // ============ 6. Create Welcome Notification ============
      const welcomeNotification = {
        client_serial: authData.user.id,
        type: 'welcome',
        title: 'Welcome to Rooted Vitality!',
        message: 'Thank you for joining our community! We\'re excited to help you on your wellness journey. Get started by creating your first wellness project and connecting with trusted practitioners.',
        is_read: false,
        created_at: new Date().toISOString()
      };

      try {
        await window.supabaseClient
          .from('client_notifications')
          .insert([welcomeNotification]);
      } catch (err) {
        console.warn('Welcome notification insertion note:', err);
      }

      console.log('[Signup] Welcome notification created');

      // ============ 7. Success: Show Message & Redirect ============
      // Show warm welcome modal
      const clientFirstName = form.querySelector('#first-name')?.value.trim() || '';
      const welcomeName = clientFirstName ? clientFirstName : 'Friend';
      
      // Disable form and show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Redirecting...';
      form.style.opacity = '0.5';
      form.style.pointerEvents = 'none';
      
      // Check if there's a redirect URL from a previous action (like landing page CTA)
      const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
      
      // Function to attempt redirect
      const attemptRedirect = async () => {
        try {
          // Verify session is established before redirecting
          const { data: sessionData } = await window.supabaseClient.auth.getSession();
          
          console.log('[Signup] Session check result:', sessionData?.session ? 'Session found' : 'No session');
          
          if (sessionData?.session) {
            console.log('[Signup] Session confirmed, redirecting...');
            if (redirectUrl) {
              console.log('[Signup] Redirect URL found:', redirectUrl);
              sessionStorage.removeItem('redirectAfterAuth');
              window.location.href = redirectUrl;
            } else {
              console.log('[Signup] No redirect URL, going to index');
              window.location.href = '/rooted-vitality/index.html';
            }
            return true; // Success
          } else {
            console.warn('[Signup] Session not established yet');
            return false; // Retry
          }
        } catch (err) {
          console.error('[Signup] Exception in attemptRedirect:', err);
          return false; // Retry on error
        }
      };
      
      // Show custom welcome modal and trigger redirect on close
      if (window.showWelcomeModal) {
        window.showWelcomeModal(welcomeName, () => {
          console.log('[Signup] Welcome modal closed, starting redirect sequence...');
          
          // Try redirect with exponential backoff
          let attempt = 0;
          const maxAttempts = 5;
          const tryRedirect = async () => {
            attempt++;
            console.log(`[Signup] Redirect attempt ${attempt}/${maxAttempts}`);
            
            const success = await attemptRedirect();
            if (!success && attempt < maxAttempts) {
              const nextDelay = 500 * attempt;
              console.log(`[Signup] Will retry in ${nextDelay}ms`);
              setTimeout(tryRedirect, nextDelay); // Exponential backoff
            } else if (attempt >= maxAttempts && !success) {
              // Fallback: Just go to index anyway
              console.warn('[Signup] Max attempts reached, forcing redirect');
              if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterAuth');
                window.location.href = redirectUrl;
              } else {
                window.location.href = '/rooted-vitality/index.html';
              }
            }
          };
          
          tryRedirect();
        });
      } else {
        // Fallback: Show alert and proceed with redirect if modal manager isn't loaded
        alert('Account created! Welcome to Rooted Vitality. Redirecting...');
        
        // Try redirect with exponential backoff
        let attempt = 0;
        const maxAttempts = 5;
        const tryRedirect = async () => {
          attempt++;
          console.log(`[Signup] Redirect attempt ${attempt}/${maxAttempts}`);
          
          const success = await attemptRedirect();
          if (!success && attempt < maxAttempts) {
            const nextDelay = 500 * attempt;
            console.log(`[Signup] Will retry in ${nextDelay}ms`);
            setTimeout(tryRedirect, nextDelay); // Exponential backoff
          } else if (attempt >= maxAttempts && !success) {
            // Fallback: Just go to index anyway
            console.warn('[Signup] Max attempts reached, forcing redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('redirectAfterAuth');
              window.location.href = redirectUrl;
            } else {
              window.location.href = '/rooted-vitality/index.html';
            }
          }
        };
        
        tryRedirect();
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      alert(`Signup failed: ${error.message}`);
      
      // ============ 7. Re-enable Button on Error ============
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
























































