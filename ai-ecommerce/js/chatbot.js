/* =========================
   AI CHATBOT — Rule-based shopping assistant
========================= */

export function initChatbot() {
  /* Create chatbot DOM */
  if (document.getElementById('chatbotFab')) return;

  const fab = document.createElement('button');
  fab.className = 'chatbot-fab';
  fab.id = 'chatbotFab';
  fab.innerHTML = '🤖';
  fab.setAttribute('aria-label', 'Open AI Chat');
  document.body.appendChild(fab);

  const win = document.createElement('div');
  win.className = 'chatbot-window';
  win.id = 'chatbotWindow';
  win.innerHTML = `
    <div class="chat-header">
      <h4><span class="status-dot"></span> AiShopper Assistant</h4>
      <button class="chat-close" id="chatClose">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="quick-replies" id="quickReplies"></div>
    <div class="chat-input-area">
      <input type="text" class="chat-input" id="chatInput" placeholder="Ask me anything..." autocomplete="off">
      <button class="chat-send" id="chatSend">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  /* State */
  let isOpen = false;
  let hasGreeted = false;

  /* Toggle */
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    fab.innerHTML = isOpen ? '✕' : '🤖';
    if (isOpen && !hasGreeted) {
      hasGreeted = true;
      addBotMessage("👋 Hi! I'm your AiShopper assistant. How can I help you today?");
      showQuickReplies([
        'Show me deals',
        'Track my order',
        'Return policy',
        'Payment help',
        'Contact support'
      ]);
    }
    if (isOpen) document.getElementById('chatInput').focus();
  });

  document.getElementById('chatClose').addEventListener('click', () => {
    isOpen = false;
    win.classList.remove('open');
    fab.innerHTML = '🤖';
  });

  /* Send message */
  const sendMessage = () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    hideQuickReplies();

    /* Show typing */
    showTyping();

    setTimeout(() => {
      removeTyping();
      const response = getResponse(text);
      addBotMessage(response.text);
      if (response.quickReplies) {
        showQuickReplies(response.quickReplies);
      }
    }, 600 + Math.random() * 800);
  };

  document.getElementById('chatSend').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });

  /* Quick reply click */
  document.getElementById('quickReplies').addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-reply')) {
      document.getElementById('chatInput').value = e.target.textContent;
      sendMessage();
    }
  });
}

/* =========================
   MESSAGE HELPERS
========================= */
function addBotMessage(text) {
  const messages = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot';
  msg.innerHTML = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function addUserMessage(text) {
  const messages = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg user';
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.id = 'chatTyping';
  typing.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  document.getElementById('chatTyping')?.remove();
}

function showQuickReplies(replies) {
  const container = document.getElementById('quickReplies');
  container.innerHTML = replies.map(r => `<button class="quick-reply">${r}</button>`).join('');
}

function hideQuickReplies() {
  document.getElementById('quickReplies').innerHTML = '';
}

/* =========================
   RESPONSE ENGINE
========================= */
function getResponse(input) {
  const q = input.toLowerCase().trim();

  /* Greetings */
  if (/^(hi|hello|hey|hola|namaste|howdy)/i.test(q)) {
    return {
      text: "Hello! 😊 Welcome to AiShopper. I can help you with products, orders, returns, and more. What would you like to know?",
      quickReplies: ['Browse products', 'Track order', 'Return policy', 'Contact support']
    };
  }

  /* Product search */
  if (/show|find|search|looking for|recommend|suggest|best|top/i.test(q)) {
    const categories = {
      'laptop': 'laptops', 'phone': 'smartphones', 'mobile': 'smartphones',
      'watch': 'mens-watches', 'shirt': 'mens-shirts', 'shoe': 'mens-shoes',
      'bag': 'womens-bags', 'dress': 'womens-dresses', 'perfume': 'fragrances',
      'skincare': 'skincare', 'furniture': 'furniture', 'grocery': 'groceries'
    };

    let matchedCat = null;
    for (const [keyword, cat] of Object.entries(categories)) {
      if (q.includes(keyword)) { matchedCat = cat; break; }
    }

    if (matchedCat) {
      return {
        text: `Great choice! 🛍️ I found products in <strong>${matchedCat.replace(/-/g, ' ')}</strong>. <a href="index.html" style="color:var(--primary-light)">Browse now →</a><br><br>💡 Tip: Use the filter panel on the homepage to narrow down by price and sort by AI recommendations!`,
        quickReplies: ['Show deals', 'Price under ₹5000', 'Top rated']
      };
    }

    if (/deal|offer|discount|sale/i.test(q)) {
      return {
        text: "🔥 Here are some tips to find the best deals:<br>• Use coupon codes: <strong>WELCOME10</strong> for 10% off<br>• <strong>AI30</strong> for 30% off on orders above ₹2000<br>• <strong>FLAT500</strong> for ₹500 off on orders above ₹3000<br><br>Check out our <a href='index.html' style='color:var(--primary-light)'>products page</a> for current discounts!",
        quickReplies: ['How to use coupon', 'Browse products', 'Other help']
      };
    }

    return {
      text: "I'd love to help you find products! 🔍 You can:<br>• Use the <strong>search bar</strong> at the top<br>• Browse by <strong>category</strong> using filters<br>• Ask me for specific products like \"show me laptops\" or \"find watches\"",
      quickReplies: ['Show laptops', 'Show phones', 'Show watches', 'Show deals']
    };
  }

  /* Order tracking */
  if (/order|track|delivery|shipped|status|where.*my/i.test(q)) {
    return {
      text: "📦 To track your order:<br>1. Go to <a href='account.html#orders' style='color:var(--primary-light)'>My Orders</a><br>2. Find your order number<br>3. Check the current status<br><br>Orders typically take 3-7 business days for delivery. You'll receive SMS/email updates at each stage!",
      quickReplies: ['View my orders', 'Cancel order', 'Delivery time', 'Contact support']
    };
  }

  /* Cancel order */
  if (/cancel/i.test(q)) {
    return {
      text: "To cancel an order:<br>1. Go to <a href='account.html#orders' style='color:var(--primary-light)'>My Orders</a><br>2. Click \"Cancel\" on the order<br><br>⚠️ Orders can only be cancelled before they are shipped. Once shipped, you'll need to return the item instead.",
      quickReplies: ['Return policy', 'View orders', 'Other help']
    };
  }

  /* Returns */
  if (/return|exchange|refund|replace/i.test(q)) {
    return {
      text: "🔄 <strong>Return Policy:</strong><br>• 7-day easy returns on most products<br>• Items must be unused, in original packaging<br>• Electronics: 10-day replacement window<br>• Refunds processed in 5-7 business days<br><br>To initiate a return: <a href='account.html#orders' style='color:var(--primary-light)'>My Orders → Return/Exchange</a><br><br>For more details, visit our <a href='help.html#returns' style='color:var(--primary-light)'>Returns page</a>.",
      quickReplies: ['Refund status', 'Exchange for size', 'Contact support']
    };
  }

  /* Payment */
  if (/pay|payment|card|upi|cod|cash|money|wallet/i.test(q)) {
    return {
      text: "💳 We accept multiple payment methods:<br>• <strong>UPI</strong> — Google Pay, PhonePe, Paytm<br>• <strong>Cards</strong> — Visa, Mastercard, RuPay<br>• <strong>Net Banking</strong> — All major banks<br>• <strong>COD</strong> — Cash on Delivery<br><br>All payments are 256-bit SSL encrypted and 100% secure! 🔒",
      quickReplies: ['Apply coupon', 'COD limit', 'Payment failed']
    };
  }

  /* Coupon */
  if (/coupon|promo|code|discount code/i.test(q)) {
    return {
      text: "🎫 <strong>Available Coupon Codes:</strong><br>• <strong>WELCOME10</strong> — 10% off (max ₹500)<br>• <strong>FLAT200</strong> — ₹200 off on ₹1000+<br>• <strong>AI30</strong> — 30% off on ₹2000+ (max ₹2000)<br>• <strong>SUMMER15</strong> — 15% off (max ₹1000)<br>• <strong>FLAT500</strong> — ₹500 off on ₹3000+<br><br>Enter the code in the cart page!",
      quickReplies: ['Go to cart', 'Browse products', 'Other help']
    };
  }

  /* Contact */
  if (/contact|support|help|customer|call|email|phone/i.test(q)) {
    return {
      text: "📞 <strong>Contact Support:</strong><br>• 📧 Email: support@aishopper.com<br>• 📞 Phone: 1800-123-4567 (Toll Free)<br>• ⏰ Mon-Sat, 9 AM - 9 PM IST<br><br>Or visit our <a href='help.html' style='color:var(--primary-light)'>Help Center</a> for FAQs and self-service options.",
      quickReplies: ['Go to help page', 'Email support', 'Other question']
    };
  }

  /* Account */
  if (/account|profile|password|login|sign|register/i.test(q)) {
    return {
      text: "👤 <strong>Account Help:</strong><br>• <a href='login.html' style='color:var(--primary-light)'>Login / Sign Up</a><br>• <a href='account.html' style='color:var(--primary-light)'>Edit Profile</a><br>• <a href='account.html#addresses' style='color:var(--primary-light)'>Manage Addresses</a><br>• <a href='account.html#settings' style='color:var(--primary-light)'>Settings</a><br><br>Forgot password? Click \"Forgot Password\" on the login page.",
      quickReplies: ['Login now', 'Create account', 'Reset password']
    };
  }

  /* Price queries */
  if (/price|cost|cheap|expensive|budget|under|below/i.test(q)) {
    const priceMatch = q.match(/(\d+)/);
    const budget = priceMatch ? priceMatch[1] : null;

    return {
      text: budget
        ? `💰 Looking for products under ₹${Number(budget).toLocaleString('en-IN')}? Use the <strong>price filter</strong> on the homepage — slide the range to set your maximum budget. You can also sort by "Price: Low → High"!`
        : "💰 Use the <strong>price filter</strong> on the homepage to set your budget. You can also sort products by price. Tell me a specific budget like \"under ₹5000\" and I'll guide you!",
      quickReplies: ['Under ₹1000', 'Under ₹5000', 'Under ₹10000', 'Show deals']
    };
  }

  /* Thanks */
  if (/thanks|thank|thx|ty/i.test(q)) {
    return {
      text: "You're welcome! 😊 Happy to help. Is there anything else you'd like to know?",
      quickReplies: ['Browse products', 'Track order', 'No, that\'s all']
    };
  }

  /* Bye */
  if (/bye|goodbye|see you|close/i.test(q)) {
    return {
      text: "Goodbye! 👋 Happy shopping at AiShopper. Come back anytime you need help!",
      quickReplies: []
    };
  }

  /* Default */
  return {
    text: "I'm not sure I understand that fully, but I'm always learning! 🤖<br><br>Here are some things I can help with:<br>• 🔍 Find products<br>• 📦 Track orders<br>• 🔄 Returns & exchanges<br>• 💳 Payment help<br>• 🎫 Coupon codes<br><br>Try asking me about any of these topics!",
    quickReplies: ['Show deals', 'Track order', 'Return policy', 'Contact support']
  };
}
