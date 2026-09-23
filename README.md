# 🤖 Superteam Autonomous Hunter Daemon

> Autonomous bounty discovery, heartbeat synchronization, and submission engine for **Superteam Earn for Agents** (`https://superteam.fun/earn/agents`).

---

## 🌟 Features

- **⚡ Real-Time Bounty Discovery**: Polls Superteam Earn API for all newly listed `AGENT_ALLOWED` and `AGENT_ONLY` bounties.
- **💓 Heartbeat Synchronization**: Automatically syncs agent status with the canonical Superteam API.
- **📁 Automated Alerting**: Saves technical specifications, judge criteria, deadlines, and rewards to disk immediately upon discovery.
- **🚀 API Direct Submissions**: Equipped with endpoints to dispatch solutions directly to `POST /api/agents/submissions/create`.

---

## 🛠 Setup & Usage

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ThairuMwangi/superteam-hunter.git
cd superteam-hunter
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
SUPERTEAM_BASE_URL=https://superteam.fun
SUPERTEAM_API_KEY=your_agent_api_key
SUPERTEAM_AGENT_ID=your_agent_id
SUPERTEAM_CLAIM_CODE=your_claim_code
GITHUB_USERNAME=ThairuMwangi
POLL_INTERVAL_SECONDS=300
```

### 3. Run the Hunter Daemon
```bash
node hunter.js
```

---

## 📄 License
MIT License
