// loadHeader.js

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
  
  // If category is selected, do category search
  if (category) {
    localStorage.setItem('priceFilter', priceRange);
    viewCategory(category, null);
    return;
  }
  
  // Otherwise do text search
  if (query) {
    // Set price filter if selected
    if (priceRange) {
      localStorage.setItem('priceFilter', priceRange);
    }
    
    // Trigger search on landing page
    const searchInput = document.getElementById('liveSearchInput');
    const priceFilter = document.getElementById('priceFilter');
    
    if (searchInput) {
      searchInput.value = query;
      if (priceFilter && priceRange) {
        priceFilter.value = priceRange;
      }
      // Trigger input event to run search
      searchInput.dispatchEvent(new Event('input'));
    } else {
      // Navigate to landing page with search params
      window.location.href = `landingpage.html?search=${encodeURIComponent(query)}`;
    }
  }
}

// Export mobile functions immediately so onclick handlers work
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.performMobileSearch = performMobileSearch;

// ============================================
// DOM CONTENT LOADED - Initialize after page loads
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Restore session first, then load header
  await restoreSession();
  await loadHeader();
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
      return false;
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
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('user_id');
      return false;
    }
    
    const result = await restoreResponse.json();
    console.log('Session restored successfully for user:', result.userId);
    return true;
    
  } catch (err) {
    console.error('Error restoring session:', err);
    return false;
  }
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

// Current filter values
let currentPriceFilter = '';
let currentCategoryFilter = '';

// Apply price filter to search
function applyPriceFilter() {
  const priceFilter = document.getElementById('priceFilter');
  const searchInput = document.getElementById('liveSearchInput');
  const resultDropdown = document.getElementById('searchResultsDropdown');
  
  if (priceFilter) {
    currentPriceFilter = priceFilter.value;
    
    // If there's a search query, re-run the search with the filter
    if (searchInput && searchInput.value.trim()) {
      fetchSearchResults(searchInput.value.trim(), resultDropdown);
    }
    
    // Store filter for landing page
    localStorage.setItem('priceFilter', currentPriceFilter);
  }
}

// Apply category filter - navigates to category results
function applyCategoryFilter() {
  const categoryFilter = document.getElementById('categoryFilter');
  
  if (categoryFilter && categoryFilter.value) {
    const category = categoryFilter.value;
    
    // Use the existing viewCategory function
    viewCategory(category, null);
    
    // Reset the filter to default after selection
    setTimeout(() => {
      categoryFilter.value = '';
    }, 100);
  }
}

// Make them available globally
window.applyPriceFilter = applyPriceFilter;
window.applyCategoryFilter = applyCategoryFilter;

function initHeaderFeatures() {
  // Query elements that must exist in the injected header
  const searchInput = document.getElementById("liveSearchInput");
  const resultDropdown = document.getElementById("searchResultsDropdown");
  const categoriesBtn = document.querySelector(".categories-btn");
  const categoriesMenu = document.querySelector(".categories-menu");
  const profileIcon = document.getElementById("profileIcon");

  // Load user's profile picture for the header
  loadUserProfilePicture();

  // Category toggle is handled by onclick="showCategories(event)" in header.html
  // No duplicate listener needed here

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

  // Attach search if exists
  if (!searchInput || !resultDropdown) {
    console.warn("Live search elements not found in header.");
    return;
  }

  // Debounced input handler
  searchInput.addEventListener("input", async (e) => {
    const q = e.target.value.trim();
    await fetchSearchResults(q, resultDropdown);
  });

  //When pressing Enter (keep query term)
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      localStorage.setItem("searchQuery", query);
      
      // Also store the current price filter
      const priceFilter = document.getElementById('priceFilter');
      if (priceFilter && priceFilter.value) {
        localStorage.setItem("priceFilter", priceFilter.value);
      }
      
      window.location.href = "landingpage.html";
    }
  });

    async function clickSlectedProduct(productName){
      localStorage.setItem("selectedProduct", productName);
      console.log(productName);
      // const q = e.target.value.trim();
      // await fetchSearchResults(q, resultDropdown);
        //localStorage.setItem("lastSearchTerm", query); //persist visible text
        //window.location.href = "landingpage.html";
    }
    
    

  // Optional: show dropdown on focus if input has text
  searchInput.addEventListener("focus", (e) => {
    if (e.target.value.trim()) resultDropdown.style.display = "block";
  });

  // Restore last search term and filters if available
  const previousQuery = localStorage.getItem("persistedSearchQuery");
  const previousCategory = localStorage.getItem("persistedCategory");
  const previousPrice = localStorage.getItem("persistedPriceFilter");
  
  if (previousQuery) {
    searchInput.value = previousQuery;
  }
  
  const categoryFilter = document.getElementById('categoryFilter');
  const priceFilter = document.getElementById('priceFilter');
  
  if (categoryFilter && previousCategory) {
    categoryFilter.value = previousCategory;
  }
  
  if (priceFilter && previousPrice) {
    priceFilter.value = previousPrice;
  }
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
              <div class="result-price">$${item.price || "N/A"}</div>
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

    // Get the current price filter value
    const priceFilter = document.getElementById('priceFilter');
    const priceValue = priceFilter ? priceFilter.value : '';
    
    // Also check localStorage for price filter (in case coming from mobile)
    const storedPrice = localStorage.getItem('priceFilter') || '';
    const finalPriceFilter = priceValue || storedPrice;

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
    
    // Clear any previous search data to avoid conflicts
    localStorage.removeItem("searchResults");
    localStorage.removeItem("searchQuery");
    localStorage.removeItem("selectedProduct");

    // Navigate to landing page
    window.location.href = "landingpage.html";

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

