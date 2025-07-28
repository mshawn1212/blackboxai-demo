// Android Head Unit OS UI System - Frontend JavaScript

// Global state management for app browser states
window.appBrowserStates = {};
window.currentBrowserApp = null;

document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn');
  const appContainer = document.getElementById('app');

  // Update time and date in status bar
  function updateDateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const periodElement = document.getElementById('current-period');
    const dateElement = document.getElementById('current-date');

    if (timeElement && periodElement && dateElement) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      
      timeElement.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')}`;
      periodElement.textContent = ampm;
      
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateElement.textContent = now.toLocaleDateString('en-US', options).replace(',', ' |');
    }
  }

  // Update time every minute
  updateDateTime();
  setInterval(updateDateTime, 60000);

  // Check internet connectivity
  function checkConnectivity() {
    return navigator.onLine;
  }

  // Load pages content from separate HTML files or inline templates
  const pages = {
    home: null,
    apps: null,
    grid: '<section class="page"><h1>Grid View</h1><p>Grid view UI will be implemented here.</p></section>',
    music: null,
    settings: null,
    maps: null,
    phone: null,
    browser: null,
  };

  // Load pages from external HTML files
  async function loadPageContent(page) {
    if (page === 'home' || page === 'maps' || page === 'apps' || page === 'music' || page === 'settings' || page === 'phone' || page === 'browser') {
      try {
        const response = await fetch(`pages/${page === 'music' ? 'media' : page}.html`);
        const text = await response.text();
        return text;
      } catch (error) {
        console.error(`Failed to load page ${page}:`, error);
        return `<section class="page"><h1>Error</h1><p>Failed to load ${page} page.</p></section>`;
      }
    }
    return pages[page] || '<section class="page"><h1>Page Not Found</h1></section>';
  }

  async function setActivePage(page) {
    const content = await loadPageContent(page);
    appContainer.innerHTML = content;
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Initialize page-specific functionality
    if (page === 'maps') {
      setTimeout(initializeMap, 100); // Small delay to ensure DOM is ready
    } else if (page === 'home') {
      initializeHomeWidgets();
    } else if (page === 'music') {
      initializeMediaControls();
    } else if (page === 'settings') {
      initializeSettingsControls();
    } else if (page === 'phone') {
      initializePhoneDialer();
    } else if (page === 'browser') {
      initializeBrowserControls();
    } else if (page === 'apps') {
      initializeAppIcons();
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setActivePage(btn.dataset.page);
    });
  });

  // Initialize with home page
  setActivePage('home');

  // Check backend API status
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      console.log('Backend status:', data.status);
    })
    .catch(err => {
      console.error('Failed to connect to backend API:', err);
    });

  // Initialize Leaflet map for Maps page
  function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof L === 'undefined') return;

    // Clear previous map instance if any
    if (window.leafletMap) {
      window.leafletMap.remove();
    }

    try {
      window.leafletMap = L.map('map', {
        center: [37.7749, -122.4194], // Default to San Francisco
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(window.leafletMap);

      // Add a simple marker for current position
      L.marker([37.7749, -122.4194]).addTo(window.leafletMap);

      // Add route line
      const routeCoords = [
        [37.7749, -122.4194],
        [37.7849, -122.4094],
        [37.7949, -122.3994]
      ];
      L.polyline(routeCoords, { color: '#924dac', weight: 4 }).addTo(window.leafletMap);

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  // Initialize home page widgets
  function initializeHomeWidgets() {
    // Load weather data
    fetch('/api/weather')
      .then(response => response.json())
      .then(data => {
        const tempElement = document.querySelector('.temperature');
        const locationElement = document.querySelector('.location-text');
        if (tempElement) tempElement.textContent = `${data.temperature}°C`;
        if (locationElement) locationElement.textContent = data.location;
      })
      .catch(err => console.error('Failed to load weather data:', err));

    // Load vehicle status
    fetch('/api/vehicle/status')
      .then(response => response.json())
      .then(data => {
        const rangeElement = document.querySelector('.range');
        const chargeElement = document.querySelector('.charge-status');
        if (rangeElement) rangeElement.textContent = `${data.range}km Left`;
        if (chargeElement) chargeElement.textContent = `${data.batteryLevel}% ${data.charging ? 'Charging' : 'Not Charging'}`;
      })
      .catch(err => console.error('Failed to load vehicle status:', err));

    // Load music data
    fetch('/api/music/current')
      .then(response => response.json())
      .then(data => {
        const titleElement = document.querySelector('.music-info .title');
        const artistElement = document.querySelector('.music-info .artist');
        if (titleElement) titleElement.textContent = data.title;
        if (artistElement) artistElement.textContent = data.artist;
      })
      .catch(err => console.error('Failed to load music data:', err));
  }

  // Initialize media controls
  function initializeMediaControls() {
    const controlButtons = document.querySelectorAll('.media-controls .control-btn');
    controlButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.classList.contains('play') ? 'play' : 
                      btn.classList.contains('previous') ? 'previous' :
                      btn.classList.contains('next') ? 'next' :
                      btn.classList.contains('shuffle') ? 'shuffle' : 'repeat';
        
        fetch('/api/music/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Music control:', data);
          // Update UI based on response
          if (data.isPlaying) {
            btn.classList.add('active');
          }
        })
        .catch(err => console.error('Music control failed:', err));
      });
    });
  }

  // Initialize settings controls
  function initializeSettingsControls() {
    const slider = document.querySelector('.slider');
    const toggles = document.querySelectorAll('.toggle-input');
    const dropdowns = document.querySelectorAll('.setting-dropdown');

    if (slider) {
      slider.addEventListener('input', (e) => {
        console.log('Brightness changed:', e.target.value);
      });
    }

    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        console.log('Toggle changed:', e.target.checked);
      });
    });

    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('change', (e) => {
        console.log('Setting changed:', e.target.value);
      });
    });
  }

  // Initialize app icons with click handlers
  function initializeAppIcons() {
    const appIcons = document.querySelectorAll('.app-icon[data-url]');
    appIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const url = icon.dataset.url;
        if (url === 'phone') {
          setActivePage('phone');
        } else {
          openAppInBrowser(url, icon.querySelector('.label').textContent);
        }
      });
    });

    // Also handle music player and other internal apps
    const internalApps = document.querySelectorAll('.app-icon[data-action]');
    internalApps.forEach(app => {
      app.addEventListener('click', () => {
        setActivePage(app.dataset.action);
      });
    });
  }

  // Open external app in browser
  function openAppInBrowser(url, appName) {
    window.currentBrowserApp = appName;
    
    // Store or restore the app state
    if (window.appBrowserStates[appName]) {
      url = window.appBrowserStates[appName];
    }
    
    setActivePage('browser').then(() => {
      loadUrlInBrowser(url, appName);
    });
  }

  // Load URL in browser iframe
  function loadUrlInBrowser(url, appName) {
    const iframe = document.getElementById('browser-iframe');
    const title = document.getElementById('browser-title');
    const loading = document.getElementById('browser-loading');
    const error = document.getElementById('browser-error');

    if (!iframe || !title || !loading || !error) return;

    // Show loading state
    loading.style.display = 'flex';
    error.style.display = 'none';
    iframe.style.display = 'none';
    
    title.textContent = appName || 'Loading...';

    // Check connectivity
    if (!checkConnectivity()) {
      showBrowserError('No internet connection. Please check your network settings.');
      return;
    }

    // Set iframe source
    iframe.src = url;
    
    // Handle iframe load events
    iframe.onload = () => {
      loading.style.display = 'none';
      iframe.style.display = 'block';
      // Store current URL for state persistence
      if (appName) {
        window.appBrowserStates[appName] = url;
      }
    };

    iframe.onerror = () => {
      showBrowserError('Failed to load the page. Please try again.');
    };

    // Timeout for loading
    setTimeout(() => {
      if (loading.style.display !== 'none') {
        showBrowserError('Page took too long to load. Please try again.');
      }
    }, 15000);
  }

  // Show browser error
  function showBrowserError(message) {
    const loading = document.getElementById('browser-loading');
    const error = document.getElementById('browser-error');
    const iframe = document.getElementById('browser-iframe');
    const errorMessage = document.querySelector('.error-message');

    if (loading) loading.style.display = 'none';
    if (iframe) iframe.style.display = 'none';
    if (error) error.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = message;
  }

  // Initialize browser controls
  function initializeBrowserControls() {
    const exitBtn = document.getElementById('browser-exit-btn');
    const exitBottomBtn = document.getElementById('browser-exit-bottom-btn');
    const backBtn = document.getElementById('browser-back-btn');
    const forwardBtn = document.getElementById('browser-forward-btn');
    const refreshBtn = document.getElementById('browser-refresh-btn');
    const retryBtn = document.getElementById('browser-retry-btn');

    // Exit buttons
    [exitBtn, exitBottomBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          setActivePage('apps');
        });
      }
    });

    // Navigation buttons
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const iframe = document.getElementById('browser-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.history.back();
        }
      });
    }

    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => {
        const iframe = document.getElementById('browser-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.history.forward();
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const iframe = document.getElementById('browser-iframe');
        if (iframe) {
          iframe.src = iframe.src;
        }
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const iframe = document.getElementById('browser-iframe');
        if (iframe && window.currentBrowserApp) {
          const url = window.appBrowserStates[window.currentBrowserApp] || iframe.src;
          loadUrlInBrowser(url, window.currentBrowserApp);
        }
      });
    }
  }

  // Initialize phone dialer
  function initializePhoneDialer() {
    const numberInput = document.getElementById('phone-number');
    const dialButtons = document.querySelectorAll('.dial-btn[data-digit]');
    const callBtn = document.getElementById('call-btn');
    const backspaceBtn = document.getElementById('backspace-btn');
    const exitBtn = document.getElementById('phone-exit-btn');

    if (!numberInput) return;

    // Dial pad buttons
    dialButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const digit = btn.dataset.digit;
        numberInput.value += digit;
      });
    });

    // Backspace button
    if (backspaceBtn) {
      backspaceBtn.addEventListener('click', () => {
        numberInput.value = numberInput.value.slice(0, -1);
      });
    }

    // Call button
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        const number = numberInput.value.trim();
        if (number) {
          // In a real implementation, this would initiate a call
          alert(`Calling ${number}...`);
          console.log('Initiating call to:', number);
        }
      });
    }

    // Exit button
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        setActivePage('home');
      });
    }
  }

  // Add click handlers to home widgets after DOM is loaded
  setTimeout(() => {
    const actionWidgets = document.querySelectorAll('[data-action]');
    actionWidgets.forEach(widget => {
      widget.addEventListener('click', () => {
        const action = widget.dataset.action;
        setActivePage(action);
      });
    });
  }, 1000);

});
