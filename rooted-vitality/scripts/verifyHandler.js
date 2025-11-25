// ======================================================
// EMAIL VERIFICATION HANDLER — Rooted Vitality
// ======================================================
// Purpose: Handle email verification page interactions
// Supports resending verification emails on verify.html
// ======================================================

window.addEventListener('DOMContentLoaded', () => {
  const resendBtn = document.getElementById('resendBtn');
  
  if (resendBtn) {
    resendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const userEmail = prompt('Enter the email address associated with your account:');
      
      if (!userEmail) {
        return; // User cancelled
      }
      
      resendBtn.disabled = true;
      const originalText = resendBtn.textContent;
      resendBtn.textContent = 'Sending...';
      
      try {
        // Request a new verification email
        const { error } = await window.supabaseClient.auth.resend({
          type: 'signup',
          email: userEmail.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/welcome.html`
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        alert('Verification email sent! Please check your inbox (and spam folder) for the new link.');
        resendBtn.textContent = originalText;
        resendBtn.disabled = false;
        
      } catch (error) {
        console.error('Resend error:', error);
        alert(`Could not resend email: ${error.message}`);
        resendBtn.textContent = originalText;
        resendBtn.disabled = false;
      }
    });
  }
  
  // ============ Handle Verification from URL ============
  // When user clicks verification link from email, redirect them here with token
  // Supabase automatically handles verification, but we can enhance UX
  const handleFragmentAuth = async () => {
    // Check if there's a verification token in the URL fragment
    const fragment = window.location.hash;
    
    if (fragment.includes('type=signup')) {
      // Verification is being processed by Supabase auth state listener
      // Show a loading state briefly
      console.log('Email verification in progress...');
      
      // Wait a moment for Supabase to process, then check auth state
      setTimeout(() => {
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
          if (session && session.user.email_confirmed_at) {
            // User is verified - redirect to welcome
            window.location.href = './welcome.html';
          }
        });
      }, 1000);
    }
  };
  
  handleFragmentAuth();
});
























































