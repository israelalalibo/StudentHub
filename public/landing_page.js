

// Sample data
const products = [
    { id: 1, title: "Biology Textbook", price: 35, category: "textbooks", condition: "Good" },
    { id: 2, title: "iPad Pro", price: 450, category: "electronics", condition: "Excellent" },
    { id: 3, title: "Desk Lamp", price: 15, category: "supplies", condition: "Like New" }
];

let cart = [];
let cartCount = 3;

// Navigation functions
function showProfile() {
    //alert('Profile menu would open here. In a real app, this would show:\n- Account settings\n- My listings\n- Purchase history\n- Messages\n- Logout');
    const dropdown = document.getElementById("profileDropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function showSellItemOptions() {
    const sellOptionDropdown = document.getElementById("sellOptionDropdown");
    sellOptionDropdown.style.display = sellOptionDropdown.style.display === "block" ? "none" : "block";
}

// Toggle dropdown when icon is clicked
//document.getElementById("profileIcon").addEventListener("click", showProfile);

// Close dropdown when clicking outside
window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("profileDropdown");
  const icon = document.getElementById("profileIcon");

  if (!dropdown.contains(e.target) && !icon.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

//logout button logic
//document.getElementById("logoutBtn").addEventListener("click", logout);

async function logout() {
    try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Log Out failed');
            }

            console.log('✅ User Logged Out:', result);
            window.location.href = result.redirect;


        } catch (err) {
            //TODO: add this to HTML form if triggered
            console.error('❌ Logout error:', err.message);
            alert('Error: ' + err.message);
        }
};



function toggleCart() {
    const dropdown = document.getElementById('cartDropdown');
    dropdown.classList.toggle('show');
}


// Product functions
function addToCart(productId) {
    cart.push(productId);
    cartCount++;
    document.getElementById('cartBadge').textContent = cartCount;
    
    // Show success message
    showNotification('Item added to cart!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add to cart functionality to product cards
document.addEventListener('DOMContentLoaded', function() {
    const addToCartBtns = document.querySelectorAll('.btn-primary.btn-sm');
    addToCartBtns.forEach((btn, index) => {
        if (btn.textContent === 'Add to Cart') {
            btn.addEventListener('click', () => {
                addToCart(index + 1);
            });
        }
    });

    // Contact seller buttons
    const contactBtns = document.querySelectorAll('.btn-outline.btn-sm');
    contactBtns.forEach(btn => {
        if (btn.textContent === 'Contact') {
            btn.addEventListener('click', () => {
                alert('Opening message interface with seller. In a real app, this would open a chat or messaging system.');
            });
        }
    });
});

// Search functionality
// document.querySelector('.search-input').addEventListener('keypress', function(e) {
//     if (e.key === 'Enter') {
//         const query = this.value;
//         console.log(`Searching for: ${query}`);
//         alert(`Searching for "${query}". In a real app, this would filter and display matching products.`);
//     }
// });

// Close cart dropdown when clicking outside


// Animations
// gsap.registerPlugin();

// // Animate hero section
// gsap.from('.hero h1', {
//     duration: 1,
//     y: 50,
//     opacity: 0,
//     ease: 'power3.out'
// });

// gsap.from('.hero p', {
//     duration: 1,
//     y: 30,
//     opacity: 0,
//     delay: 0.2,
//     ease: 'power3.out'
// });

// gsap.from('.hero-actions', {
//     duration: 1,
//     y: 30,
//     opacity: 0,
//     delay: 0.4,
//     ease: 'power3.out'
// });

// // Animate category cards
// gsap.from('.category-card', {
//     duration: 0.8,
//     y: 30,
//     opacity: 0,
//     stagger: 0.1,
//     delay: 0.6,
//     ease: 'power2.out'
// });

// // Animate product cards
// gsap.from('.product-card', {
//     duration: 0.8,
//     y: 30,
//     opacity: 0,
//     stagger: 0.1,
//     delay: 0.8,
//     ease: 'power2.out'
// });

// Header scroll effect
// let lastScroll = 0;
// window.addEventListener('scroll', () => {
//     const header = document.querySelector('.header');
//     const currentScroll = window.pageYOffset;
    
//     if (currentScroll > lastScroll && currentScroll > 100) {
//         header.style.transform = 'translateY(-100%)';
//     } else {
//         header.style.transform = 'translateY(0)';
//     }
    
//     lastScroll = currentScroll;
// });

// Add CSS for slide in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

//To load when the user clicks the search dropdown



