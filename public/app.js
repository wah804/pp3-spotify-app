document.addEventListener('DOMContentLoaded', () => {
  // Select DOM Elements
  const body = document.body;
  const guestHero = document.getElementById('guest-hero-section');
  const authHero = document.getElementById('auth-hero-section');
  const navLoginBtn = document.getElementById('nav-login-btn');
  const navLogoutBtn = document.getElementById('nav-logout-btn');
  
  const userDisplayName = document.getElementById('user-display-name');
  const profileNameText = document.getElementById('profile-name-text');
  const userSpotifyId = document.getElementById('user-spotify-id');
  const avatarPlaceholder = document.getElementById('user-avatar-placeholder');
  const avatarLetter = document.getElementById('user-avatar-letter');
  
  const logoutBtn = document.getElementById('logout-btn');
  const enterDashboardBtn = document.getElementById('enter-dashboard-btn');

  // Initialize and Parse Query Parameters
  function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const jwt = urlParams.get('jwt');
    const displayName = urlParams.get('displayName');
    const spotifyId = urlParams.get('spotifyId');

    if (jwt && spotifyId) {
      // Save details to localStorage
      localStorage.setItem('spotify_jwt', jwt);
      localStorage.setItem('spotify_displayName', displayName || 'Spotify Listener');
      localStorage.setItem('spotify_spotifyId', spotifyId);

      // Clean the URL so tokens are not exposed in address bar or history
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      showToast('Successfully logged in with Spotify!', 'success');
    }
  }

  // Update Page UI based on Auth Status
  function updateAuthState() {
    const jwt = localStorage.getItem('spotify_jwt');
    const displayName = localStorage.getItem('spotify_displayName');
    const spotifyId = localStorage.getItem('spotify_spotifyId');

    if (jwt) {
      // Logged In (Authenticated State - Yellow Theme)
      body.classList.remove('theme-guest');
      body.classList.add('theme-auth');
      
      guestHero.classList.add('hidden');
      authHero.classList.remove('hidden');
      
      navLoginBtn.classList.add('hidden');
      navLogoutBtn.classList.remove('hidden');

      // Update User Info Card
      if (userDisplayName) userDisplayName.textContent = displayName;
      if (profileNameText) profileNameText.textContent = displayName;
      if (userSpotifyId) userSpotifyId.textContent = spotifyId;
      
      if (avatarLetter) {
        avatarLetter.textContent = displayName.charAt(0).toUpperCase();
      }
    } else {
      // Logged Out (Guest State - Red Theme)
      body.classList.remove('theme-auth');
      body.classList.add('theme-guest');
      
      authHero.classList.add('hidden');
      guestHero.classList.remove('hidden');
      
      navLogoutBtn.classList.add('hidden');
      navLoginBtn.classList.remove('hidden');
    }
  }

  // Log Out Handler
  function logout() {
    localStorage.removeItem('spotify_jwt');
    localStorage.removeItem('spotify_displayName');
    localStorage.removeItem('spotify_spotifyId');
    updateAuthState();
    showToast('Logged out successfully.', 'info');
  }

  // Bind Events
  if (navLogoutBtn) navLogoutBtn.addEventListener('click', logout);
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  if (enterDashboardBtn) {
    enterDashboardBtn.addEventListener('click', () => {
      showToast('Dashboard components are loading... Ready for Week 3 visualizations!', 'info');
    });
  }

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add slide-in animation
    toastContainer.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 3000);
  }

  // Inject CSS for Dynamic Toasts
  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 320px;
    }
    .toast {
      padding: 1rem 1.25rem;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      color: #ffffff;
      background-color: #18181b;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transform: translateY(20px);
      opacity: 0;
      animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: opacity 0.3s, transform 0.3s;
    }
    .toast-success {
      border-left: 4px solid var(--color-brand-yellow);
    }
    .toast-info {
      border-left: 4px solid var(--theme-accent);
    }
    .toast.fade-out {
      opacity: 0;
      transform: translateY(-10px);
    }
    @keyframes toastSlideIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Run Flow
  handleUrlParams();
  updateAuthState();
});
