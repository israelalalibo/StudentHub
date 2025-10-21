const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatMessage');
const sendBtn = document.getElementById('sendBtn');

// Sample chat messages
const messages = [
  { sender: "buyer", text: "Hi, is the MacBook still available?" },
  { sender: "seller", text: "Yes, it’s available. Would you like to see more pictures?" },
];

function renderChat() {
  chatBox.innerHTML = '';
  messages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${msg.sender === "buyer" ? "sent" : "received"}`;
    msgDiv.innerHTML = `<div class="bubble">${msg.text}</div>`;
    chatBox.appendChild(msgDiv);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  messages.push({ sender: "buyer", text });
  chatInput.value = '';
  renderChat();
});

renderChat();
