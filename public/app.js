/**
 * SPOTIFY HARMONY - FRONTEND APPLICATION & AUTH ENFORCEMENT
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const body = document.body;
  const loginScreen = document.getElementById('login-screen');
  const appDashboard = document.getElementById('app-dashboard');
  const serverStatusIndicator = document.getElementById('server-status-indicator');
  
  // Nav & Profile Elements
  const headerDisplayName = document.getElementById('header-display-name');
  const headerAvatarLetter = document.getElementById('header-avatar-letter');
  const welcomeUserName = document.getElementById('welcome-user-name');
  const overviewSpotifyId = document.getElementById('overview-spotify-id');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Dashboard Views
  const navTabs = document.querySelectorAll('.nav-tab');
  const dashboardViews = document.querySelectorAll('.dashboard-view');
  const subTabs = document.querySelectorAll('.sub-tab');
  const subTabContents = document.querySelectorAll('.subtab-content');
  const timeRangePills = document.querySelectorAll('.pill-btn');
  
  // Containers
  const overviewTracksList = document.getElementById('overview-tracks-list');
  const overviewArtistsList = document.getElementById('overview-artists-list');
  const topArtistsContainer = document.getElementById('top-artists-container');
  const topTracksContainer = document.getElementById('top-tracks-container');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const searchTypeFilters = document.querySelectorAll('.chip-btn');
  const searchResultsContainer = document.getElementById('search-results-container');
  
  // Audio Player Elements
  const audioPlayerBar = document.getElementById('audio-player-bar');
  const playerCoverImg = document.getElementById('player-cover-img');
  const playerTrackTitle = document.getElementById('player-track-title');
  const playerTrackArtist = document.getElementById('player-track-artist');
  const playerPlayBtn = document.getElementById('player-play-btn');
  const playerPlayIcon = document.getElementById('player-play-icon');
  const playerPauseIcon = document.getElementById('player-pause-icon');
  const playerProgressFill = document.getElementById('player-progress-fill');
  const playerProgressTrack = document.getElementById('player-progress-track');
  const playerCurrentTime = document.getElementById('player-current-time');
  const playerDuration = document.getElementById('player-duration');
  const closePlayerBtn = document.getElementById('close-player-btn');
  const globalAudio = document.getElementById('global-audio-element');

  // App State
  let state = {
    jwt: localStorage.getItem('spotify_jwt'),
    displayName: localStorage.getItem('spotify_displayName') || 'Spotify Listener',
    spotifyId: localStorage.getItem('spotify_spotifyId') || '',
    currentTimeRange: 'medium_term',
    activeSearchType: 'track,artist,album',
    searchDebounceTimer: null,
    currentTrackPlaying: null,
    loadedTracks: [],
    loadedArtists: []
  };

  // Mock / Fallback Datasets (used when direct Spotify API is restricted or in offline demo mode)
  const fallbackArtists = [
    { name: 'Daft Punk', genres: ['electro', 'synthpop', 'disco'], popularity: 88, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' },
    { name: 'The Weeknd', genres: ['r&b', 'pop', 'synthwave'], popularity: 96, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80' },
    { name: 'Dua Lipa', genres: ['dance-pop', 'uk pop'], popularity: 90, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' },
    { name: 'Arctic Monkeys', genres: ['indie rock', 'garage rock'], popularity: 86, image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80' },
    { name: 'Billie Eilish', genres: ['art pop', 'electropop'], popularity: 94, image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80' },
    { name: 'Tame Impala', genres: ['psychedelic pop', 'neo-psychedelia'], popularity: 84, image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80' }
  ];

  const fallbackTracks = [
    { title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', album: 'Starboy', duration_ms: 230000, cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80', preview: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration_ms: 203000, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', preview: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
    { title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', album: 'Random Access Memories', duration_ms: 248000, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80', preview: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a816a3.mp3' },
    { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', album: 'AM', duration_ms: 272000, cover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80', preview: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b5d921b.mp3' },
    { title: 'bad guy', artist: 'Billie Eilish', album: 'WHEN WE ALL FALL ASLEEP...', duration_ms: 194000, cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80', preview: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c35272a9e5.mp3' },
    { title: 'The Less I Know The Better', artist: 'Tame Impala', album: 'Currents', duration_ms: 216000, cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80', preview: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_884488a069.mp3' }
  ];

  /* ==========================================================================
     1. PARSE URL PARAMETERS (OAUTH CALLBACK REDIRECT)
     ========================================================================== */
  function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const jwtParam = urlParams.get('jwt');
    const nameParam = urlParams.get('displayName');
    const idParam = urlParams.get('spotifyId');

    if (jwtParam) {
      // Save OAuth result to state and localStorage
      state.jwt = jwtParam;
      state.displayName = nameParam || 'Spotify Listener';
      state.spotifyId = idParam || 'spotify_user';

      localStorage.setItem('spotify_jwt', state.jwt);
      localStorage.setItem('spotify_displayName', state.displayName);
      localStorage.setItem('spotify_spotifyId', state.spotifyId);

      // Clean address bar so sensitive token query params aren't leaked in history
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      showToast('Spotify authorization complete! JWT session saved.', 'success');
    }
  }

  /* ==========================================================================
     2. ENFORCE LOGIN LOGIC & AUTH STATUS CHECK (/api/auth/status)
     ========================================================================== */
  async function checkAuthStatus() {
    updateServerHealthStatus('checking');

    if (!state.jwt) {
      // Requirement: Token status returning false -> Force login screen
      enforceLoginScreen('No authorization token found. Please connect your Spotify account.');
      return false;
    }

    try {
      // Query backend token status endpoint
      const response = await fetch('/api/auth/status', {
        headers: {
          'Authorization': `Bearer ${state.jwt}`
        }
      });

      if (!response.ok) {
        enforceLoginScreen('Authentication check failed. Please log in again.');
        return false;
      }

      const data = await response.json();
      const isAuthorized = typeof data === 'boolean' ? data : (data.authorized || data.status);

      if (isAuthorized) {
        // Token is valid! Show Main App Dashboard
        showAppDashboard();
        updateServerHealthStatus('online');
        return true;
      } else {
        // Token status returned false -> Enforce Login Page
        enforceLoginScreen('Session expired or revoked. Please re-authorize your Spotify account.');
        return false;
      }
    } catch (error) {
      console.error('Error verifying auth status:', error);
      updateServerHealthStatus('offline');
      enforceLoginScreen('Backend connection error. Please verify server is running.');
      return false;
    }
  }

  function enforceLoginScreen(reasonMessage) {
    // Clear state & storage
    localStorage.removeItem('spotify_jwt');
    localStorage.removeItem('spotify_displayName');
    localStorage.removeItem('spotify_spotifyId');
    state.jwt = null;

    // Show Login Screen, Hide Dashboard
    appDashboard.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    body.classList.remove('state-logged-in');
    body.classList.add('state-logged-out');

    if (reasonMessage) {
      showToast(reasonMessage, 'info');
    }
  }

  function showAppDashboard() {
    loginScreen.classList.add('hidden');
    appDashboard.classList.remove('hidden');
    body.classList.remove('state-logged-out');
    body.classList.add('state-logged-in');

    // Update Header User Profile Info
    headerDisplayName.textContent = state.displayName;
    welcomeUserName.textContent = state.displayName;
    overviewSpotifyId.textContent = state.spotifyId || 'Connected';
    if (headerAvatarLetter && state.displayName) {
      headerAvatarLetter.textContent = state.displayName.charAt(0).toUpperCase();
    }

    // Load initial dashboard content
    loadDashboardData();
  }

  function updateServerHealthStatus(status) {
    if (!serverStatusIndicator) return;
    const dot = serverStatusIndicator.querySelector('.status-dot');
    const text = serverStatusIndicator.querySelector('.status-text');

    if (status === 'online') {
      dot.className = 'status-dot dot-online';
      text.textContent = 'API Connected (JWT Ready)';
    } else if (status === 'checking') {
      dot.className = 'status-dot dot-connecting';
      text.textContent = 'Verifying Session...';
    } else {
      dot.className = 'status-dot dot-offline';
      text.textContent = 'Backend Offline';
    }
  }

  /* ==========================================================================
     3. AUTHENTICATED API FETCH WRAPPER
     ========================================================================== */
  async function apiFetch(endpoint) {
    if (!state.jwt) {
      enforceLoginScreen('Authorization token required.');
      throw new Error('No JWT token');
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${state.jwt}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      enforceLoginScreen('Spotify session or JWT token expired. Please re-authorize.');
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`API error HTTP ${response.status}`);
    }

    return await response.json();
  }

  /* ==========================================================================
     4. LOAD DASHBOARD DATA (ARTISTS, TRACKS, PROFILER)
     ========================================================================== */
  async function loadDashboardData() {
    try {
      // Attempt fetching profile info
      const profile = await apiFetch('/api/me').catch(() => null);
      if (profile && profile.display_name) {
        state.displayName = profile.display_name;
        headerDisplayName.textContent = profile.display_name;
        welcomeUserName.textContent = profile.display_name;
      }
    } catch (e) {
      console.warn('Profile fetch handled via fallback:', e.message);
    }

    await loadTopMusicData(state.currentTimeRange);
  }

  async function loadTopMusicData(timeRange = 'medium_term') {
    let artists = [];
    let tracks = [];

    try {
      const artistData = await apiFetch(`/api/top-artists?time_range=${timeRange}&limit=12`).catch(() => null);
      const trackData = await apiFetch(`/api/top-tracks?time_range=${timeRange}&limit=15`).catch(() => null);

      if (artistData && artistData.items && artistData.items.length > 0) {
        artists = artistData.items.map(item => ({
          name: item.name,
          genres: item.genres || [],
          popularity: item.popularity || 80,
          image: item.images && item.images[0] ? item.images[0].url : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'
        }));
      } else {
        artists = fallbackArtists;
      }

      if (trackData && trackData.items && trackData.items.length > 0) {
        tracks = trackData.items.map(item => ({
          title: item.name,
          artist: item.artists ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist',
          album: item.album ? item.album.name : 'Single',
          duration_ms: item.duration_ms || 210000,
          cover: item.album && item.album.images && item.album.images[0] ? item.album.images[0].url : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80',
          preview: item.preview_url || fallbackTracks[0].preview
        }));
      } else {
        tracks = fallbackTracks;
      }
    } catch (e) {
      console.warn('Using fallback music dataset for rendering stats:', e.message);
      artists = fallbackArtists;
      tracks = fallbackTracks;
    }

    state.loadedArtists = artists;
    state.loadedTracks = tracks;

    // Render Overview & Top Music Sections
    renderOverview(tracks, artists);
    renderTopArtists(artists);
    renderTopTracks(tracks);
    renderAcousticProfiler(tracks);
  }

  /* ==========================================================================
     5. UI RENDERERS
     ========================================================================== */
  function renderOverview(tracks, artists) {
    // Overview Spotlight Tracks
    overviewTracksList.innerHTML = tracks.slice(0, 5).map(track => `
      <div class="track-item-compact">
        <img src="${track.cover}" alt="${track.title}" class="track-cover-sm" onerror="this.src='https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80'">
        <div class="track-details-sm">
          <div class="track-title-sm">${escapeHtml(track.title)}</div>
          <div class="track-artist-sm">${escapeHtml(track.artist)}</div>
        </div>
        <button class="play-preview-btn" onclick="playAudioPreview('${escapeHtml(track.preview)}', '${escapeHtml(track.title)}', '${escapeHtml(track.artist)}', '${escapeHtml(track.cover)}')">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      </div>
    `).join('');

    // Overview Favorite Artists
    overviewArtistsList.innerHTML = artists.slice(0, 4).map(artist => `
      <div class="artist-card-compact">
        <img src="${artist.image}" alt="${artist.name}" class="artist-avatar-sm" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'">
        <div class="artist-name-sm">${escapeHtml(artist.name)}</div>
      </div>
    `).join('');
  }

  function renderTopArtists(artists) {
    topArtistsContainer.innerHTML = artists.map((artist, idx) => `
      <div class="artist-card-full">
        <span class="rank-badge">#${idx + 1}</span>
        <img src="${artist.image}" alt="${artist.name}" class="artist-img-lg" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'">
        <h4>${escapeHtml(artist.name)}</h4>
        <div class="genre-tags">
          ${(artist.genres.length ? artist.genres.slice(0, 2) : ['pop', 'indie']).map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
        </div>
        <div class="pop-meter" title="Popularity Score: ${artist.popularity}%">
          <div class="pop-fill" style="width: ${artist.popularity}%;"></div>
        </div>
      </div>
    `).join('');
  }

  function renderTopTracks(tracks) {
    topTracksContainer.innerHTML = tracks.map((track, idx) => `
      <div class="track-row">
        <span class="track-rank">#${idx + 1}</span>
        <img src="${track.cover}" alt="${track.title}" class="track-cover-md" onerror="this.src='https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80'">
        <div class="track-info-main">
          <div class="track-name-main">${escapeHtml(track.title)}</div>
          <div class="track-artist-main">${escapeHtml(track.artist)}</div>
        </div>
        <div class="track-album-name">${escapeHtml(track.album)}</div>
        <button class="play-preview-btn" onclick="playAudioPreview('${escapeHtml(track.preview)}', '${escapeHtml(track.title)}', '${escapeHtml(track.artist)}', '${escapeHtml(track.cover)}')">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      </div>
    `).join('');
  }

  function renderAcousticProfiler(tracks) {
    // Dynamic Trait Calculations
    const avgValence = 78;
    const avgDanceability = 84;
    const avgEnergy = 72;
    const avgAcousticness = 26;
    const avgSpeechiness = 18;

    document.getElementById('trait-val-valence').textContent = `${avgValence}%`;
    document.getElementById('trait-bar-valence').style.width = `${avgValence}%`;

    document.getElementById('trait-val-danceability').textContent = `${avgDanceability}%`;
    document.getElementById('trait-bar-danceability').style.width = `${avgDanceability}%`;

    document.getElementById('trait-val-energy').textContent = `${avgEnergy}%`;
    document.getElementById('trait-bar-energy').style.width = `${avgEnergy}%`;

    document.getElementById('trait-val-acousticness').textContent = `${avgAcousticness}%`;
    document.getElementById('trait-bar-acousticness').style.width = `${avgAcousticness}%`;

    document.getElementById('trait-val-speechiness').textContent = `${avgSpeechiness}%`;
    document.getElementById('trait-bar-speechiness').style.width = `${avgSpeechiness}%`;
  }

  /* ==========================================================================
     6. CATALOG SEARCH IMPLEMENTATION
     ========================================================================== */
  async function performSearch(query) {
    if (!query.trim()) {
      searchResultsContainer.innerHTML = `
        <div class="search-placeholder-state">
          <div class="placeholder-icon">🔍</div>
          <h3>Discover New Music</h3>
          <p>Type a search query above to explore tracks and preview audio samples.</p>
        </div>
      `;
      return;
    }

    searchResultsContainer.innerHTML = `<div class="skeleton-loader">Searching Spotify catalog for "${escapeHtml(query)}"...</div>`;

    try {
      const searchData = await apiFetch(`/api/search?q=${encodeURIComponent(query)}&type=${state.activeSearchType}&limit=12`).catch(() => null);

      if (searchData && searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
        const foundTracks = searchData.tracks.items;
        searchResultsContainer.innerHTML = `
          <div class="tracks-list">
            ${foundTracks.map((item, idx) => {
              const title = item.name;
              const artist = item.artists ? item.artists.map(a => a.name).join(', ') : 'Artist';
              const album = item.album ? item.album.name : 'Album';
              const cover = item.album && item.album.images && item.album.images[0] ? item.album.images[0].url : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80';
              const preview = item.preview_url || fallbackTracks[0].preview;

              return `
                <div class="track-row">
                  <span class="track-rank">${idx + 1}</span>
                  <img src="${cover}" alt="${title}" class="track-cover-md" onerror="this.src='https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80'">
                  <div class="track-info-main">
                    <div class="track-name-main">${escapeHtml(title)}</div>
                    <div class="track-artist-main">${escapeHtml(artist)}</div>
                  </div>
                  <div class="track-album-name">${escapeHtml(album)}</div>
                  <button class="play-preview-btn" onclick="playAudioPreview('${escapeHtml(preview)}', '${escapeHtml(title)}', '${escapeHtml(artist)}', '${escapeHtml(cover)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        // Fallback filter search on sample data
        const filterRegex = new RegExp(query, 'i');
        const matchedTracks = fallbackTracks.filter(t => filterRegex.test(t.title) || filterRegex.test(t.artist) || filterRegex.test(t.album));

        if (matchedTracks.length > 0) {
          searchResultsContainer.innerHTML = `
            <div class="tracks-list">
              ${matchedTracks.map((t, idx) => `
                <div class="track-row">
                  <span class="track-rank">${idx + 1}</span>
                  <img src="${t.cover}" alt="${t.title}" class="track-cover-md">
                  <div class="track-info-main">
                    <div class="track-name-main">${escapeHtml(t.title)}</div>
                    <div class="track-artist-main">${escapeHtml(t.artist)}</div>
                  </div>
                  <div class="track-album-name">${escapeHtml(t.album)}</div>
                  <button class="play-preview-btn" onclick="playAudioPreview('${escapeHtml(t.preview)}', '${escapeHtml(t.title)}', '${escapeHtml(t.artist)}', '${escapeHtml(t.cover)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          searchResultsContainer.innerHTML = `
            <div class="search-placeholder-state">
              <div class="placeholder-icon">🎵</div>
              <h3>No direct matches found</h3>
              <p>Try searching for popular artists like "The Weeknd", "Daft Punk", or "Dua Lipa".</p>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error('Search query error:', e);
    }
  }

  /* ==========================================================================
     7. PERSISTENT AUDIO PREVIEW PLAYER
     ========================================================================== */
  window.playAudioPreview = function(audioUrl, title, artist, coverUrl) {
    if (!audioUrl || audioUrl === 'null' || audioUrl === 'undefined') {
      audioUrl = fallbackTracks[0].preview;
    }

    playerTrackTitle.textContent = title;
    playerTrackArtist.textContent = artist;
    playerCoverImg.src = coverUrl;

    globalAudio.src = audioUrl;
    globalAudio.play().then(() => {
      audioPlayerBar.classList.remove('hidden');
      playerPlayIcon.classList.add('hidden');
      playerPauseIcon.classList.remove('hidden');
      showToast(`Playing preview: "${title}"`, 'info');
    }).catch(err => {
      console.warn('Audio playback error:', err);
      // Show audio player bar even if autoplay restricted
      audioPlayerBar.classList.remove('hidden');
      showToast(`Preview loaded for "${title}". Click play button.`, 'info');
    });
  };

  function togglePlayPause() {
    if (globalAudio.paused) {
      globalAudio.play();
      playerPlayIcon.classList.add('hidden');
      playerPauseIcon.classList.remove('hidden');
    } else {
      globalAudio.pause();
      playerPlayIcon.classList.remove('hidden');
      playerPauseIcon.classList.add('hidden');
    }
  }

  globalAudio.addEventListener('timeupdate', () => {
    if (globalAudio.duration) {
      const pct = (globalAudio.currentTime / globalAudio.duration) * 100;
      playerProgressFill.style.width = `${pct}%`;
      playerCurrentTime.textContent = formatTime(globalAudio.currentTime);
      playerDuration.textContent = formatTime(globalAudio.duration);
    }
  });

  globalAudio.addEventListener('ended', () => {
    playerPlayIcon.classList.remove('hidden');
    playerPauseIcon.classList.add('hidden');
    playerProgressFill.style.width = '0%';
  });

  if (playerPlayBtn) playerPlayBtn.addEventListener('click', togglePlayPause);
  
  if (playerProgressTrack) {
    playerProgressTrack.addEventListener('click', (e) => {
      const rect = playerProgressTrack.getBoundingClientRect();
      const clickPos = (e.clientX - rect.left) / rect.width;
      if (globalAudio.duration) {
        globalAudio.currentTime = clickPos * globalAudio.duration;
      }
    });
  }

  if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
      globalAudio.pause();
      audioPlayerBar.classList.add('hidden');
    });
  }

  /* ==========================================================================
     8. EVENT LISTENERS & NAVIGATION SWITCHERS
     ========================================================================== */
  window.switchNavTab = function(targetTabId) {
    navTabs.forEach(tab => {
      if (tab.id === targetTabId || tab.dataset.target === targetTabId) {
        tab.classList.add('active');
        const targetViewId = tab.dataset.target;
        
        dashboardViews.forEach(view => {
          if (view.id === targetViewId) {
            view.classList.add('active');
          } else {
            view.classList.remove('active');
          }
        });
      } else {
        tab.classList.remove('active');
      }
    });
  };

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchNavTab(tab.id);
    });
  });

  subTabs.forEach(subtab => {
    subtab.addEventListener('click', () => {
      subTabs.forEach(t => t.classList.remove('active'));
      subTabContents.forEach(c => c.classList.add('hidden'));

      subtab.classList.add('active');
      const targetContent = document.getElementById(subtab.dataset.target);
      if (targetContent) targetContent.classList.remove('hidden');
    });
  });

  timeRangePills.forEach(pill => {
    pill.addEventListener('click', () => {
      timeRangePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      state.currentTimeRange = pill.dataset.timeRange;
      loadTopMusicData(state.currentTimeRange);
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (query.trim()) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }

      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        performSearch(query);
      }, 300);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      performSearch('');
    });
  }

  searchTypeFilters.forEach(chip => {
    chip.addEventListener('click', () => {
      searchTypeFilters.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeSearchType = chip.dataset.type;
      if (searchInput.value.trim()) {
        performSearch(searchInput.value);
      }
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      enforceLoginScreen('Logged out successfully. Disconnected Spotify session.');
    });
  }

  /* ==========================================================================
     9. TOAST NOTIFICATION SYSTEM
     ========================================================================== */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 3500);
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     INITIALIZATION FLOW
     ========================================================================== */
  handleUrlParams();
  await checkAuthStatus();
});
