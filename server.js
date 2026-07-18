const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotify_harmony';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Root endpoint with general API info
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the PP3 Spotify Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      login: '/api/login',
      callback: '/api/callback',
      profile: '/api/me',
      search: '/api/search',
      refresh: '/api/refresh',
      authStatus: '/api/auth/status',
      topArtists: '/api/top-artists',
      topTracks: '/api/top-tracks'
    }
  });
});

// Health check endpoint verifying loaded environment variables
app.get('/api/health', (req, res) => {
  const envStatus = {
    PORT: process.env.PORT ? 'Loaded' : 'Missing',
    NODE_ENV: process.env.NODE_ENV ? 'Loaded' : 'Missing',
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? 'Loaded' : 'Missing',
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? 'Loaded' : 'Missing',
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI ? 'Loaded' : 'Missing'
  };

  const isConfigured = 
    process.env.SPOTIFY_CLIENT_ID && 
    process.env.SPOTIFY_CLIENT_ID !== 'your_spotify_client_id_here' &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_CLIENT_SECRET !== 'your_spotify_client_secret_here';

  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    variables: envStatus,
    spotifyConfigured: !!isConfigured,
    message: isConfigured 
      ? 'Spotify integration configured successfully.' 
      : 'API running. Please update Spotify Client ID and Secret in your .env file to enable authentication.'
  });
});

// Spotify Login Endpoint - Redirects to Spotify Authorization Portal
app.get('/api/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  
  // Set the state cookie (used to verify state in the callback)
  // Secure; SameSite=Lax ensures the cookie is protected.
  res.setHeader('Set-Cookie', `spotify_auth_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
  
  const scope = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: state
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Spotify Callback Endpoint - Handles Spotify authorization redirect
app.get('/api/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  
  // Retrieve the stored state cookie
  const cookies = req.headers.cookie || '';
  const storedState = cookies
    ? cookies.split('; ').find(row => row.startsWith('spotify_auth_state='))?.split('=')[1]
    : null;

  if (state === null || state !== storedState) {
    return res.status(400).json({ 
      error: 'state_mismatch',
      message: 'Authentication state mismatch. If you initiated the request from localhost, please ensure you use 127.0.0.1 (matching your redirect URI) instead.'
    });
  }

  // Clear state cookie
  res.setHeader('Set-Cookie', 'spotify_auth_state=; Path=/; HttpOnly; Max-Age=0');

  try {
    const authOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    };

    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();

    if (response.ok) {
      // Fetch user profile from Spotify using the access token
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      let spotifyId = 'free_dev_fallback_user';
      let displayName = 'Spotify Harmony Free Dev';
      let email = 'free-dev@localhost';
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        spotifyId = profileData.id;
        displayName = profileData.display_name || '';
        email = profileData.email || '';
      } else if (profileResponse.status === 403) {
        // Fallback for Spotify Free Developer accounts which are blocked from Web API requests
        console.warn('Spotify profile fetch returned 403 (Premium Required for App Owner). Using local fallback profile for database and JWT persistence.');
      } else {
        const errorBody = await profileResponse.text();
        console.error(`Spotify profile fetch error. Status: ${profileResponse.status}. Body:`, errorBody);
        throw new Error(`Failed to fetch user profile from Spotify. Status: ${profileResponse.status}. Body: ${errorBody}`);
      }

      
      // Calculate token expiration date
      const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
      
      // Find or update the user in MongoDB
      let user = await User.findOne({ spotifyId });
      
      if (user) {
        user.accessToken = data.access_token;
        user.refreshToken = data.refresh_token;
        user.tokenExpiresAt = tokenExpiresAt;
        user.displayName = displayName;
        user.email = email;
        await user.save();
      } else {
        user = new User({
          spotifyId,
          displayName,
          email,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenExpiresAt
        });
        await user.save();
      }
      
      // Generate a signed JWT
      const jwtToken = jwt.sign(
        { userId: user._id, spotifyId: user.spotifyId },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );
      
      // Redirect to the frontend with the JWT and display name in the query parameters
      res.redirect(`/?jwt=${jwtToken}&displayName=${encodeURIComponent(displayName)}&spotifyId=${spotifyId}`);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error swapping code for tokens:', error);
    res.status(500).json({ error: 'internal_server_error', details: error.message });
  }
});

// Helper function to refresh access tokens before they expire
const refreshAccessTokenIfNeeded = async (user) => {
  // If token expires in less than 5 minutes (300,000 ms), refresh it
  const fiveMinutes = 5 * 60 * 1000;
  if (!user.refreshToken) {
    console.warn(`User ${user.spotifyId} does not have a refresh token. Skipping refresh.`);
    return user;
  }

  if (user.tokenExpiresAt.getTime() - Date.now() > fiveMinutes) {
    return user; // Token is still valid
  }

  console.log(`Spotify access token for user ${user.spotifyId} is expiring soon or expired. Refreshing...`);
  
  try {
    const authOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.refreshToken
      })
    };

    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to refresh Spotify token:', data);
      throw new Error(`Spotify refresh failed with status ${response.status}: ${JSON.stringify(data)}`);
    }

    user.accessToken = data.access_token;
    if (data.refresh_token) {
      user.refreshToken = data.refresh_token; // Save new refresh token if provided
    }
    user.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    await user.save();
    
    console.log(`Spotify access token refreshed successfully for user ${user.spotifyId}.`);
    return user;
  } catch (error) {
    console.error('Error in refreshAccessTokenIfNeeded:', error);
    throw error;
  }
};

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Access token (JWT) is missing.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'invalid_token', message: 'JWT token is invalid or expired.' });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'user_not_found', message: 'User not found in system.' });
    }
    
    // Automatically verify/refresh Spotify access token if necessary
    try {
      await refreshAccessTokenIfNeeded(user);
    } catch (refreshError) {
      console.error('Failed to refresh Spotify token during authentication:', refreshError);
      return res.status(401).json({ 
        error: 'spotify_session_expired', 
        message: 'Spotify session could not be refreshed. Please log in again.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'internal_server_error', details: error.message });
  }
};

// GET /api/me - Retrieve authenticated user profile
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`
      }
    });

    if (spotifyResponse.ok) {
      const profileData = await spotifyResponse.json();
      return res.json(profileData);
    }

    if (spotifyResponse.status === 403) {
      console.warn('Spotify profile fetch returned 403 (sandbox user limit or free account restriction). Using database fallback.');
    } else {
      console.error(`Spotify API error fetching profile: ${spotifyResponse.status}`);
    }

    // Graceful fallback: return user info stored in our database
    return res.json({
      id: req.user.spotifyId,
      display_name: req.user.displayName,
      email: req.user.email,
      fallback: true,
      note: 'This profile data was retrieved from the database cache because the direct Spotify API call was restricted.'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return database cache as fallback even on connection/API errors
    return res.json({
      id: req.user.spotifyId,
      display_name: req.user.displayName,
      email: req.user.email,
      fallback: true,
      error: error.message
    });
  }
});

