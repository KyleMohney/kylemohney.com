// ======================================================
// CLIENT SIGNUP HANDLER â€” Rooted Vitality (Enhanced)
// ======================================================
// Purpose: Handle client registration via Supabase Auth
// Includes password confirmation and email verification
// ======================================================

window.addEventListener('DOMContentLoaded', async () => {

  
  // Check if Supabase is loaded
  if (!window.supabaseClient) {
    console.error('[Signup] CRITICAL: Supabase client not initialized!');
    console.error('[Signup] window.supabaseClient:', window.supabaseClient);
    alert('Authentication system not ready. Please refresh the page.');
    return;
  }
  

  
  const form = document.getElementById('rvSignupForm');
  
  if (!form) {
    console.error('[Signup] CRITICAL: Signup form not found in DOM!');
    alert('Page not ready. Please refresh.');
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();


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
          console.error('âŒ [Signup] Auth error full details:', authError);
          console.error('âŒ [Signup] Auth error message:', authError.message);
          console.error('âŒ [Signup] Auth error status:', authError.status);
          console.error('âŒ [Signup] Auth error code:', authError.code);
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
      










      
      const { error: clientError } = await window.supabaseClient
        .from('clients')
        .insert([clientData]);

      if (clientError) {
        console.error('âŒ [Signup] Client record error details:', clientError);
        console.error('âŒ [Signup] Error code:', clientError.code);
        console.error('âŒ [Signup] Error message:', clientError.message);
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



      // ============ 6A. Create Notification Settings (ALL ENABLED) ============
      try {
        const clientSerial = newClient.serial_number;
        console.log('[Signup] Creating notification settings for client:', clientSerial);

        await window.supabaseClient
          .from('client_notification_settings')
          .insert([{
            client_serial: clientSerial,
            matches_email: true,
            matches_sms: true,
            messages_email: true,
            messages_sms: true,
            reviews_email: true,
            reviews_sms: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        console.log('[Signup] ✓ Notification settings created for', clientSerial);
      } catch (settingsErr) {
        console.warn('[Signup] Warning: Could not create notification settings:', settingsErr);
        // Don't fail signup if settings creation fails - continue anyway
      }

      // ============ 6B. Create Welcome Notification (GUARANTEED) ============
      const welcomeNotification = {
        client_serial: newClient.serial_number,
        type: 'welcome',
        title: 'Welcome to Rooted Vitality!',
        message: 'Thank you for joining our community! We\'re excited to help you on your wellness journey. Get started by creating your first wellness project and connecting with trusted practitioners.',
        is_read: false,
        created_at: new Date().toISOString()
      };

      try {
        // Try with reliability manager if available
        if (window.createGuaranteedNotification) {
          console.log('[Signup] Creating welcome notification using reliability manager...');
          const result = await window.createGuaranteedNotification({
            recipientSerial: newClient.serial_number,
            type: 'welcome',
            userType: 'client',
            title: welcomeNotification.title,
            message: welcomeNotification.message
          });
          console.log('[Signup] Welcome notification result:', result);
        } else {
          // Fallback: Direct insert if reliability manager not available
          console.log('[Signup] Creating welcome notification (direct method)...');
          await window.supabaseClient
            .from('client_notifications')
            .insert([welcomeNotification]);
          console.log('[Signup] ✓ Welcome notification created');
        }
      } catch (notifErr) {
        console.warn('[Signup] Warning: Could not create welcome notification:', notifErr);
        // Don't fail signup if welcome notification fails
      }



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
          

          
          if (sessionData?.session) {

            if (redirectUrl) {

              sessionStorage.removeItem('redirectAfterAuth');
              window.location.href = redirectUrl;
            } else {

              window.location.href = '/rooted-vitality/index.html';
            }
            return true; // Success
          } else {

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

          
          // Try redirect with exponential backoff
          let attempt = 0;
          const maxAttempts = 5;
          const tryRedirect = async () => {
            attempt++;

            
            const success = await attemptRedirect();
            if (!success && attempt < maxAttempts) {
              const nextDelay = 500 * attempt;

              setTimeout(tryRedirect, nextDelay); // Exponential backoff
            } else if (attempt >= maxAttempts && !success) {
              // Fallback: Just go to index anyway

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
        // Fallback: Show modal and proceed with redirect if modal manager isn't loaded
        if (window.ModalManager && window.ModalManager.showSuccess) {
          window.ModalManager.showSuccess('Welcome!', 'Account created successfully. Redirecting to your dashboard...');
        } else {
          alert('Account created! Welcome to Rooted Vitality. Redirecting...');
        }
        
        // Try redirect with exponential backoff
        let attempt = 0;
        const maxAttempts = 5;
        const tryRedirect = async () => {
          attempt++;

          
          const success = await attemptRedirect();
          if (!success && attempt < maxAttempts) {
            const nextDelay = 500 * attempt;

            setTimeout(tryRedirect, nextDelay); // Exponential backoff
          } else if (attempt >= maxAttempts && !success) {
            // Fallback: Just go to index anyway

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
      if (window.ModalManager && window.ModalManager.showError) {
        window.ModalManager.showError('Signup Failed', error.message);
      } else {
        alert(`Signup failed: ${error.message}`);
      }
      
      // ============ 7. Re-enable Button on Error ============
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});


























































