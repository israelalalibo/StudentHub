// My Listings functionality
let allListings = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadListings();
  setupEditForm();
});

// Load listing statistics
async function loadStats() {
  try {
    const response = await fetch('/api/my-listings/stats');
    
    if (!response.ok) {
      if (response.status === 401) {
        document.getElementById('totalListings').textContent = '0';
        document.getElementById('activeListings').textContent = '0';
        document.getElementById('totalValue').textContent = '$0.00';
        return;
      }
      throw new Error('Failed to load stats');
    }

    const stats = await response.json();

    document.getElementById('totalListings').textContent = stats.total_listings || 0;
    document.getElementById('activeListings').textContent = stats.active_listings || 0;
    document.getElementById('totalValue').textContent = formatCurrency(stats.total_value || 0);

  } catch (err) {
    console.error('Error loading stats:', err);
    document.getElementById('totalListings').textContent = '0';
    document.getElementById('activeListings').textContent = '0';
    document.getElementById('totalValue').textContent = '$0.00';
  }
}

// Load all listings
async function loadListings() {
  const listingsGrid = document.getElementById('listingsGrid');

  try {
    const response = await fetch('/api/my-listings');
    
    if (!response.ok) {
      if (response.status === 401) {
        listingsGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">🔒</div>
            <h3>Please log in</h3>
            <p>You need to be logged in to view your listings</p>
            <a href="../index.html" class="btn-new-listing">Log In</a>
          </div>
        `;
        return;
      }
      throw new Error('Failed to load listings');
    }

    const listings = await response.json();
    allListings = listings;

    if (listings.length === 0) {
      listingsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📦</div>
          <h3>No listings yet</h3>
          <p>You haven't listed any items for sale. Start selling to see your listings here!</p>
          <a href="sellItem.html" class="btn-new-listing">➕ Create Your First Listing</a>
        </div>
      `;
      return;
    }

    listingsGrid.innerHTML = listings.map(listing => renderListingCard(listing)).join('');

  } catch (err) {
    console.error('Error loading listings:', err);
    listingsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">⚠️</div>
        <h3>Error loading listings</h3>
        <p>${err.message}</p>
        <button class="btn-new-listing" onclick="loadListings()">Try Again</button>
      </div>
    `;
  }
}

// Render a listing card
function renderListingCard(listing) {
  const imageUrl = sanitizeImageUrl(listing.image_url);
  const createdDate = formatDate(listing.created_at);
  // Use product_id as the primary key (not id)
  const listingId = listing.product_id || listing.id;

  return `
    <div class="listing-card" data-listing-id="${listingId}">
      <div class="listing-image">
        <img src="${imageUrl}" alt="${escapeHtml(listing.title)}" onerror="this.src='../images/default-placeholder.png'">
        <span class="listing-status active">Active</span>
      </div>
      <div class="listing-body">
        <span class="listing-category">${escapeHtml(listing.category || 'Other')}</span>
        <h3 class="listing-title">${escapeHtml(listing.title)}</h3>
        <div class="listing-price">${formatCurrency(listing.price)}</div>
        <div class="listing-meta">
          <span>📦 ${escapeHtml(listing.condition || 'Good')}</span>
          <span>${createdDate}</span>
        </div>
        <div class="listing-actions">
          <button class="btn-edit" onclick="openEditModal('${listingId}')">✏️ Edit</button>
          <button class="btn-delete" onclick="openDeleteModal('${listingId}')">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `;
}

// Setup edit form
function setupEditForm() {
  const editForm = document.getElementById('editForm');
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveListingChanges();
  });
}

// Open edit modal
function openEditModal(listingId) {
  // Find listing by product_id or id
  const listing = allListings.find(l => (l.product_id || l.id) === listingId);
  if (!listing) {
    console.error('Listing not found:', listingId);
    return;
  }

  document.getElementById('editListingId').value = listingId;
  document.getElementById('editTitle').value = listing.title || '';
  document.getElementById('editDescription').value = listing.description || '';
  document.getElementById('editPrice').value = listing.price || '';
  document.getElementById('editCategory').value = listing.category || 'other';
  document.getElementById('editCondition').value = listing.condition || 'Good';

  const modal = document.getElementById('editModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close edit modal
function closeEditModal() {
  const modal = document.getElementById('editModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Save listing changes
async function saveListingChanges() {
  const listingId = document.getElementById('editListingId').value;
  const saveBtn = document.getElementById('saveBtn');
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const response = await fetch(`/api/my-listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        price: document.getElementById('editPrice').value,
        category: document.getElementById('editCategory').value,
        condition: document.getElementById('editCondition').value
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update listing');
    }

    showNotification('Listing updated successfully!', 'success');
    closeEditModal();
    
    // Reload listings and stats
    await loadListings();
    await loadStats();

  } catch (err) {
    console.error('Error updating listing:', err);
    showNotification(err.message || 'Failed to update listing', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
}

// Open delete modal
function openDeleteModal(listingId) {
  document.getElementById('deleteListingId').value = listingId;
  const modal = document.getElementById('deleteModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close delete modal
function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Confirm delete
async function confirmDelete() {
  const listingId = document.getElementById('deleteListingId').value;
  const deleteBtn = document.querySelector('.btn-confirm-delete');

  console.log(listingId); //this is empty from the onset and never passes anything to the server
    
  deleteBtn.disabled = true;
  deleteBtn.textContent = 'Deleting...';

  try {
    const response = await fetch(`/api/my-listings/${listingId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete listing');
    }

    showNotification('Listing deleted successfully!', 'success');
    closeDeleteModal();
    
    // Reload listings and stats
    await loadListings();
    await loadStats();

  } catch (err) {
    console.error('Error deleting listing:', err);
    showNotification(err.message || 'Failed to delete listing', 'error');
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Yes, Delete';
  }
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'editModal') {
    closeEditModal();
  }
  if (e.target.id === 'deleteModal') {
    closeDeleteModal();
  }
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditModal();
    closeDeleteModal();
  }
});

// Helper functions
function formatCurrency(amount) {
  return '$' + (parseFloat(amount) || 0).toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function sanitizeImageUrl(url) {
  if (!url) return '../images/default-placeholder.png';
  if (url.startsWith('http')) return url;
  return `https://bfpaawywaljnfudynnke.supabase.co/storage/v1/object/public/${url}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function showNotification(message, type = 'success') {
  // Remove existing notifications
  const existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'notification-toast';
  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 16px 24px;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    background: ${type === 'success' 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  `;
  notification.textContent = message;

  // Add animation styles if not present
  if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
