// loadHeader.js
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeader();
});

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

function initHeaderFeatures() {
  // Query elements that must exist in the injected header
  const searchInput = document.getElementById("liveSearchInput");
  const resultDropdown = document.getElementById("searchResultsDropdown");
  const categoriesBtn = document.querySelector(".categories-btn");
  const categoriesMenu = document.querySelector(".categories-menu");
  const profileIcon = document.getElementById("profileIcon");

  // Attach category toggle if present
  if (categoriesBtn && categoriesMenu) {
    categoriesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      categoriesMenu.classList.toggle("show");
    });
  }

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
  searchInput.addEventListener("input", debounce(async (e) => {
    const q = e.target.value.trim();
    await fetchSearchResults(q, resultDropdown);
  }, 300));

  //When pressing Enter (keep query term)
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      localStorage.setItem("searchQuery", query);
      //localStorage.setItem("lastSearchTerm", query); //persist visible text
      window.location.href = "landingpage.html";
    }
});

  // Optional: show dropdown on focus if input has text
  searchInput.addEventListener("focus", (e) => {
    if (e.target.value.trim()) resultDropdown.style.display = "block";
  });

  // Restore last search term if available
  const previousQuery = localStorage.getItem("searchQuery");
  if (previousQuery) {
    searchInput.value = previousQuery;
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
    const res = await fetch(`/search?query=${encodeURIComponent(query)}`);
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

    // Store the *entire list* so landing page can display them
    localStorage.setItem("searchResults", JSON.stringify(allResults));

    window.location.href = "landingpage.html";
  } catch (err) {
    console.error("Error selecting search result:", err);
  }
}

/* ---------- Helpers ---------- */
function debounce(fn, delay) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

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
