// loadHeader.js

// ============================================
// SESSION TIMEOUT CONFIGURATION
// ============================================
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
let sessionCheckInterval = null;
let lastActivityTime = Date.now();

// ============================================
// DEFINE ALL FUNCTIONS FIRST (before DOMContentLoaded)
// so onclick handlers in header.html can use them
// ============================================

// Mobile Menu Functions (must be defined early for onclick handlers)
function toggleMobileMenu(e) {
  if (e) e.stopPropagation();
  
  const hamburger = document.getElementById('hamburgerBtn');
  const navContent = document.getElementById('navContent');
  const overlay = document.getElementById('mobileMenuOverlay');
  
  if (hamburger && navContent && overlay) {
    const isOpen = navContent.classList.contains('active');
    
    if (isOpen) {
      closeMobileMenu();
    } else {
      hamburger.classList.add('active');
      navContent.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
}

function closeMobileMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const navContent = document.getElementById('navContent');
  const overlay = document.getElementById('mobileMenuOverlay');
  
  if (hamburger) hamburger.classList.remove('active');
  if (navContent) navContent.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function performMobileSearch() {
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const mobilePriceFilter = document.getElementById('mobilePriceFilter');
  const mobileCategoryFilter = document.getElementById('mobileCategoryFilter');
  
  const query = mobileSearchInput ? mobileSearchInput.value.trim() : '';
  const category = mobileCategoryFilter ? mobileCategoryFilter.value : '';
  const priceRange = mobilePriceFilter ? mobilePriceFilter.value : '';
  
  closeMobileMenu();
  
  // Build search URL with parameters
  let searchUrl = 'landingpage.html?';
  const params = [];
  
  if (category) {
    params.push(`category=${encodeURIComponent(category)}`);
  }
  if (query) {
    params.push(`search=${encodeURIComponent(query)}`);
  }
  if (priceRange) {
    params.push(`price=${encodeURIComponent(priceRange)}`);
    localStorage.setItem('priceFilter', priceRange);
  }
  
  // If we have any search parameters, navigate
  if (params.length > 0) {
    window.location.href = searchUrl + params.join('&');
  } else if (category) {
    // Category-only search
    viewCategory(category, null);
  }
}

// Visible mobile search bar function
function performVisibleMobileSearch() {
  const searchInput = document.getElementById('mobileSearchInputVisible');
  const query = searchInput ? searchInput.value.trim() : '';
  const category = currentCategoryFilter;
  const price = currentPriceFilter;

  const dropdown = document.getElementById('mobileSearchResultsDropdown');
  if (dropdown) dropdown.classList.remove('active');

  if (price) {
    localStorage.setItem('priceFilter', price);
  }

  const params = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (query) params.push(`search=${encodeURIComponent(query)}`);
  if (price) params.push(`price=${encodeURIComponent(price)}`);

  if (params.length > 0) {
    window.location.href = `landingpage.html?${params.join('&')}`;
  } else if (category) {
    window.location.href = `landingpage.html?category=${encodeURIComponent(category)}`;
  }
}

// Mobile price filter auto-apply (backwards compatibility, called from hidden select)
function applyMobilePriceFilter() {
  const priceSelect = document.getElementById('mobilePriceFilter');
  if (priceSelect) {
    currentPriceFilter = priceSelect.value;
    updateMobileChips();
    applyCurrentFilters();
  }
}
// Handle mobile category dropdown change (backwards compatibility)
function handleMobileCategoryChange() {
  const categorySelect = document.getElementById('mobileCategorySelect');
  const searchInput = document.getElementById('mobileSearchInputVisible');
  const category = categorySelect ? categorySelect.value : '';
  const query = searchInput ? searchInput.value.trim() : '';
  
  if (category && !query) {
    window.location.href = `landingpage.html?category=${encodeURIComponent(category)}`;
  }
}

window.handleMobileCategoryChange = handleMobileCategoryChange;

// Mobile live search functionality
let mobileSearchTimeout = null;
let _mobileSearchProducts = [];

function selectMobileSearchResult(index) {
  const product = _mobileSearchProducts[index];
  if (product) {
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    window.location.href = 'landingpage.html';
  }
}
window.selectMobileSearchResult = selectMobileSearchResult;

async function handleMobileLiveSearch(query) {
  const dropdown = document.getElementById('mobileSearchResultsDropdown');
  const categorySelect = document.getElementById('mobileCategorySelect');
  const mobilePriceSelect = document.getElementById('mobilePriceFilter');
  const category = categorySelect ? categorySelect.value : '';
  const price = mobilePriceSelect ? mobilePriceSelect.value : '';

  if (!dropdown) return;

  if (!query || query.length < 2) {
    dropdown.classList.remove('active');
    return;
  }

  try {
    let url = `/api/products/search?q=${encodeURIComponent(query)}&limit=5`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (price) url += `&price=${encodeURIComponent(price)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Search failed');

    const products = await response.json();
    _mobileSearchProducts = products;

    if (products.length === 0) {
      dropdown.innerHTML = '<div class="no-results">No products found</div>';
    } else {
      dropdown.innerHTML = products.map((product, index) => `
        <div class="search-result-item" onclick="selectMobileSearchResult(${index})">
          <img src="${product.image_url || '../images/default-placeholder.png'}" alt="${escapeHtml(product.title || '')}" onerror="this.src='../images/default-placeholder.png'">
          <div class="search-result-info">
            <div class="search-result-title">${escapeHtml(product.title || 'Untitled')}</div>
            <div class="search-result-price">£${parseFloat(product.price || 0).toFixed(2)}</div>
          </div>
        </div>
      `).join('');
    }

    dropdown.classList.add('active');
  } catch (error) {
    console.error('Mobile search error:', error);
    dropdown.classList.remove('active');
  }
}

// Update mobile user greeting with actual user name
async function updateMobileGreeting() {
  const greetingText = document.querySelector('.greeting-text');
  if (!greetingText) return;
  
  try {
    const session = localStorage.getItem('supabase_session');
    if (session) {
      const sessionData = JSON.parse(session);
      const userId = sessionData.user?.id;
      
      if (userId) {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (response.ok) {
          const profile = await response.json();
          const name = profile.full_name || profile.username || sessionData.user?.email?.split('@')[0] || 'Student';
          greetingText.textContent = `Hello, ${name}!`;
        }
      }
    }
  } catch (error) {
    console.error('Error updating greeting:', error);
  }
}

// Load profile picture for mobile header
async function loadMobileProfilePicture() {
  const mobileProfileImg = document.getElementById('mobileProfilePicture');
  if (!mobileProfileImg) return;
  
  try {
    const session = localStorage.getItem('supabase_session');
    if (session) {
      const sessionData = JSON.parse(session);
      const userId = sessionData.user?.id;
      
      if (userId) {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (response.ok) {
          const profile = await response.json();
          if (profile.profile_picture_url) {
            mobileProfileImg.src = profile.profile_picture_url;
            // Also update desktop profile icon if it exists
            const desktopProfileImg = document.getElementById('profileIcon');
            if (desktopProfileImg) {
              desktopProfileImg.src = profile.profile_picture_url;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading mobile profile picture:', error);
  }
}

// Make it globally accessible
window.performVisibleMobileSearch = performVisibleMobileSearch;

// Mobile search initialization is now handled inside initHeaderFeatures()
// which runs after the header HTML is injected into the DOM.

// Sync cart badge between mobile and desktop
function syncCartBadges() {
  const desktopBadge = document.getElementById('cartBadge');
  const mobileBadge = document.getElementById('cartBadgeMobile');
  
  if (desktopBadge && mobileBadge) {
    const observer = new MutationObserver(function() {
      mobileBadge.textContent = desktopBadge.textContent;
      mobileBadge.style.display = desktopBadge.style.display;
    });
    
    observer.observe(desktopBadge, { 
      attributes: true, 
      childList: true, 
      characterData: true,
      attributeFilter: ['style']
    });
  }
}

window.syncCartBadges = syncCartBadges;

// Export mobile functions immediately so onclick handlers work
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.performMobileSearch = performMobileSearch;

// ============================================
// SESSION TIMEOUT FUNCTIONS
// ============================================

// Update last activity time (called on user interactions)
function updateLastActivity() {
  lastActivityTime = Date.now();
  localStorage.setItem('lastActivityTime', lastActivityTime.toString());
}

// Check if session has timed out due to inactivity
function checkSessionTimeout() {
  const storedSession = localStorage.getItem('supabase_session');
  if (!storedSession) {
    // No session - stop checking
    stopSessionMonitoring();
    return;
  }

  const storedLastActivity = localStorage.getItem('lastActivityTime');
  const lastActivity = storedLastActivity ? parseInt(storedLastActivity) : lastActivityTime;
  const timeSinceLastActivity = Date.now() - lastActivity;

  if (timeSinceLastActivity >= SESSION_TIMEOUT_MS) {
    console.log('Session timed out due to inactivity');
    handleSessionTimeout();
  }
}

// Handle session timeout - logout and redirect
async function handleSessionTimeout() {
  stopSessionMonitoring();
  
  // Clear all session data
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('user_id');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('lastActivityTime');
  localStorage.removeItem('searchResults');
  localStorage.removeItem('categoryResults');
  localStorage.removeItem('selectedCategory');
  localStorage.removeItem('priceFilter');
  localStorage.removeItem('persistedSearchQuery');
  localStorage.removeItem('persistedCategory');
  localStorage.removeItem('persistedPriceFilter');
  localStorage.removeItem('categoryPriceFilter');

  // Try to logout from server (don't wait for response)
  try {
    fetch('/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    // Ignore errors
  }

  // Show session expired message and redirect
  showSessionExpiredModal();
}

// Start monitoring session timeout
function startSessionMonitoring() {
  // Only monitor if user is logged in
  const storedSession = localStorage.getItem('supabase_session');
  if (!storedSession) return;

  // Initialize last activity
  updateLastActivity();

  // Set up activity listeners
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  activityEvents.forEach(event => {
    document.addEventListener(event, updateLastActivity, { passive: true });
  });

  // Start periodic session checks
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
  sessionCheckInterval = setInterval(checkSessionTimeout, SESSION_CHECK_INTERVAL_MS);
  
  console.log('Session monitoring started');
}

// Stop monitoring session timeout
function stopSessionMonitoring() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
}

// Show session expired modal
function showSessionExpiredModal() {
  // Remove any existing modal
  const existing = document.getElementById('sessionExpiredModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'sessionExpiredModal';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 3rem; margin-bottom: 16px;">⏰</div>
        <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 1.5rem;">Session Expired</h2>
        <p style="color: #6b7280; margin: 0 0 24px 0;">
          Your session has expired due to inactivity. Please log in again to continue.
        </p>
        <button onclick="window.location.href='../index'" style="
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
        ">
          Log In Again
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// DOM CONTENT LOADED - Initialize after page loads
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Restore session first, then load header
  const sessionRestored = await restoreSession();
  await loadHeader();
  loadFooter();

  // Start session monitoring if logged in
  if (sessionRestored) {
    startSessionMonitoring();
  }
});

// Restore session from localStorage to server
async function restoreSession() {
  try {
    const storedSession = localStorage.getItem('supabase_session');
    if (!storedSession) {
      console.log('No stored session found');
      return false;
    }

    const session = JSON.parse(storedSession);
    if (!session.access_token || !session.refresh_token) {
      console.log('Invalid stored session format');
      clearSessionData();
      return false;
    }

    // Check if session might be expired based on stored expiry
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      if (expiresAt < new Date()) {
        console.log('Session token expired');
        clearSessionData();
        return false;
      }
    }

    // Always try to restore the session to the server
    // This ensures the server has the latest valid session
    console.log('Restoring session to server...');
    
    const restoreResponse = await fetch('/api/restore-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
    });

    if (!restoreResponse.ok) {
      const errorData = await restoreResponse.json().catch(() => ({}));
      console.warn('Session restoration failed:', errorData.error || 'Unknown error');
      
      // Session restoration failed, clear local storage
      clearSessionData();
      return false;
    }
    
    const result = await restoreResponse.json();
    console.log('Session restored successfully for user:', result.userId);
    
    // Update last activity time on successful restore
    updateLastActivity();
    
    return true;
    
  } catch (err) {
    console.error('Error restoring session:', err);
    clearSessionData();
    return false;
  }
}

// Clear all session-related data from localStorage
function clearSessionData() {
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('user_id');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('lastActivityTime');
  stopSessionMonitoring();
}

// Export for use in other scripts if needed
window.restoreSession = restoreSession;

async function loadHeader() {
  try {
    // Fetch header HTML (path is relative to the page)
    const response = await fetch("./header.html");
    if (!response.ok) throw new Error("Failed to fetch header.html");
    const headerHTML = await response.text();

    const headerEl = document.getElementById("header");
    if (!headerEl) {
      console.warn("No #header container found on this page.");
      return;
    }

    // Insert header markup
    headerEl.innerHTML = headerHTML;

    // Initialize features AFTER header is in DOM
    initHeaderFeatures();
  } catch (err) {
    console.error("Error loading header:", err);
  }
}

async function loadFooter() {
  try {
    const response = await fetch("./footer.html");
    if (!response.ok) throw new Error("Failed to fetch footer.html");
    const footerHTML = await response.text();

    const footerEl = document.getElementById("footer");
    if (!footerEl) return;

    footerEl.innerHTML = footerHTML;
  } catch (err) {
    console.error("Error loading footer:", err);
  }
}

// Load user's profile picture for the header icon
async function loadUserProfilePicture() {
  try {
    const response = await fetch('/api/profile');
    if (!response.ok) {
      // User not logged in or error - keep default icon
      return;
    }

    const profile = await response.json();
    const profileIcon = document.getElementById('profileIcon');
    const profileWrapper = document.getElementById('profileIconWrapper');

    // Update mobile greeting with actual user name
    const greetingText = document.querySelector('.greeting-text');
    if (greetingText) {
      const name = (profile.first_name && profile.last_name)
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || profile.last_name || profile.email?.split('@')[0] || 'Student';
      greetingText.textContent = `Hello, ${name}!`;
    }

    if (profileIcon && profile.profile_picture) {
      // Replace the default icon with user's profile picture
      profileIcon.src = profile.profile_picture;
      
      // Add class to wrapper for styling
      if (profileWrapper) {
        profileWrapper.classList.add('has-picture');
      }
      
      // Add error handler to fall back to default icon
      profileIcon.onerror = function() {
        this.src = '../images/profile-icon.png';
        if (profileWrapper) {
          profileWrapper.classList.remove('has-picture');
        }
      };
    }
  } catch (err) {
    console.error('Error loading profile picture:', err);
    // Keep default icon on error
  }
}

// ============================================
// UNIFIED FILTER SYSTEM
// ============================================

let currentPriceFilter = '';
let currentCategoryFilter = '';

const CATEGORY_LABELS = {
  textbooks: 'Textbooks',
  electronics: 'Electronics',
  supplies: 'Supplies',
  furniture: 'Furniture',
  clothing: 'Clothing',
  other: 'Other'
};

const PRICE_LABELS = {
  '0-25': 'Under £25',
  '25-50': '£25 – £50',
  '50-100': '£50 – £100',
  '100-200': '£100 – £200',
  '200+': '£200+'
};

// --- Desktop filter dropdown logic ---

function initDesktopFilters() {
  const categoryBtn = document.getElementById('categoryFilterBtn');
  const categoryDropdown = document.getElementById('categoryDropdown');
  const priceBtn = document.getElementById('priceFilterBtn');
  const priceDropdown = document.getElementById('priceDropdown');
  const clearAllBtn = document.getElementById('clearAllFiltersBtn');

  if (!categoryBtn || !priceBtn) return;

  categoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('category');
  });

  priceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('price');
  });

  if (categoryDropdown) {
    categoryDropdown.querySelectorAll('.filter-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.dataset.value;
        selectDesktopFilter('category', val === currentCategoryFilter ? '' : val);
      });
    });
  }

  if (priceDropdown) {
    priceDropdown.querySelectorAll('.filter-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.dataset.value;
        selectDesktopFilter('price', val === currentPriceFilter ? '' : val);
      });
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => clearAllFilters());
  }

  document.addEventListener('click', () => {
    closeAllDropdowns();
  });
}

function toggleDropdown(type) {
  const btn = document.getElementById(type === 'category' ? 'categoryFilterBtn' : 'priceFilterBtn');
  const dd = document.getElementById(type === 'category' ? 'categoryDropdown' : 'priceDropdown');
  const otherDd = document.getElementById(type === 'category' ? 'priceDropdown' : 'categoryDropdown');
  const otherBtn = document.getElementById(type === 'category' ? 'priceFilterBtn' : 'categoryFilterBtn');

  if (!btn || !dd) return;

  const isOpen = dd.classList.contains('open');
  if (otherDd) otherDd.classList.remove('open');
  if (otherBtn) otherBtn.classList.remove('open');
  dd.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
}

function closeAllDropdowns() {
  document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('open'));
}

function selectDesktopFilter(type, value) {
  closeAllDropdowns();

  if (type === 'category') {
    currentCategoryFilter = value;
    syncHiddenSelect('categoryFilter', value);
    updateDesktopBtnState('categoryFilterBtn', value, CATEGORY_LABELS);

    // Mark selected item
    const dd = document.getElementById('categoryDropdown');
    if (dd) dd.querySelectorAll('.filter-dropdown-item').forEach(i => {
      i.classList.toggle('selected', i.dataset.value === value);
    });

    if (value) {
      localStorage.removeItem('priceFilter');
      localStorage.removeItem('persistedPriceFilter');
      currentPriceFilter = '';
      syncHiddenSelect('priceFilter', '');
      updateDesktopBtnState('priceFilterBtn', '', PRICE_LABELS);
      const pd = document.getElementById('priceDropdown');
      if (pd) pd.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('selected'));
    }
  } else {
    currentPriceFilter = value;
    syncHiddenSelect('priceFilter', value);
    updateDesktopBtnState('priceFilterBtn', value, PRICE_LABELS);

    const dd = document.getElementById('priceDropdown');
    if (dd) dd.querySelectorAll('.filter-dropdown-item').forEach(i => {
      i.classList.toggle('selected', i.dataset.value === value);
    });
  }

  updateActiveChips();
  applyCurrentFilters();
}

function updateDesktopBtnState(btnId, value, labels) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const labelEl = btn.querySelector('.filter-btn-label');
  if (value && labels[value]) {
    btn.classList.add('active');
    if (labelEl) labelEl.textContent = labels[value].replace(/^[^\w]*/, '').trim();
  } else {
    btn.classList.remove('active');
    if (labelEl) labelEl.textContent = btnId.includes('category') ? 'Category' : 'Price';
  }
}

function syncHiddenSelect(selectId, value) {
  const sel = document.getElementById(selectId);
  if (sel) sel.value = value;
}

function updateActiveChips() {
  const bar = document.getElementById('activeFiltersBar');
  const container = document.getElementById('activeChips');
  if (!bar || !container) return;

  container.innerHTML = '';
  let count = 0;

  if (currentCategoryFilter) {
    count++;
    container.innerHTML += `<span class="filter-chip">${CATEGORY_LABELS[currentCategoryFilter] || currentCategoryFilter}<button class="filter-chip-remove" onclick="selectDesktopFilter('category','')">✕</button></span>`;
  }
  if (currentPriceFilter) {
    count++;
    container.innerHTML += `<span class="filter-chip">${PRICE_LABELS[currentPriceFilter] || currentPriceFilter}<button class="filter-chip-remove" onclick="selectDesktopFilter('price','')">✕</button></span>`;
  }

  bar.style.display = count > 0 ? 'block' : 'none';
}

function clearAllFilters() {
  currentCategoryFilter = '';
  currentPriceFilter = '';
  syncHiddenSelect('categoryFilter', '');
  syncHiddenSelect('priceFilter', '');
  updateDesktopBtnState('categoryFilterBtn', '', CATEGORY_LABELS);
  updateDesktopBtnState('priceFilterBtn', '', PRICE_LABELS);

  document.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('selected'));

  localStorage.removeItem('priceFilter');
  localStorage.removeItem('persistedPriceFilter');
  localStorage.removeItem('categoryResults');
  localStorage.removeItem('selectedCategory');
  localStorage.removeItem('categoryPriceFilter');

  updateActiveChips();
  updateMobileChips();

  // Reload to clear results
  if (window.location.pathname.endsWith('landingpage.html')) {
    window.location.href = 'landingpage.html';
  }
}

// --- Mobile filter panel logic ---

function initMobileFilters() {
  const toggle = document.getElementById('mobileFilterToggle');
  const panel = document.getElementById('mobileFilterPanel');
  const applyBtn = document.getElementById('mobileFilterApply');
  const clearBtn = document.getElementById('mobileFilterClear');

  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
  });

  // Category options
  const catOptions = document.getElementById('mobileCategoryOptions');
  if (catOptions) {
    catOptions.querySelectorAll('.mobile-filter-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const wasSelected = btn.classList.contains('selected');
        catOptions.querySelectorAll('.mobile-filter-option').forEach(b => b.classList.remove('selected'));
        if (!wasSelected) btn.classList.add('selected');
      });
    });
  }

  // Price options
  const priceOptions = document.getElementById('mobilePriceOptions');
  if (priceOptions) {
    priceOptions.querySelectorAll('.mobile-filter-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const wasSelected = btn.classList.contains('selected');
        priceOptions.querySelectorAll('.mobile-filter-option').forEach(b => b.classList.remove('selected'));
        if (!wasSelected) btn.classList.add('selected');
      });
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const selectedCat = catOptions?.querySelector('.mobile-filter-option.selected');
      const selectedPrice = priceOptions?.querySelector('.mobile-filter-option.selected');

      currentCategoryFilter = selectedCat ? selectedCat.dataset.value : '';
      currentPriceFilter = selectedPrice ? selectedPrice.dataset.value : '';

      syncHiddenSelect('mobileCategorySelect', currentCategoryFilter);
      syncHiddenSelect('mobilePriceFilter', currentPriceFilter);
      syncHiddenSelect('categoryFilter', currentCategoryFilter);
      syncHiddenSelect('priceFilter', currentPriceFilter);

      panel.classList.remove('open');
      updateMobileChips();
      applyCurrentFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      catOptions?.querySelectorAll('.mobile-filter-option').forEach(b => b.classList.remove('selected'));
      priceOptions?.querySelectorAll('.mobile-filter-option').forEach(b => b.classList.remove('selected'));
      currentCategoryFilter = '';
      currentPriceFilter = '';
      syncHiddenSelect('mobileCategorySelect', '');
      syncHiddenSelect('mobilePriceFilter', '');
      syncHiddenSelect('categoryFilter', '');
      syncHiddenSelect('priceFilter', '');
      panel.classList.remove('open');
      updateMobileChips();

      localStorage.removeItem('priceFilter');
      localStorage.removeItem('persistedPriceFilter');
      localStorage.removeItem('categoryResults');
      localStorage.removeItem('selectedCategory');
      localStorage.removeItem('categoryPriceFilter');

      if (window.location.pathname.endsWith('landingpage.html')) {
        window.location.href = 'landingpage.html';
      }
    });
  }
}

function updateMobileChips() {
  const container = document.getElementById('mobileActiveChips');
  const countEl = document.getElementById('mobileFilterCount');
  const toggleBtn = document.getElementById('mobileFilterToggle');
  if (!container) return;

  container.innerHTML = '';
  let count = 0;

  if (currentCategoryFilter) {
    count++;
    const chip = document.createElement('span');
    chip.className = 'mobile-chip';
    chip.innerHTML = `${CATEGORY_LABELS[currentCategoryFilter] || currentCategoryFilter}<span class="mobile-chip-x">✕</span>`;
    chip.addEventListener('click', () => removeMobileFilter('category'));
    container.appendChild(chip);
  }
  if (currentPriceFilter) {
    count++;
    const chip = document.createElement('span');
    chip.className = 'mobile-chip';
    chip.innerHTML = `${PRICE_LABELS[currentPriceFilter] || currentPriceFilter}<span class="mobile-chip-x">✕</span>`;
    chip.addEventListener('click', () => removeMobileFilter('price'));
    container.appendChild(chip);
  }

  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  if (toggleBtn) {
    toggleBtn.classList.toggle('has-filters', count > 0);
  }
}

function removeMobileFilter(type) {
  if (type === 'category') {
    currentCategoryFilter = '';
    syncHiddenSelect('mobileCategorySelect', '');
    syncHiddenSelect('categoryFilter', '');
    const opts = document.getElementById('mobileCategoryOptions');
    if (opts) opts.querySelectorAll('.mobile-filter-option').forEach(b => b.classList.remove('selected'));
  } else {
    currentPriceFilter = '';
    syncHiddenSelect('mobilePriceFilter', '');
    syncHiddenSelect('priceFilter', '');
    localStorage.removeItem('priceFilter');
    localStorage.removeItem('persistedPriceFilter');
    const opts = document.getElementById('mobilePriceOptions');
    if (opts) opts.querySelectorAll('.mobile-filter-option').forEach(b => b.classList.remove('selected'));
  }
  updateMobileChips();
  applyCurrentFilters();
}

// --- Unified filter application ---

function applyCurrentFilters() {
  const searchInput = document.getElementById('liveSearchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInputVisible');
  const query = (searchInput && searchInput.value.trim()) || (mobileSearchInput && mobileSearchInput.value.trim()) || '';

  if (currentPriceFilter) {
    localStorage.setItem('priceFilter', currentPriceFilter);
  } else {
    localStorage.removeItem('priceFilter');
  }

  if (currentCategoryFilter) {
    viewCategory(currentCategoryFilter, null);
    return;
  }

  if (query) {
    const resultDropdown = document.getElementById('searchResultsDropdown');
    fetchSearchResults(query, resultDropdown);
    return;
  }

  if (currentPriceFilter) {
    window.location.href = `landingpage.html?price=${encodeURIComponent(currentPriceFilter)}`;
  }
}

// Backwards-compatible wrappers
function applyPriceFilter() {
  const priceFilter = document.getElementById('priceFilter');
  if (priceFilter) {
    currentPriceFilter = priceFilter.value;
    updateDesktopBtnState('priceFilterBtn', currentPriceFilter, PRICE_LABELS);
    updateActiveChips();
    applyCurrentFilters();
  }
}

function applyCategoryFilter() {
  const categoryFilter = document.getElementById('categoryFilter');
  const mobileCategoryFilter = document.getElementById('mobileCategorySelect');
  const val = (categoryFilter && categoryFilter.value) || (mobileCategoryFilter && mobileCategoryFilter.value) || '';

  if (val) {
    currentCategoryFilter = val;
    currentPriceFilter = '';
    syncHiddenSelect('priceFilter', '');
    syncHiddenSelect('mobilePriceFilter', '');
    localStorage.removeItem('priceFilter');
    localStorage.removeItem('persistedPriceFilter');
    updateDesktopBtnState('categoryFilterBtn', currentCategoryFilter, CATEGORY_LABELS);
    updateDesktopBtnState('priceFilterBtn', '', PRICE_LABELS);
    updateActiveChips();
    viewCategory(val, null);
  }
}

// Restore filters from persisted state (called after header loads)
function restoreFilterState() {
  const persistedCategory = localStorage.getItem('persistedCategory') || localStorage.getItem('selectedCategory') || '';
  const persistedPrice = localStorage.getItem('persistedPriceFilter') || localStorage.getItem('priceFilter') || '';

  if (persistedCategory) {
    currentCategoryFilter = persistedCategory;
    syncHiddenSelect('categoryFilter', persistedCategory);
    updateDesktopBtnState('categoryFilterBtn', persistedCategory, CATEGORY_LABELS);

    // Mark desktop dropdown item
    const dd = document.getElementById('categoryDropdown');
    if (dd) dd.querySelectorAll('.filter-dropdown-item').forEach(i => {
      i.classList.toggle('selected', i.dataset.value === persistedCategory);
    });

    // Mark mobile option
    const mOpts = document.getElementById('mobileCategoryOptions');
    if (mOpts) mOpts.querySelectorAll('.mobile-filter-option').forEach(b => {
      b.classList.toggle('selected', b.dataset.value === persistedCategory);
    });
  }

  if (persistedPrice) {
    currentPriceFilter = persistedPrice;
    syncHiddenSelect('priceFilter', persistedPrice);
    updateDesktopBtnState('priceFilterBtn', persistedPrice, PRICE_LABELS);

    const dd = document.getElementById('priceDropdown');
    if (dd) dd.querySelectorAll('.filter-dropdown-item').forEach(i => {
      i.classList.toggle('selected', i.dataset.value === persistedPrice);
    });

    const mOpts = document.getElementById('mobilePriceOptions');
    if (mOpts) mOpts.querySelectorAll('.mobile-filter-option').forEach(b => {
      b.classList.toggle('selected', b.dataset.value === persistedPrice);
    });
  }

  updateActiveChips();
  updateMobileChips();
}

// Make functions globally accessible
window.applyPriceFilter = applyPriceFilter;
window.applyCategoryFilter = applyCategoryFilter;
window.applyMobilePriceFilter = applyMobilePriceFilter;
window.selectDesktopFilter = selectDesktopFilter;
window.clearAllFilters = clearAllFilters;

function initHeaderFeatures() {
  const searchInput = document.getElementById("liveSearchInput");
  const resultDropdown = document.getElementById("searchResultsDropdown");
  const categoriesBtn = document.querySelector(".categories-btn");
  const categoriesMenu = document.querySelector(".categories-menu");
  const profileIcon = document.getElementById("profileIcon");

  loadUserProfilePicture();

  // Close menus when clicking outside
  document.addEventListener("click", (e) => {
    if (categoriesMenu && !e.target.closest(".categories-dropdown")) {
      categoriesMenu.classList.remove("show");
    }
    if (resultDropdown && !e.target.closest(".search-bar")) {
      resultDropdown.style.display = "none";
    }
    if (profileIcon && !e.target.closest(".profile-container")) {
      const pd = document.getElementById("profileDropdown");
      if (pd) pd.style.display = "none";
    }
  });

  // Desktop search input
  if (searchInput && resultDropdown) {
    searchInput.addEventListener("input", async (e) => {
      const q = e.target.value.trim();
      await fetchSearchResults(q, resultDropdown);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = e.target.value.trim();
        localStorage.setItem("searchQuery", query);
        if (currentPriceFilter) {
          localStorage.setItem("priceFilter", currentPriceFilter);
        }
        window.location.href = "landingpage.html";
      }
    });

    searchInput.addEventListener("focus", (e) => {
      if (e.target.value.trim()) resultDropdown.style.display = "block";
    });

    // Restore last search term
    const previousQuery = localStorage.getItem("persistedSearchQuery");
    if (previousQuery) {
      searchInput.value = previousQuery;
    }
  }

  // Initialize new filter systems
  initDesktopFilters();
  initMobileFilters();
  restoreFilterState();

  // Mobile live search
  const visibleMobileSearch = document.getElementById('mobileSearchInputVisible');
  if (visibleMobileSearch) {
    visibleMobileSearch.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performVisibleMobileSearch();
      }
    });

    visibleMobileSearch.addEventListener('input', function(e) {
      const query = e.target.value.trim();
      if (mobileSearchTimeout) clearTimeout(mobileSearchTimeout);
      mobileSearchTimeout = setTimeout(() => {
        handleMobileLiveSearch(query);
      }, 300);
    });

    document.addEventListener('click', function(e) {
      const dropdown = document.getElementById('mobileSearchResultsDropdown');
      const searchBar = document.querySelector('.mobile-search-bar');
      if (dropdown && searchBar && !searchBar.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // Old mobile search in menu
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performMobileSearch();
      }
    });
  }

  syncCartBadges();
  updateMobileGreeting();
  loadMobileProfilePicture();
}

/* ---------- Core live-search logic ---------- */
async function fetchSearchResults(query, dropEl) {
  // dropEl = small compact dropdown under the header input
  if (!dropEl) return;

  if (!query) {
    dropEl.innerHTML = "";
    dropEl.style.display = "none";
    return;
  }

  //Save query to localStorage for persistence
  //localStorage.setItem("lastSearchTerm", query);

  try {
    // Build search URL with price filter
    let searchUrl = `/search?query=${encodeURIComponent(query)}`;
    
    // Add price filter if set
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter && priceFilter.value) {
      searchUrl += `&price=${encodeURIComponent(priceFilter.value)}`;
      localStorage.setItem('priceFilter', priceFilter.value);
    }
    
    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error("Search endpoint error");
    const results = await res.json();
    //console.log(results);

    if (!results || results.length === 0) {
      dropEl.innerHTML = `<div class="no-results">No results found</div>`;
      dropEl.style.display = "block";
      return;
    }

    //Store results temporarily so landing page can use them
    localStorage.setItem("searchResults", JSON.stringify(results));

    // Render a compact list (thumbnail, title, price) — better for dropdown
    dropEl.innerHTML = results
      .map((item, index) => {
        const safeImage = sanitizeImageUrl(item.image_url);
        return `
          <div class="search-result-row" onclick='handleSelectFromDropdown(${index})'>
            <img class="result-thumb" src="${safeImage}" alt="${escapeHtml(item.title || "")}" onerror="this.src='../images/default-placeholder.png'"/>
            <div class="result-meta">
              <div class="result-title">${escapeHtml(item.title || "Untitled")}</div>
<div class="result-price">£${item.price || "N/A"}</div>
            </div>
          </div>`;
      })
      .join("");

    dropEl.style.display = "block";

    // If GSAP is loaded on the page, animate small rows
    if (window.gsap) {
      // animate the rows inside the dropdown
      const rows = dropEl.querySelectorAll(".search-result-row");
      gsap.from(rows, { opacity: 0, y: 8, duration: 0.25, stagger: 0.03 });
    }

  } catch (error) {
    // Use the correct variable name and a safe fallback
    console.error("Error loading search results:", error);
    dropEl.innerHTML = `<div class="no-results">Error loading results</div>`;
    dropEl.style.display = "block";
  }
}

/* Called when user clicks a dropdown row.
   Stores item in localStorage and navigates to landing page.
*/
function handleSelectFromDropdown(index) {
  try {
    const allResults = JSON.parse(localStorage.getItem("searchResults"));
    const clickedItem = allResults[index];
    console.log(clickedItem);

    //Store ONLY the selected item
    localStorage.setItem("selectedProduct", JSON.stringify(clickedItem));

    // Navigate to landing page
    window.location.href = "landingpage.html";
  } catch (err) {
    console.error("Error selecting search result:", err);
  }
}

/* ---------- Helpers ---------- */
function sanitizeImageUrl(url) {
  if (!url) return "../images/default-placeholder.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // If your server returns relative path keys, prefix accordingly.
  // Replace below with your actual supabase public bucket URL if needed.
  return `https://bfpaawywaljnfudynnke.supabase.co/storage/v1/object/public/${url}`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Expose selection handler globally so inline onclick works (we use JSON-encoded item)
window.handleSelectFromDropdown = handleSelectFromDropdown;

/* ---------- Header action handlers (global) ---------- */

// Toggle profile dropdown
function showProfile() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  }
}

// Navigate to cart page
function goToCart() {
  window.location.href = 'cart.html';
}

// Show categories dropdown
function showCategories(e) {
  if (e) e.stopPropagation(); // Prevent document click from immediately closing it
  const categoriesMenu = document.querySelector(".categories-menu");
  if (categoriesMenu) {
    categoriesMenu.classList.toggle("show");
  }
}

// View category - fetch products by category and navigate to landing page
async function viewCategory(category, e) {
  if (e) {
    e.preventDefault(); // Prevent the href="#" from scrolling
    e.stopPropagation();
  }
  
  try {
    // Close the categories menu
    const categoriesMenu = document.querySelector(".categories-menu");
    if (categoriesMenu) {
      categoriesMenu.classList.remove("show");
    }

    // Get the current price filter value from UI dropdowns only (desktop + mobile)
    const priceFilter = document.getElementById('priceFilter');
    const mobilePriceFilter = document.getElementById('mobilePriceFilter');
    const finalPriceFilter = (priceFilter && priceFilter.value) || (mobilePriceFilter && mobilePriceFilter.value) || '';

    // Build the URL with price filter if set
    let fetchUrl = `/search/category?category=${encodeURIComponent(category)}`;
    if (finalPriceFilter) {
      fetchUrl += `&price=${encodeURIComponent(finalPriceFilter)}`;
    }

    // Fetch products from the category endpoint
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Failed to fetch category results");
    
    const results = await response.json();

    // Store category results and category name in localStorage
    localStorage.setItem("categoryResults", JSON.stringify(results));
    localStorage.setItem("selectedCategory", category);
    
    // Store the price filter used (for display purposes)
    if (finalPriceFilter) {
      localStorage.setItem("categoryPriceFilter", finalPriceFilter);
    } else {
      localStorage.removeItem("categoryPriceFilter");
    }
    
    // Clear any previous search data and stale price filter to avoid conflicts
    localStorage.removeItem("searchResults");
    localStorage.removeItem("searchQuery");
    localStorage.removeItem("selectedProduct");
    // Clear stale price so category results don't restore an old price to the dropdown
    if (!finalPriceFilter) {
      localStorage.removeItem("priceFilter");
      localStorage.removeItem("persistedPriceFilter");
    }

    // Navigate to landing page.
    // Use reload() when already on landing page so bfcache is bypassed and
    // DOMContentLoaded fires fresh to pick up the new localStorage data.
    if (window.location.pathname.endsWith('landingpage.html')) {
      window.location.reload();
    } else {
      window.location.href = 'landingpage.html';
    }

  } catch (err) {
    console.error("Error fetching category:", err);
    alert("Error loading category. Please try again.");
  }
}

// Expose viewCategory globally
window.viewCategory = viewCategory;

// Logout function
async function logout() {
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    const result = await response.json();

    // Clear ALL stored session data from localStorage regardless of response
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('user_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('searchResults');
    localStorage.removeItem('categoryResults');
    localStorage.removeItem('selectedCategory');
    localStorage.removeItem('priceFilter');
    localStorage.removeItem('persistedSearchQuery');
    localStorage.removeItem('persistedCategory');
    localStorage.removeItem('persistedPriceFilter');
    localStorage.removeItem('categoryPriceFilter');

    console.log('✅ User Logged Out:', result);
    window.location.href = result.redirect || '../index.html';

  } catch (err) {
    console.error('❌ Logout error:', err.message);
    // Still clear localStorage and redirect even on error
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('user_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('persistedSearchQuery');
    localStorage.removeItem('persistedCategory');
    localStorage.removeItem('persistedPriceFilter');
    window.location.href = '../index.html';
  }
}

// Handle window resize - close mobile menu on larger screens
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
  const navContent = document.getElementById('navContent');
  const hamburger = document.getElementById('hamburgerBtn');
  
  if (navContent && navContent.classList.contains('active')) {
    if (!navContent.contains(e.target) && !hamburger.contains(e.target)) {
      closeMobileMenu();
    }
  }
});

// Expose remaining header functions globally for onclick handlers
window.showProfile = showProfile;
window.goToCart = goToCart;
window.showCategories = showCategories;
window.logout = logout;

