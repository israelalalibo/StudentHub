/**
 * Cart Management Utility
 * Handles all cart operations with Supabase persistence (user-specific)
 */

const Cart = {
  // Cache for cart items (reduces API calls)
  _cache: null,
  _cacheTime: null,
  _cacheDuration: 5000, // 5 seconds cache

  // Get all cart items from server
  async getItems() {
    try {
      // Return cached items if still valid
      if (this._cache && this._cacheTime && (Date.now() - this._cacheTime < this._cacheDuration)) {
        return this._cache;
      }

      const response = await fetch('/api/cart');
      const data = await response.json();
      
      if (!response.ok) {
        console.warn('Cart fetch warning:', data.error);
        return [];
      }

      // Update cache
      this._cache = data.items || [];
      this._cacheTime = Date.now();
      
      return this._cache;
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  },

  // Invalidate cache (call after modifications)
  _invalidateCache() {
    this._cache = null;
    this._cacheTime = null;
  },

  // Add item to cart
  async addItem(product) {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.seller_id ? `${product.seller_id}_${product.title}` : product.title,
          title: product.title || product.name,
          price: product.price,
          image_url: product.image_url,
          category: product.category,
          condition: product.condition,
          seller_id: product.seller_id,
          seller_name: product.seller || product.first_name || 'Student'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.showNotification('Please log in to add items to cart', 'info');
          return false;
        }
        throw new Error(data.error);
      }

      this._invalidateCache();
      await this.updateBadge();
      this.showNotification(`${product.title || product.name} added to cart!`);
      return true;
    } catch (e) {
      console.error('Error adding to cart:', e);
      this.showNotification('Failed to add item to cart', 'error');
      return false;
    }
  },

  // Remove item from cart by ID
  async removeItem(itemId) {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      this._invalidateCache();
      await this.updateBadge();
      this.showNotification('Item removed from cart', 'remove');
      return true;
    } catch (e) {
      console.error('Error removing from cart:', e);
      return false;
    }
  },

  // Update item quantity
  async updateQuantity(itemId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeItem(itemId);
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      this._invalidateCache();
      await this.updateBadge();
      return true;
    } catch (e) {
      console.error('Error updating cart:', e);
      return false;
    }
  },

  // Clear entire cart
  async clear() {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      this._invalidateCache();
      await this.updateBadge();
      this.showNotification('Cart cleared');
      return true;
    } catch (e) {
      console.error('Error clearing cart:', e);
      return false;
    }
  },

  // Get total item count
  async getCount() {
    try {
      const response = await fetch('/api/cart/count');
      const data = await response.json();
      return data.count || 0;
    } catch (e) {
      console.error('Error getting cart count:', e);
      return 0;
    }
  },

  // Get subtotal (calculated from cached/fetched items)
  async getSubtotal() {
    const items = await this.getItems();
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = item.quantity || 1;
      return sum + (price * qty);
    }, 0);
  },

  // Calculate tax (8%)
  getTax(subtotal) {
    return subtotal * 0.08;
  },

  // Get total with tax
  async getTotal() {
    const subtotal = await this.getSubtotal();
    return subtotal + this.getTax(subtotal);
  },

  // Update cart badge in header (both desktop and mobile)
  async updateBadge() {
    const badge = document.getElementById('cartBadge');
    const mobileBadge = document.getElementById('cartBadgeMobile');
    const count = await this.getCount();
    
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (mobileBadge) {
      mobileBadge.textContent = count;
      mobileBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  // Show notification toast
  showNotification(message, type = 'success') {
    // Remove any existing notification
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    const colors = {
      success: '#10b981',
      remove: '#ef4444',
      info: '#3b82f6',
      error: '#ef4444'
    };

    const icons = {
      success: '✓',
      remove: '🗑',
      info: 'ℹ',
      error: '✕'
    };

    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${colors[type] || colors.success};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
      animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
    `;
    
    notification.innerHTML = `<span style="font-size: 18px;">${icons[type] || icons.success}</span> ${message}`;
    document.body.appendChild(notification);

    // Add animation keyframes if not already present
    if (!document.getElementById('cart-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'cart-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => notification.remove(), 3000);
  },

  // Initialize cart (call on page load)
  async init() {
    await this.updateBadge();
  }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Cart.init());
} else {
  Cart.init();
}

// Export for use in other scripts
window.Cart = Cart;
