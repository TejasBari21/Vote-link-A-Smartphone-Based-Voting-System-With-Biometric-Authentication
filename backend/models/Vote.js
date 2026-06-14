const mongoose = require('mongoose');
const crypto = require('crypto');

const voteSchema = new mongoose.Schema({
  voterID: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  electionId: {
    type: String,
    required: false,
    index: true,
    default: 'default_election'
  },
  // Only hashes are stored — plaintext candidate/party data never touches the DB
  candidateIdHash: {
    type: String,
    required: true
  },
  candidateNameHash: {
    type: String,
    required: true
  },
  partyNameHash: {
    type: String,
    required: true
  },
  region: {
    state: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    constituency: {
      type: String,
      required: true
    }
  },
  blockchainTxHash: {
    type: String,
    required: false,
    index: true
  },
  blockchainBlockNumber: {
    type: Number,
    required: false
  },
  blockchainConfirmed: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  deviceInfo: {
    type: String,
    required: false
  },
  votedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Utility: deterministic SHA-256 hash for vote confidentiality
voteSchema.statics.hashField = function (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
};

// Compound index to prevent duplicate votes per election by email
voteSchema.index({ userEmail: 1, electionId: 1 }, { unique: true });

// Compound index to prevent duplicate votes per election by Voter ID.
// Sparse so it only applies to documents where voterID is set and not 'NOT_SET'.
// This is the primary guard that blocks the same voter ID from voting twice,
// even if different email/phone accounts are used.
voteSchema.index(
  { voterID: 1, electionId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      voterID: { $exists: true, $nin: ['NOT_SET', ''] }
    }
  }
);

// Index for analytics
voteSchema.index({ 'region.constituency': 1, votedAt: -1 });
voteSchema.index({ candidateIdHash: 1 });

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
