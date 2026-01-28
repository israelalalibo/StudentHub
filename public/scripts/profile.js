/**
 * Profile Page Script
 * Loads and displays user profile data, stats, and reviews
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfileData();
  await loadUserReviews();
  await loadBalance();
});

// Load user profile data and stats
async function loadProfileData() {
  try {
    const response = await fetch('/api/profile');
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in - redirect to login
        window.location.href = '../index.html';
        return;
      }
      throw new Error('Failed to load profile');
    }

    const profile = await response.json();

    // Update profile image with picture or initials
    const profileImageContainer = document.getElementById('profileImageContainer');
    const initials = getInitials(profile.first_name, profile.last_name);
    
    if (profile.profile_picture) {
      profileImageContainer.innerHTML = `
        <img src="${profile.profile_picture}" 
             alt="Profile Picture" 
             class="profile-avatar-large"
             style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #667eea;"
             onerror="this.outerHTML='<div class=\\'profile-avatar-large\\'>${initials}</div>'">
      `;
    } else {
      profileImageContainer.innerHTML = `
        <div class="profile-avatar-large">
          ${initials}
        </div>
      `;
    }

    // Update username title
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Student User';
    document.getElementById('usernameTitle').textContent = fullName;

    // Update account information
    document.getElementById('emailField').textContent = profile.email || 'Not available';
    document.getElementById('createdAtField').textContent = formatDate(profile.created_at);

<<<<<<< HEAD
    // Update activity stats - both badges and stat cards
    const itemsListedBadge = document.querySelector('#albumsCreatedField .badge');
    const reviewsBadge = document.querySelector('#reviewsField .badge');
    const itemsListedStat = document.getElementById('itemsListedStat');
    const reviewsWrittenStat = document.getElementById('reviewsWrittenStat');
    
    const itemsCount = profile.items_listed || 0;
    const reviewsCount = profile.reviews_written || 0;
    
    // Update badges (hidden section, if exists)
    if (itemsListedBadge) {
      itemsListedBadge.textContent = itemsCount;
    }
    if (reviewsBadge) {
      reviewsBadge.textContent = reviewsCount;
    }
    
    // Update stat cards (visible section)
    if (itemsListedStat) {
      itemsListedStat.textContent = itemsCount;
    }
    if (reviewsWrittenStat) {
      reviewsWrittenStat.textContent = reviewsCount;
    }
=======
    // Update activity stats
    const itemsListedBadge = document.querySelector('#albumsCreatedField .badge');
    const reviewsBadge = document.querySelector('#reviewsField .badge');
    
    itemsListedBadge.textContent = profile.items_listed || 0;
    reviewsBadge.textContent = profile.reviews_written || 0;
>>>>>>> 0bea6f1c853238cd32a472e003ad74886c9866e0

  } catch (err) {
    console.error('Error loading profile:', err);
    showError('Failed to load profile data. Please try again.');
  }
}

// Load user's balance
async function loadBalance() {
  try {
    const response = await fetch('/api/balance');
    
    if (!response.ok) {
      console.log('Balance not available');
      return;
    }

    const data = await response.json();
    
    const balanceAmount = document.getElementById('balanceAmount');
    const totalEarnings = document.getElementById('totalEarnings');
    
    if (balanceAmount) {
<<<<<<< HEAD
      balanceAmount.textContent = `£${parseFloat(data.balance || 0).toFixed(2)}`;
    }
    if (totalEarnings) {
      totalEarnings.textContent = `£${parseFloat(data.total_earnings || 0).toFixed(2)}`;
=======
      balanceAmount.textContent = `$${parseFloat(data.balance || 0).toFixed(2)}`;
    }
    if (totalEarnings) {
      totalEarnings.textContent = `$${parseFloat(data.total_earnings || 0).toFixed(2)}`;
>>>>>>> 0bea6f1c853238cd32a472e003ad74886c9866e0
    }

  } catch (err) {
    console.error('Error loading balance:', err);
  }
}

// Load user's reviews
async function loadUserReviews() {
  try {
    const response = await fetch('/reviews/user');
    
    if (!response.ok) {
      throw new Error('Failed to load reviews');
    }

    const reviews = await response.json();
    renderUserReviews(reviews);

  } catch (err) {
    console.error('Error loading reviews:', err);
    document.getElementById('reviewsList').innerHTML = `
      <div class="text-muted text-center py-4">
        <i class="bi bi-exclamation-circle"></i> Failed to load reviews
      </div>
    `;
  }
}

// Render user's reviews
function renderUserReviews(reviews) {
  const reviewsList = document.getElementById('reviewsList');

  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-chat-dots text-muted" style="font-size: 2.5rem;"></i>
        <p class="text-muted mt-2 mb-0">No reviews written yet</p>
        <small class="text-muted">Your reviews will appear here once you review a product</small>
      </div>
    `;
    return;
  }

  reviewsList.innerHTML = reviews.map(review => `
    <div class="review-item mb-3 p-3 bg-light rounded">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <strong class="text-dark">${escapeHtml(review.product_title || 'Product')}</strong>
          <div class="text-warning">
            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
          </div>
        </div>
        <small class="text-muted">${formatDate(review.created_at)}</small>
      </div>
      <p class="mb-0 text-secondary" style="font-size: 0.95rem;">
        ${escapeHtml(review.review_text)}
      </p>
    </div>
  `).join('');
}

// Helper functions
function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last || '?';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function showError(message) {
  const container = document.querySelector('.card-body');
  if (container) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.prepend(alert);
  }
}

