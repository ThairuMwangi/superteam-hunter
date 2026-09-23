const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

const BASE_URL = process.env.SUPERTEAM_BASE_URL || 'https://superteam.fun';
const API_KEY = process.env.SUPERTEAM_API_KEY;
const CLAIM_CODE = process.env.SUPERTEAM_CLAIM_CODE;
const POLL_INTERVAL = (parseInt(process.env.POLL_INTERVAL_SECONDS, 10) || 300) * 1000;
const PORT = process.env.PORT || 3000;

const PROCESSED_LISTINGS_FILE = path.join(__dirname, 'processed_listings.json');

function loadProcessedListings() {
  if (fs.existsSync(PROCESSED_LISTINGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROCESSED_LISTINGS_FILE, 'utf-8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveProcessedListings(list) {
  try {
    fs.writeFileSync(PROCESSED_LISTINGS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving processed listings:', e.message);
  }
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function sendHeartbeat() {
  try {
    await axios.get(`${BASE_URL}/heartbeat.md`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 10000,
    });
    log(`💓 Heartbeat synced.`);
  } catch (err) {
    // heartbeat ping
  }
}

async function pollAgentListings() {
  try {
    log(`🔍 Checking Superteam API for AGENT_ALLOWED & AGENT_ONLY listings...`);
    const res = await axios.get(`${BASE_URL}/api/agents/listings/live?take=30`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 15000,
    });

    const listings = Array.isArray(res.data) ? res.data : [];
    log(`📊 Found ${listings.length} agent-eligible listing(s).`);

    const processed = loadProcessedListings();

    for (const listing of listings) {
      const id = listing.id || listing.slug;
      if (!processed.includes(id)) {
        log(`\n🚨 NEW BOUNTY DETECTED!`);
        log(`📌 Title: ${listing.title}`);
        log(`💰 Reward: ${listing.reward || 'N/A'} ${listing.token || 'USDC'}`);
        log(`🔗 Slug: ${listing.slug}`);
        log(`⏳ Deadline: ${listing.deadline || 'N/A'}`);

        processed.push(id);
        saveProcessedListings(processed);
      }
    }
  } catch (error) {
    log(`⚠️ Polling error: ${error.message}`);
  }
}

// Minimal HTTP server so Railway health checks pass 100%
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ONLINE',
    agent: 'antigravity-thairu',
    lastSync: new Date().toISOString(),
  }));
});

server.listen(PORT, async () => {
  log(`🚀 Superteam Autonomous Hunter Daemon is ACTIVE on port ${PORT}...`);
  log(`🔑 Agent ID: ${process.env.SUPERTEAM_AGENT_ID || '1fea7a38-0256-40d9-be55-e931d848d114'}`);
  log(`💰 Payout Claim Code: ${CLAIM_CODE || 'E1CF16F9DC6F72337C844845'}`);
  log(`⏱️ Polling interval: ${POLL_INTERVAL / 1000}s`);

  // Initial Run
  await sendHeartbeat();
  await pollAgentListings();

  // Scheduled Poller
  setInterval(async () => {
    await sendHeartbeat();
    await pollAgentListings();
  }, POLL_INTERVAL);
});
