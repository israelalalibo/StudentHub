// Purchase History functionality
let allPurchases = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadPurchases();
});

// Load purchase statistics
async function loadStats() {
  try {
    const response = await fetch('/api/purchases/stats/summary');
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in - show zeros
        document.getElementById('totalOrders').textContent = '0';
<<<<<<< HEAD
        document.getElementById('totalSpent').textContent = '£0.00';
=======
        document.getElementById('totalSpent').textContent = '$0.00';
>>>>>>> 0bea6f1c853238cd32a472e003ad74886c9866e0
        document.getElementById('totalItems').textContent = '0';
        return;
      }
      throw new Error('Failed to load stats');
    }

    const stats = await response.json();

    document.getElementById('totalOrders').textContent = stats.total_orders || 0;
    document.getElementById('totalSpent').textContent = formatCurrency(stats.total_spent || 0);
    document.getElementById('totalItems').textContent = stats.total_items || 0;

  } catch (err) {
    console.error('Error loading stats:', err);
    document.getElementById('totalOrders').textContent = '0';
    document.getElementById('totalSpent').textContent = '$0.00';
    document.getElementById('totalItems').textContent = '0';
  }
}

// Load all purchases
async function loadPurchases() {
  const ordersList = document.getElementById('ordersList');

  try {
    const response = await fetch('/api/purchases');
    
    if (!response.ok) {
      if (response.status === 401) {
        ordersList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔒</div>
            <h3>Please log in</h3>
            <p>You need to be logged in to view your purchase history</p>
            <a href="../index.html" class="btn-shop">Log In</a>
          </div>
        `;
        return;
      }
      throw new Error('Failed to load purchases');
    }

    const purchases = await response.json();
    allPurchases = purchases;

    if (purchases.length === 0) {
      ordersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No purchases yet</h3>
          <p>You haven't made any purchases. Start shopping to see your orders here!</p>
          <a href="landingpage.html" class="btn-shop">🛍️ Start Shopping</a>
        </div>
      `;
      return;
    }

    ordersList.innerHTML = purchases.map(purchase => renderOrderCard(purchase)).join('');

  } catch (err) {
    console.error('Error loading purchases:', err);
    ordersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error loading purchases</h3>
        <p>${err.message}</p>
        <button class="btn-shop" onclick="loadPurchases()">Try Again</button>
      </div>
    `;
  }
}

// Render an order card
function renderOrderCard(purchase) {
  const orderDate = formatDate(purchase.created_at);
  const orderId = purchase.id.substring(0, 8).toUpperCase();
  const items = purchase.items || [];

  return `
    <div class="order-card" data-order-id="${purchase.id}">
      <div class="order-header">
        <div class="order-info">
          <div class="order-id">Order #${orderId}</div>
          <div class="order-date">${orderDate}</div>
        </div>
        <span class="order-status ${purchase.status || 'completed'}">${capitalizeFirst(purchase.status || 'completed')}</span>
      </div>

      <div class="order-items">
        ${items.slice(0, 3).map(item => renderOrderItem(item)).join('')}
        ${items.length > 3 ? `
          <div style="text-align: center; color: #6b7280; font-size: 0.9rem; padding: 8px;">
            + ${items.length - 3} more item${items.length - 3 > 1 ? 's' : ''}
          </div>
        ` : ''}
      </div>

      <div class="order-footer">
        <div class="order-total">
          <span>Total:</span> <strong>${formatCurrency(purchase.total)}</strong>
        </div>
        <div class="order-actions">
          <button class="btn-view" onclick="viewOrderDetails('${purchase.id}')">View Details</button>
          <button class="btn-reorder" onclick="reorderItems('${purchase.id}')">Reorder</button>
        </div>
      </div>
    </div>
  `;
}

// Render an order item
function renderOrderItem(item) {
  const imageUrl = sanitizeImageUrl(item.image_url);
  
  return `
    <div class="order-item">
      <img src="${imageUrl}" alt="${escapeHtml(item.title)}" class="order-item-image" onerror="this.src='../images/default-placeholder.png'">
      <div class="order-item-info">
        <div class="order-item-title">${escapeHtml(item.title)}</div>
        <div class="order-item-details">Qty: ${item.quantity} • ${escapeHtml(item.condition || 'Good')}</div>
      </div>
      <div class="order-item-price">${formatCurrency(item.price * item.quantity)}</div>
    </div>
  `;
}

// View order details in modal
function viewOrderDetails(orderId) {
  const purchase = allPurchases.find(p => p.id === orderId);
  if (!purchase) return;

  const modal = document.getElementById('orderModal');
  const modalBody = document.getElementById('modalBody');

  const orderDate = formatDate(purchase.created_at);
  const orderIdShort = purchase.id.substring(0, 8).toUpperCase();
  const items = purchase.items || [];

  modalBody.innerHTML = `
    <div class="modal-section">
      <h3>Order Information</h3>
      <p><strong>Order ID:</strong> #${orderIdShort}</p>
      <p><strong>Date:</strong> ${orderDate}</p>
      <p><strong>Status:</strong> <span class="order-status ${purchase.status || 'completed'}" style="display: inline-block;">${capitalizeFirst(purchase.status || 'completed')}</span></p>
    </div>

    <div class="modal-section">
      <h3>Items (${items.length})</h3>
      <div class="order-items">
        ${items.map(item => renderOrderItem(item)).join('')}
      </div>
    </div>

    <div class="modal-section">
      <h3>Order Summary</h3>
      <div class="modal-total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(purchase.subtotal)}</span>
      </div>
      <div class="modal-total-row">
        <span>Tax (8%)</span>
        <span>${formatCurrency(purchase.tax)}</span>
      </div>
      <div class="modal-total-row grand-total">
        <span>Total</span>
        <span>${formatCurrency(purchase.total)}</span>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close order modal
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'orderModal') {
    closeOrderModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeOrderModal();
  }
});

// Reorder items - add to cart
async function reorderItems(orderId) {
  const purchase = allPurchases.find(p => p.id === orderId);
  if (!purchase || !purchase.items) return;

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    // Add each item to cart
    for (const item of purchase.items) {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.product_id,
          title: item.title,
          price: item.price,
          image_url: item.image_url,
          category: item.category,
          condition: item.condition,
          seller_id: item.seller_id,
          seller_name: item.seller_name
        })
      });
    }

    showNotification('Items added to cart!', 'success');
    
    // Update cart badge if function exists
    if (window.Cart && window.Cart.updateBadge) {
      window.Cart.updateBadge();
    }

  } catch (err) {
    console.error('Error reordering:', err);
    showNotification('Failed to add items to cart', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reorder';
  }
}

// Helper functions
function formatCurrency(amount) {
<<<<<<< HEAD
  return '£' + (parseFloat(amount) || 0).toFixed(2);
=======
  return '$' + (parseFloat(amount) || 0).toFixed(2);
>>>>>>> 0bea6f1c853238cd32a472e003ad74886c9866e0
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
