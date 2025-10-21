// Simulate fetching user’s listings
const listings = [
  { title: "Wireless Headphones", price: "£59.99", condition: "New", seller: "You", image: "🎧" },
  { title: "Used MacBook Pro", price: "£750.00", condition: "Used", seller: "You", image: "💻" },
];

const grid = document.getElementById("myListingsGrid");

listings.forEach(p => {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <div class="product-image">${p.image}</div>
    <div class="product-info">
      <div class="product-condition">${p.condition}</div>
      <h3 class="product-title">${p.title}</h3>
      <p class="product-price">${p.price}</p>
      <p class="product-seller">Listed by: ${p.seller}</p>
      <div class="product-actions">
        <button class="btn btn-outline btn-sm">Edit</button>
        <button class="btn btn-primary btn-sm">Remove</button>
      </div>
    </div>`;
  grid.appendChild(card);
});
