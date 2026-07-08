const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String
  },
  email: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