// GET /api/search - Search songs, artists, or albums
app.get('/api/search', authenticateToken, async (req, res) => {
  const { q, type = 'track,artist,album', limit = 20, offset = 0 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'bad_request', message: 'Query parameter "q" is required.' });
  }

  try {
    const params = new URLSearchParams({
      q: q,
      type: type,
      limit: String(limit),
      offset: String(offset)
    });

    const spotifyResponse = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`
      }
    });

    const data = await spotifyResponse.json();

    if (spotifyResponse.ok) {
      return res.json(data);
    }

    // Forward the error from Spotify API
    console.error(`Spotify Search API error: ${spotifyResponse.status}`, data);
    return res.status(spotifyResponse.status).json({
      error: 'spotify_api_error',
      status: spotifyResponse.status,
      details: data
    });
  } catch (error) {
    console.error('Error searching Spotify catalog:', error);
    return res.status(500).json({ error: 'internal_server_error', details: error.message });
  }
});

// POST /api/refresh - Refresh and retrieve the current user's Spotify access token details
app.post('/api/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Calculate remaining seconds for the Spotify access token
    const remainingSeconds = Math.max(0, Math.floor((user.tokenExpiresAt.getTime() - Date.now()) / 1000));
    
    return res.json({
      spotifyId: user.spotifyId,
      accessToken: user.accessToken,
      tokenExpiresAt: user.tokenExpiresAt,
      expiresInSeconds: remainingSeconds
    });
  } catch (error) {
    console.error('Error in POST /api/refresh endpoint:', error);
    return res.status(500).json({ error: 'internal_server_error', details: error.message });
  }
});

// GET /api/auth/status - Validates the status of the current JWT in the database.
// Returns true/false (or JSON object) depending on if the user needs to login & authorize.
app.get('/api/auth/status', async (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token;
  }

  const sendResponse = (isValid) => {
    // If the client requested a raw boolean
    if (req.query.raw === 'true') {
      return res.json(isValid);
    }
    // Otherwise return a comprehensive JSON object
    return res.json({
      authorized: isValid,
      needsAuth: !isValid,
      status: isValid
    });
  };

  if (!token) {
    return sendResponse(false);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendResponse(false);
    }

    try {
      await refreshAccessTokenIfNeeded(user);
      return sendResponse(true);
    } catch (refreshError) {
      console.error('Spotify token verification/refresh failed in status check:', refreshError);
      return sendResponse(false);
    }
  } catch (error) {
    return sendResponse(false);
  }
});

// GET /api/top-artists - Retrieve user's top artists from Spotify
app.get('/api/top-artists', authenticateToken, async (req, res) => {
  const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;

  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      time_range: time_range
    });

    const spotifyResponse = await fetch(`https://api.spotify.com/v1/me/top/artists?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`
      }
    });

    const data = await spotifyResponse.json();

    if (spotifyResponse.ok) {
      return res.json(data);
    }

    console.error(`Spotify Top Artists API error: ${spotifyResponse.status}`, data);
    return res.status(spotifyResponse.status).json({
      error: 'spotify_api_error',
      status: spotifyResponse.status,
      details: data
    });
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return res.status(500).json({ error: 'internal_server_error', details: error.message });
  }
});

// GET /api/top-tracks - Retrieve user's top tracks from Spotify
app.get('/api/top-tracks', authenticateToken, async (req, res) => {
  const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;

  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      time_range: time_range
    });

    const spotifyResponse = await fetch(`https://api.spotify.com/v1/me/top/tracks?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`
      }
    });

    const data = await spotifyResponse.json();

    if (spotifyResponse.ok) {
      return res.json(data);
    }

    console.error(`Spotify Top Tracks API error: ${spotifyResponse.status}`, data);
    return res.status(spotifyResponse.status).json({
      error: 'spotify_api_error',
      status: spotifyResponse.status,
      details: data
    });
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return res.status(500).json({ error: 'internal_server_error', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
