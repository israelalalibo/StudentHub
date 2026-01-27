// Messages functionality
let currentConversationId = null;
let currentUserId = null;
let messagePollingInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check for conversation ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversation');

  // Load conversations list
  await loadConversations();

  // If conversation ID provided, open it
  if (conversationId) {
    openConversation(conversationId);
  }
});

// Load all conversations for current user
async function loadConversations() {
  const conversationsList = document.getElementById('conversationsList');
  
  try {
    const response = await fetch('/api/conversations');
    
    if (!response.ok) {
      if (response.status === 401) {
        conversationsList.innerHTML = `
          <div class="no-conversations">
            <div class="no-conversations-icon">🔒</div>
            <p>Please <a href="../index.html">log in</a> to view your messages</p>
          </div>
        `;
        return;
      }
      throw new Error('Failed to load conversations');
    }

    const conversations = await response.json();

    if (conversations.length === 0) {
      conversationsList.innerHTML = `
        <div class="no-conversations">
          <div class="no-conversations-icon">📭</div>
          <p>No conversations yet</p>
          <p style="font-size: 0.85rem; margin-top: 8px;">Start a conversation by contacting a seller on a product page</p>
        </div>
      `;
      return;
    }

    conversationsList.innerHTML = conversations.map(conv => `
      <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}" 
           onclick="openConversation('${conv.id}')"
           data-conversation-id="${conv.id}"
           data-other-user-picture="${conv.other_user_picture || ''}"
           data-other-user-name="${escapeHtml(conv.other_user_name)}">
        ${conv.other_user_picture 
          ? `<img src="${conv.other_user_picture}" class="conversation-avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='<div class=\\'conversation-avatar\\'>${getInitials(conv.other_user_name)}</div>'">`
          : `<div class="conversation-avatar">${getInitials(conv.other_user_name)}</div>`
        }
        <div class="conversation-info">
          <div class="conversation-name">
            <span>${escapeHtml(conv.other_user_name)}</span>
            <span class="conversation-time">${formatRelativeTime(conv.last_message_time)}</span>
          </div>
          <div class="conversation-preview">
            ${conv.last_message_is_mine ? '<span style="color: #9ca3af;">You: </span>' : ''}
            ${conv.last_message ? escapeHtml(truncate(conv.last_message, 40)) : '<em>No messages yet</em>'}
            ${conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading conversations:', err);
    conversationsList.innerHTML = `
      <div class="no-conversations">
        <div class="no-conversations-icon">⚠️</div>
        <p>Error loading conversations</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">${err.message}</p>
      </div>
    `;
  }
}

// Open a conversation
async function openConversation(conversationId) {
  currentConversationId = conversationId;
  const chatArea = document.getElementById('chatArea');
  
  // Update active state in sidebar
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.toggle('active', item.dataset.conversationId === conversationId);
  });

  // Show loading state
  chatArea.innerHTML = `
    <div class="loading-spinner" style="flex: 1; display: flex; align-items: center; justify-content: center;">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const response = await fetch(`/api/messages/${conversationId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load messages');
    }

    const data = await response.json();
    currentUserId = data.current_user_id;

    // Render chat interface
    renderChatInterface(data);

    // Start polling for new messages
    startMessagePolling(conversationId);

    // Refresh conversations list to update unread counts
    loadConversations();

  } catch (err) {
    console.error('Error opening conversation:', err);
    chatArea.innerHTML = `
      <div class="no-chat-selected">
        <div class="no-chat-icon">⚠️</div>
        <h3>Error loading conversation</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

// Store current chat data for rendering
let currentChatData = null;

// Render the chat interface
function renderChatInterface(data) {
  const chatArea = document.getElementById('chatArea');
  currentChatData = data;
  const { messages, conversation, current_user_id, other_user_name, other_user_picture, current_user_picture } = data;

  // Determine other user's name
  const isCurrentUserBuyer = conversation.buyer_id === current_user_id;
  const displayName = other_user_name || (isCurrentUserBuyer ? 'Seller' : 'Buyer');
  const displayPicture = other_user_picture;

  // Store pictures for message rendering
  window.chatUserPictures = {
    currentUserPicture: current_user_picture,
    otherUserPicture: other_user_picture
  };

  chatArea.innerHTML = `
    <div class="chat-header">
      ${displayPicture 
        ? `<img src="${displayPicture}" class="chat-header-avatar" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='<div class=\\'chat-header-avatar\\'>${getInitials(displayName)}</div>'">`
        : `<div class="chat-header-avatar">${getInitials(displayName)}</div>`
      }
      <div class="chat-header-info">
        <h3>${escapeHtml(displayName)}</h3>
        <p>${isCurrentUserBuyer ? 'Seller' : 'Buyer'}</p>
      </div>
    </div>
    ${conversation.product_title ? `
      <div class="product-context">
        📦 <span>About: <strong>${escapeHtml(conversation.product_title)}</strong></span>
      </div>
    ` : ''}
    <div class="chat-messages" id="chatMessages">
      ${messages.length === 0 
        ? `<div style="text-align: center; color: #9ca3af; padding: 40px;">
             <p>No messages yet. Start the conversation!</p>
           </div>`
        : renderMessages(messages, current_user_id)
      }
    </div>
    <div class="chat-input-area">
      <input type="text" 
             class="chat-input" 
             id="messageInput" 
             placeholder="Type your message..."
             onkeypress="handleKeyPress(event)">
      <button class="send-btn" onclick="sendMessage()">
        Send ➤
      </button>
    </div>
  `;

  // Scroll to bottom
  scrollToBottom();

  // Focus input
  document.getElementById('messageInput').focus();
}

// Render messages with date separators
function renderMessages(messages, currentUserId) {
  let html = '';
  let lastDate = null;

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toDateString();
    
    // Add date separator if date changed
    if (msgDate !== lastDate) {
      html += `
        <div class="date-separator">
          <span>${formatDateSeparator(msg.created_at)}</span>
        </div>
      `;
      lastDate = msgDate;
    }

    const isSent = msg.sender_id === currentUserId;
    html += `
      <div class="message ${isSent ? 'sent' : 'received'}">
        <div class="message-bubble">${escapeHtml(msg.content)}</div>
        <div class="message-time">${formatMessageTime(msg.created_at)}</div>
      </div>
    `;
  });

  return html;
}

// Send a new message
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();

  if (!content || !currentConversationId) return;

  const sendBtn = document.querySelector('.send-btn');
  sendBtn.disabled = true;

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: currentConversationId,
        content: content
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const result = await response.json();

    // Clear input
    input.value = '';

    // Add message to chat
    const chatMessages = document.getElementById('chatMessages');
    const noMessagesDiv = chatMessages.querySelector('div[style*="text-align: center"]');
    if (noMessagesDiv) {
      noMessagesDiv.remove();
    }

    chatMessages.innerHTML += `
      <div class="message sent">
        <div class="message-bubble">${escapeHtml(result.message.content)}</div>
        <div class="message-time">Just now</div>
      </div>
    `;

    scrollToBottom();

    // Refresh conversations list
    loadConversations();

  } catch (err) {
    console.error('Error sending message:', err);
    alert('Failed to send message. Please try again.');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

// Handle Enter key press
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Poll for new messages
function startMessagePolling(conversationId) {
  // Clear any existing polling
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }

  // Poll every 3 seconds
  messagePollingInterval = setInterval(async () => {
    if (currentConversationId !== conversationId) {
      clearInterval(messagePollingInterval);
      return;
    }

    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check if we have new messages
        const chatMessages = document.getElementById('chatMessages');
        const currentMessageCount = chatMessages.querySelectorAll('.message').length;
        
        if (data.messages.length > currentMessageCount) {
          // Re-render messages
          chatMessages.innerHTML = data.messages.length === 0 
            ? `<div style="text-align: center; color: #9ca3af; padding: 40px;">
                 <p>No messages yet. Start the conversation!</p>
               </div>`
            : renderMessages(data.messages, data.current_user_id);
          
          scrollToBottom();
          loadConversations(); // Update unread counts
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 3000);
}

// Scroll chat to bottom
function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Helper functions
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateSeparator(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
});
