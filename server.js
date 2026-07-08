const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());

// Root endpoint with general API info
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the PP3 Spotify Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health'
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
      // In Week 3, this will redirect the user to the frontend dashboard.
      // For now, return the tokens directly as a JSON response.
      res.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        scope: data.scope
      });
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error swapping code for tokens:', error);
    res.status(500).json({ error: 'internal_server_error', details: error.message });
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
