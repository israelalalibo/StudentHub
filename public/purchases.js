// Example purchase data
const purchases = [
  { title: "Bluetooth Speaker", price: "£39.99", condition: "New", seller: "SoundTech", image: "🔊" },
  { title: "Gaming Mouse", price: "£49.99", condition: "New", seller: "TechZone", image: "🖱️" },
];

const purchaseGrid = document.getElementById("purchaseGrid");

purchases.forEach(p => {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <div class="product-image">${p.image}</div>
    <div class="product-info">
      <div class="product-condition">${p.condition}</div>
      <h3 class="product-title">${p.title}</h3>
      <p class="product-price">${p.price}</p>
      <p class="product-seller">Sold by: ${p.seller}</p>
      <button class="btn btn-outline btn-sm">View Details</button>
    </div>`;
  purchaseGrid.appendChild(card);
});
