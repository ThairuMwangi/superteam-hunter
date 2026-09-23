const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.SUPERTEAM_BASE_URL || 'https://superteam.fun';
const API_KEY = process.env.SUPERTEAM_API_KEY;
const CLAIM_CODE = process.env.SUPERTEAM_CLAIM_CODE;
const POLL_INTERVAL = (parseInt(process.env.POLL_INTERVAL_SECONDS, 10) || 300) * 1000;

const PROCESSED_LISTINGS_FILE = path.join(__dirname, 'processed_listings.json');

// Helper to load already seen listings
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

// Helper to save processed listings
function saveProcessedListings(list) {
  fs.writeFileSync(PROCESSED_LISTINGS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// Log with timestamp
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/**
 * Sends a heartbeat to Superteam API
 */
async function sendHeartbeat() {
  try {
    const res = await axios.get(`${BASE_URL}/heartbeat.md`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 10000,
    });
    log(`💓 Heartbeat synced.`);
  } catch (err) {
    // heartbeat ping
  }
}

/**
 * Checks for live agent-eligible listings
 */
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

        // Save record to alerts directory
        const alertDir = path.join(__dirname, 'alerts');
        if (!fs.existsSync(alertDir)) fs.mkdirSync(alertDir, { recursive: true });

        const alertFile = path.join(alertDir, `${id}.json`);
        fs.writeFileSync(alertFile, JSON.stringify(listing, null, 2), 'utf-8');
        log(`📁 Bounty details saved to: alerts/${id}.json`);

        processed.push(id);
        saveProcessedListings(processed);
      }
    }
  } catch (error) {
    log(`⚠️ Polling error: ${error.message}`);
  }
}

async function main() {
  log(`🚀 Starting Superteam Autonomous Hunter Daemon...`);
  log(`🔑 Agent ID: ${process.env.SUPERTEAM_AGENT_ID}`);
  log(`💰 Payout Claim Code: ${CLAIM_CODE}`);
  log(`⏱️ Polling interval: ${POLL_INTERVAL / 1000}s`);

  // Initial Run
  await sendHeartbeat();
  await pollAgentListings();

  // Scheduled Loop
  setInterval(async () => {
    await sendHeartbeat();
    await pollAgentListings();
  }, POLL_INTERVAL);
}

main();
