/**
 * Account Settings Page Script
 * Loads user account info and handles password changes
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadAccountInfo();
  setupPasswordForm();
});

// Load account information
async function loadAccountInfo() {
  try {
    const response = await fetch('/api/profile');
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in - redirect to login
        window.location.href = '../index.html';
        return;
      }
      throw new Error('Failed to load account info');
    }

    const profile = await response.json();

    // Update account information display
    const nameEl = document.getElementById('settingName');
    const emailEl = document.getElementById('settingEmail');
    const createdAtEl = document.getElementById('settingCreatedAt');

    if (nameEl) {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      nameEl.textContent = fullName || 'Student User';
    }

    if (emailEl) {
      emailEl.textContent = profile.email || 'Not available';
    }

    if (createdAtEl) {
      createdAtEl.textContent = formatDate(profile.created_at);
    }

  } catch (err) {
    console.error('Error loading account info:', err);
    showAlert('Failed to load account information', 'danger');
  }
}

// Setup password change form
function setupPasswordForm() {
  const form = document.getElementById('passwordForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = form.querySelector('[name="currentPassword"]').value;
    const newPassword = form.querySelector('[name="newPassword"]').value;

    // Validation
    if (!currentPassword || !newPassword) {
      showAlert('Please fill in all password fields', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('New password must be at least 6 characters', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      showAlert('Password updated successfully!', 'success');
      form.reset();

    } catch (err) {
      console.error('Password change error:', err);
      showAlert(err.message || 'Failed to change password', 'danger');
    }
  });
}

// Helper: Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Helper: Show alert message
function showAlert(message, type = 'info') {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.settings-alert');
  existingAlerts.forEach(alert => alert.remove());

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show settings-alert`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  // Insert at top of card body
  const cardBody = document.querySelector('.card-body');
  if (cardBody) {
    cardBody.insertBefore(alertDiv, cardBody.firstChild);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

