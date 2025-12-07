/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/pro/scripts/profileCompleteness.js                ║
║  Purpose: Profile Completeness Tracking & Calculation              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

Tracks and calculates profile completeness across all sections:
- Bio (About You, Your Approach & Philosophy)
- Credentials (Licenses, Certifications, Background Check, Verification)
- Photos & Video
- Reviews
- Additional Details (FAQs, Social, Practice Type, Payment)

Updates UI and database on every save.
*/

class ProfileCompletenessTracker {
  constructor(userId) {
    this.userId = userId;
    this.completionItems = {};
    this.percentages = {
      aboutYou: 0,
      approachPhilosophy: 0,
      licensedBadge: 0,
      certificationBadge: 0,
      backgroundCheckBadge: 0,
      verifiedBadge: 0,
      businessLogo: 0,
      galleryPhotos: 0,
      introductionVideo: 0,
      reviews: 0,
      faqs: 0,
      socialMediaLinks: 0,
      practiceType: 0,
      insuranceProvider: 0,
      paymentMethod: 0,
    };
    this.totalItems = Object.keys(this.percentages).length;
  }

  /**
   * Calculate profile completeness percentage
   * Each item counts as approximately 6.67% (100 / 15 items)
   */
  calculateCompleteness() {
    const completedItems = Object.values(this.percentages).reduce((sum, val) => sum + val, 0);
    return Math.round((completedItems / this.totalItems) * 100);
  }

  /**
   * Update About You section (% if has text)
   */
  checkAboutYou(content) {
    this.percentages.aboutYou = content && content.trim().length > 0 ? 1 : 0;
  }

  /**
   * Update Your Approach & Philosophy section (% if has text)
   */
  checkApproachPhilosophy(content) {
    this.percentages.approachPhilosophy = content && content.trim().length > 0 ? 1 : 0;
  }

  /**
   * Update Licensed badge (% if badge = true)
   */
  checkLicensedBadge(badgeStatus) {
    this.percentages.licensedBadge = badgeStatus ? 1 : 0;
  }

  /**
   * Update Certification badge (% if badge = true)
   */
  checkCertificationBadge(badgeStatus) {
    this.percentages.certificationBadge = badgeStatus ? 1 : 0;
  }

  /**
   * Update Background Check badge (% if badge = true)
   */
  checkBackgroundCheckBadge(badgeStatus) {
    this.percentages.backgroundCheckBadge = badgeStatus ? 1 : 0;
  }

  /**
   * Update Verified badge (% if badge = true)
   */
  checkVerifiedBadge(badgeStatus) {
    this.percentages.verifiedBadge = badgeStatus ? 1 : 0;
  }

  /**
   * Update Business Logo picture (% if picture uploaded)
   */
  checkBusinessLogo(hasLogo) {
    this.percentages.businessLogo = hasLogo ? 1 : 0;
  }

  /**
   * Update Gallery Photos (% if at least 1 photo)
   */
  checkGalleryPhotos(photoCount) {
    this.percentages.galleryPhotos = photoCount >= 1 ? 1 : 0;
  }

  /**
   * Update Introduction Video (% if video uploaded)
   */
  checkIntroductionVideo(hasVideo) {
    this.percentages.introductionVideo = hasVideo ? 1 : 0;
  }

  /**
   * Update Reviews (% if at least 1 review)
   */
  checkReviews(reviewCount) {
    this.percentages.reviews = reviewCount >= 1 ? 1 : 0;
  }

  /**
   * Update FAQs (% if at least 1 FAQ)
   */
  checkFAQs(faqCount) {
    this.percentages.faqs = faqCount >= 1 ? 1 : 0;
  }

  /**
   * Update Social Media Links (% if at least 1 link)
   */
  checkSocialMediaLinks(linkCount) {
    this.percentages.socialMediaLinks = linkCount >= 1 ? 1 : 0;
  }

  /**
   * Update Practice Type (% if practice type & setting selected)
   */
  checkPracticeType(practiceType) {
    this.percentages.practiceType = practiceType && practiceType.trim().length > 0 ? 1 : 0;
  }

  /**
   * Update Insurance Provider (% if at least 1 selected)
   */
  checkInsuranceProvider(insuranceList) {
    this.percentages.insuranceProvider = insuranceList && insuranceList.length >= 1 ? 1 : 0;
  }

  /**
   * Update Payment Method (% if at least 1 selected)
   */
  checkPaymentMethod(paymentList) {
    this.percentages.paymentMethod = paymentList && paymentList.length >= 1 ? 1 : 0;
  }

  /**
   * Update UI elements with current completeness percentage
   */
  updateUI(percentage) {
    const progressBar = document.getElementById('completeness-progress');
    const percentageText = document.getElementById('completeness-percentage');
    const completenessLabel = document.getElementById('completeness-label');

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    if (percentageText) {
      percentageText.textContent = `${percentage}%`;
    }

    if (completenessLabel) {
      if (percentage === 100) {
        completenessLabel.textContent = '🎉 Profile Complete!';
      } else if (percentage >= 75) {
        completenessLabel.textContent = 'Almost there! Keep going.';
      } else if (percentage >= 50) {
        completenessLabel.textContent = 'Great progress! Fill in more sections.';
      } else {
        completenessLabel.textContent = 'Fill in sections to complete your profile';
      }
    }
  }

