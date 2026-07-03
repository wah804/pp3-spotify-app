const express = require('express');
const cors = require('cors');
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

// Start the server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
