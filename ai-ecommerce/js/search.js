/* =========================
   SMART SEARCH MODULE
========================= */

const SEARCH_HISTORY_KEY = 'ai_shop_search_history';
const MAX_HISTORY = 10;
let debounceTimer = null;

/**
 * Initialize search functionality
 */
export function initSearch() {
  const searchBar = document.getElementById('searchBar');
  const suggestions = document.getElementById('searchSuggestions');
  const voiceBtn = document.getElementById('voiceSearchBtn');

  if (!searchBar) return;

  /* Debounced search */
  searchBar.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleSearch(searchBar.value.trim());
    }, 350);
  });

  /* Enter key */
  searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceTimer);
      executeSearch(searchBar.value.trim());
    }
    if (e.key === 'Escape') {
      hideSuggestions();
      searchBar.blur();
    }
  });

  /* Focus */
  searchBar.addEventListener('focus', () => {
    if (!searchBar.value.trim()) {
      showSearchHistory();
    }
  });

  /* Click outside to close */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      hideSuggestions();
    }
  });

  /* Voice search */
  if (voiceBtn) {
    voiceBtn.addEventListener('click', startVoiceSearch);
  }
}

/**
 * Handle search input (show suggestions)
 */
async function handleSearch(query) {
  const suggestions = document.getElementById('searchSuggestions');
  if (!suggestions) return;

  if (query.length < 2) {
    showSearchHistory();
    return;
  }

  try {
    const res = await fetch(`/api/products/search/smart?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.products && data.products.length > 0) {
      suggestions.innerHTML = data.products.slice(0, 6).map(p => `
        <div class="suggestion-item" data-id="${p._id}">
          <span class="icon">🔍</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${highlightMatch(p.title, query)}</div>
            <div style="font-size:11px;color:var(--text-muted)">₹${Math.round(p.price).toLocaleString()} · ${p.category}</div>
          </div>
        </div>
      `).join('');

      /* Click handlers */
      suggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          window.location.href = `product.html?id=${item.dataset.id}`;
        });
      });

      suggestions.classList.add('active');
    } else {
      suggestions.innerHTML = `
        <div class="suggestion-item">
          <span class="icon">😕</span>
          <span style="color:var(--text-muted);font-size:13px">No products found for "${query}"</span>
        </div>
      `;
      suggestions.classList.add('active');
    }
  } catch (err) {
    console.error('Search error:', err);
  }
}

/**
 * Execute search — navigate to results
 */
function executeSearch(query) {
  if (!query) return;
  saveSearchHistory(query);
  hideSuggestions();
  /* Trigger product filter/search on current page */
  window.dispatchEvent(new CustomEvent('ai-search', { detail: { query } }));
}

/**
 * Show search history
 */
function showSearchHistory() {
  const suggestions = document.getElementById('searchSuggestions');
  if (!suggestions) return;

  const history = getSearchHistory();

  if (history.length === 0) {
    suggestions.innerHTML = `
      <div class="suggestion-item">
        <span class="icon">💡</span>
        <span style="color:var(--text-muted);font-size:13px">Try: "gaming laptop under ₹70000"</span>
      </div>
      <div class="suggestion-item">
        <span class="icon">💡</span>
        <span style="color:var(--text-muted);font-size:13px">Try: "birthday gift for sister"</span>
      </div>
    `;
  } else {
    suggestions.innerHTML = history.map(q => `
      <div class="suggestion-item history-item" data-query="${q}">
        <span class="icon">🕒</span>
        <span style="flex:1;font-size:13px">${q}</span>
        <button class="remove-history" data-query="${q}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:11px;padding:4px">✕</button>
      </div>
    `).join('');

    suggestions.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-history')) {
          e.stopPropagation();
          removeSearchHistory(e.target.dataset.query);
          showSearchHistory();
          return;
        }
        const searchBar = document.getElementById('searchBar');
        searchBar.value = item.dataset.query;
        executeSearch(item.dataset.query);
      });
    });
  }

  suggestions.classList.add('active');
}

/**
 * Hide suggestions
 */
function hideSuggestions() {
  const suggestions = document.getElementById('searchSuggestions');
  if (suggestions) suggestions.classList.remove('active');
}

/**
 * Highlight matching text
 */
function highlightMatch(text, query) {
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<strong style="color:var(--primary-light)">$1</strong>');
}

/**
 * Voice search using Web Speech API
 */
function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    window.showToast?.('Voice search not supported in this browser', 'warning');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;

  const voiceBtn = document.getElementById('voiceSearchBtn');
  if (voiceBtn) {
    voiceBtn.style.color = 'var(--danger)';
    voiceBtn.style.animation = 'pulse 1s infinite';
  }

  window.showToast?.('Listening...', 'info', 2000);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
      searchBar.value = transcript;
      executeSearch(transcript);
    }
  };

  recognition.onerror = () => {
    window.showToast?.('Could not recognize speech. Try again.', 'error');
  };

  recognition.onend = () => {
    if (voiceBtn) {
      voiceBtn.style.color = '';
      voiceBtn.style.animation = '';
    }
  };

  recognition.start();
}

/* Search History Helpers */
function getSearchHistory() {
  return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
}

function saveSearchHistory(query) {
  let history = getSearchHistory().filter(q => q !== query);
  history.unshift(query);
  history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function removeSearchHistory(query) {
  const history = getSearchHistory().filter(q => q !== query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}