  /**
   * Save completeness to database
   */
  async saveToDatabase(completenessPercentage) {
    try {
      const { data, error } = await supabase
        .from('practitioner_profiles')
        .update({ profile_completeness_percent: completenessPercentage })
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error saving completeness to database:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Exception saving completeness:', err);
      return false;
    }
  }

  /**
   * Full completeness update workflow
   */
  async updateCompleteness() {
    const percentage = this.calculateCompleteness();
    this.updateUI(percentage);
    await this.saveToDatabase(percentage);
    return percentage;
  }
}

// Initialize global completeness tracker
let profileCompletenessTracker = null;

// Initialize tracker when user data loads
document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    profileCompletenessTracker = new ProfileCompletenessTracker(userId);
  }
});

/**
 * Call this from practitioner_profile.js after each save operation
 * to recalculate and update completeness
 */
async function recalculateProfileCompleteness() {
  if (!profileCompletenessTracker) {
    console.warn('Profile completeness tracker not initialized');
    return;
  }

  try {
    // Get current profile data
    const userId = localStorage.getItem('user_id');
    const { data: profileData, error } = await supabase
      .from('practitioner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile data:', error);
      return;
    }

    // Update each completeness item
    const aboutContent = document.getElementById('about-content')?.value || '';
    const approachContent = document.getElementById('approach-content')?.value || '';

    profileCompletenessTracker.checkAboutYou(aboutContent);
    profileCompletenessTracker.checkApproachPhilososophy(approachContent);

    // Check badges
    const licenseBadge = document.getElementById('badge-license');
    const certBadge = document.getElementById('badge-certified');
    const bgCheckBadge = document.getElementById('badge-background-check');
    const verifiedBadge = document.getElementById('badge-verified');

    profileCompletenessTracker.checkLicensedBadge(
      licenseBadge && !licenseBadge.classList.contains('badge-locked')
    );
    profileCompletenessTracker.checkCertificationBadge(
      certBadge && !certBadge.classList.contains('badge-locked')
    );
    profileCompletenessTracker.checkBackgroundCheckBadge(
      bgCheckBadge && !bgCheckBadge.classList.contains('badge-locked')
    );
    profileCompletenessTracker.checkVerifiedBadge(
      verifiedBadge && !verifiedBadge.classList.contains('badge-locked')
    );

    // Check business logo
    const profilePicture = document.querySelector('.profile-picture-display img');
    profileCompletenessTracker.checkBusinessLogo(profilePicture && profilePicture.src);

    // Check gallery photos
    const photosList = document.getElementById('photos-list');
    const photoCount = photosList ? photosList.querySelectorAll('.photo-item').length : 0;
    profileCompletenessTracker.checkGalleryPhotos(photoCount);

    // Check introduction video
    const videoList = document.getElementById('video-list');
    const hasVideo = videoList && videoList.querySelector('video');
    profileCompletenessTracker.checkIntroductionVideo(!!hasVideo);

    // Check reviews
    const reviewsContainer = document.getElementById('reviews-container');
    const reviewCount = reviewsContainer ? reviewsContainer.querySelectorAll('.review-item').length : 0;
    profileCompletenessTracker.checkReviews(reviewCount);

    // Check FAQs
    const faqList = document.getElementById('faq-list');
    const faqCount = faqList ? faqList.querySelectorAll('.faq-item').length : 0;
    profileCompletenessTracker.checkFAQs(faqCount);

    // Check social media links
    const socialLinks = [
      document.getElementById('social-facebook')?.value,
      document.getElementById('social-instagram')?.value,
      document.getElementById('social-x')?.value,
      document.getElementById('social-linkedin')?.value,
      document.getElementById('social-youtube')?.value,
      document.getElementById('social-tiktok')?.value,
      document.getElementById('social-pinterest')?.value,
      document.getElementById('social-website')?.value,
    ].filter(link => link && link.trim().length > 0);
    profileCompletenessTracker.checkSocialMediaLinks(socialLinks.length);

    // Check practice type
    const practiceTypeRadio = document.querySelector('input[name="practice-setting"]:checked');
    profileCompletenessTracker.checkPracticeType(practiceTypeRadio ? practiceTypeRadio.value : '');

    // Check insurance providers
    const insuranceCheckboxes = document.querySelectorAll('input[name="insurance-provider"]:checked');
    profileCompletenessTracker.checkInsuranceProvider(Array.from(insuranceCheckboxes).map(cb => cb.value));

    // Check payment methods
    const paymentCheckboxes = document.querySelectorAll('input[name="payment-method"]:checked');
    profileCompletenessTracker.checkPaymentMethod(Array.from(paymentCheckboxes).map(cb => cb.value));

    // Update completeness
    await profileCompletenessTracker.updateCompleteness();
  } catch (err) {
    console.error('Error recalculating profile completeness:', err);
  }
}
