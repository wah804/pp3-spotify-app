const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotify_harmony';
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  console.log('Connecting to database to set up valid test user session...');
  try {
    await mongoose.connect(MONGODB_URI);
    
    const spotifyId = 'test_spotify_id';
    let user = await User.findOne({ spotifyId });
    if (!user) {
      user = new User({
        spotifyId,
        displayName: 'Test User',
        email: 'test@example.com',
        accessToken: 'dummy_access_token',
        refreshToken: 'dummy_refresh_token',
        tokenExpiresAt: new Date(Date.now() + 36000 * 1000)
      });
      await user.save();
    } else {
      user.tokenExpiresAt = new Date(Date.now() + 36000 * 1000);
      await user.save();
    }

    global.validToken = jwt.sign(
      { userId: user._id, spotifyId: user.spotifyId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Valid test token generated successfully.');
  } catch (dbErr) {
    console.error('Failed to set up database test user:', dbErr.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }

  console.log('Starting backend server for integration tests...');
  const server = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) }
  });

  // Wait for server to print the startup messages
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Server] ${output.trim()}`);
      if (output.includes('Server running') || output.includes('API URL')) {
        resolve();
      }
    });
    server.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });
  });

  // Add a small delay to ensure DB connects
  await new Promise(r => setTimeout(r, 1000));

  let passed = true;

  const testEndpoint = async (name, url, options = {}, validator) => {
    try {
      console.log(`\nTesting endpoint: ${name} (${options.method || 'GET'} ${url})...`);
      const response = await fetch(`${BASE_URL}${url}`, options);
      const data = await response.json();
      
      const success = validator(response, data);
      if (success) {
        console.log(`✅ ${name} test PASSED.`);
      } else {
        console.error(`❌ ${name} test FAILED.`);
        console.error(`Received Status: ${response.status}`);
        console.error(`Received Body:`, data);
        passed = false;
      }
    } catch (error) {
      console.error(`❌ ${name} test FAILED with exception:`, error.message);
      passed = false;
    }
  };

  try {
    // 1. Test Health Check
    await testEndpoint('Health Check', '/api/health', {}, (res, data) => {
      return res.status === 200 && data.status === 'UP' && data.spotifyConfigured === true;
    });

    // 2. Test Root Endpoint (Serves index.html frontend page)
    try {
      console.log(`\nTesting endpoint: Root Route (GET /)...`);
      const response = await fetch(`${BASE_URL}/`);
      const text = await response.text();
      
      if (response.status === 200 && text.includes('<!DOCTYPE html>')) {
        console.log(`✅ Root Route test PASSED (served static frontend HTML).`);
      } else {
        console.error(`❌ Root Route test FAILED.`);
        console.error(`Received Status: ${response.status}`);
        passed = false;
      }
    } catch (error) {
      console.error(`❌ Root Route test FAILED with exception:`, error.message);
      passed = false;
    }

    // ==========================================================
    // AUTH STATUS TESTS
    // ==========================================================
    
    // 3. Test Auth Status Validation (No Token)
    await testEndpoint('Auth Status (No Token)', '/api/auth/status', {}, (res, data) => {
      return res.status === 200 && data.authorized === false && data.needsAuth === true;
    });

    // 4. Test Auth Status Validation (Raw Mode No Token)
    await testEndpoint('Auth Status (Raw Mode No Token)', '/api/auth/status?raw=true', {}, (res, data) => {
      return res.status === 200 && data === false;
    });

    // 5. Test Auth Status Validation (Invalid Token)
    await testEndpoint('Auth Status (Invalid Token)', '/api/auth/status', {
      headers: { 'Authorization': 'Bearer invalid_jwt_token' }
    }, (res, data) => {
      return res.status === 200 && data.authorized === false && data.needsAuth === true;
    });

    // 6. Test Auth Status Validation (Valid Token)
    await testEndpoint('Auth Status (Valid Token)', '/api/auth/status', {
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && data.authorized === true && data.needsAuth === false;
    });

    // 7. Test Auth Status Validation (Raw Mode Valid Token)
    await testEndpoint('Auth Status (Raw Mode Valid Token)', '/api/auth/status?raw=true', {
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && data === true;
    });

    // ==========================================================
    // SECURED ENDPOINTS - UNAUTHORIZED / FORBIDDEN ACCESS TESTS
    // ==========================================================

    // 8. Test Secured Profile (No Token)
    await testEndpoint('Secured /api/me (No Token)', '/api/me', {}, (res, data) => {
      return res.status === 401 && data.error === 'unauthorized';
    });

    // 9. Test Secured Profile (Invalid Token)
    await testEndpoint('Secured /api/me (Invalid Token)', '/api/me', {
      headers: { 'Authorization': 'Bearer invalid_jwt_token' }
    }, (res, data) => {
      return res.status === 403 && data.error === 'invalid_token';
    });

    // 10. Test Secured Search (No Token)
    await testEndpoint('Secured /api/search (No Token)', '/api/search?q=test', {}, (res, data) => {
      return res.status === 401 && data.error === 'unauthorized';
    });

    // 11. Test Secured Top Artists (No Token)
    await testEndpoint('Secured /api/top-artists (No Token)', '/api/top-artists', {}, (res, data) => {
      return res.status === 401 && data.error === 'unauthorized';
    });

    // 12. Test Secured Top Tracks (No Token)
    await testEndpoint('Secured /api/top-tracks (No Token)', '/api/top-tracks', {}, (res, data) => {
      return res.status === 401 && data.error === 'unauthorized';
    });

    // 13. Test Secured Refresh (No Token)
    await testEndpoint('Secured /api/refresh (No Token)', '/api/refresh', { method: 'POST' }, (res, data) => {
      return res.status === 401 && data.error === 'unauthorized';
    });

    // ==========================================================
    // SECURED ENDPOINTS - AUTHORIZED SUCCESS TESTS
    // ==========================================================

    // 14. Test Secured Profile (Valid Token)
    await testEndpoint('Secured /api/me (Valid Token)', '/api/me', {
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && data.id === 'test_spotify_id' && data.display_name === 'Test User';
    });

    // 15. Test Secured Search (Valid Token)
    await testEndpoint('Secured /api/search (Valid Token)', '/api/search?q=test', {
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && data.tracks && Array.isArray(data.tracks.items);
    });

    // 16. Test Secured Top Artists (Valid Token)
    await testEndpoint('Secured /api/top-artists (Valid Token)', '/api/top-artists', {
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && Array.isArray(data.items);
    });

    // 17. Test Secured Top Tracks (Valid Token)
    await testEndpoint('Secured /api/top-tracks (Valid Token)', '/api/top-tracks', {
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && Array.isArray(data.items);
    });

    // 18. Test Secured Refresh (Valid Token)
    await testEndpoint('Secured /api/refresh (Valid Token)', '/api/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${global.validToken}` }
    }, (res, data) => {
      return res.status === 200 && data.spotifyId === 'test_spotify_id' && data.accessToken === 'dummy_access_token';
    });

    // ==========================================================
    // CALLBACK FLOW SECURITY & CSRF TESTS
    // ==========================================================

    // 19. Test Callback (Missing Code and State)
    await testEndpoint('Callback (No params)', '/api/callback', {}, (res, data) => {
      return res.status === 400 && data.error === 'state_mismatch';
    });

    // 20. Test Callback (State mismatch)
    await testEndpoint('Callback (Mismatched state)', '/api/callback?code=123&state=invalidstate', {}, (res, data) => {
      return res.status === 400 && data.error === 'state_mismatch';
    });

  } finally {
    console.log('\nShutting down backend server...');
    server.kill();
  }

  if (passed) {
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.error('\n⚠️ SOME INTEGRATION TESTS FAILED. ⚠️');
    process.exit(1);
  }
}

runTests();
