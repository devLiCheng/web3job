import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Load .env from parent directory if present (monorepo root setup)
const parentEnvPath = join(process.cwd(), '../.env')
if (existsSync(parentEnvPath)) {
  const envContent = readFileSync(parentEnvPath, 'utf8')
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=')
      if (index > -1) {
        const key = trimmed.substring(0, index).trim()
        const val = trimmed.substring(index + 1).trim()
        if (key && val) {
          process.env[key] = val
        }
      }
    }
  })
}

import { runCrawler, getCrawlLogs } from './crawler'

const app = new Hono()

// CORS setup
app.use('*', cors())

// Simple API status health check (reading from backend database)
app.get('/api/spider/status', async (c) => {
  try {
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:6002/api'
    const response = await fetch(`${backendApiUrl}/crawl-records?limit=1`)
    let count = 0
    if (response.ok) {
      const data = await response.json()
      count = data.pagination?.total || data.records?.length || 0
    }
    return c.json({
      active: true,
      engine: 'DeepSeek-V4-Pro',
      logsCount: count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      active: true,
      engine: 'DeepSeek-V4-Pro',
      logsCount: 0,
      timestamp: new Date().toISOString()
    })
  }
})

// Trigger spider run
app.post('/api/spider/run', async (c) => {
  try {
    const { url, limit } = await c.req.json()
    if (!url) {
      return c.json({ success: false, error: 'URL target is required' }, 400)
    }
    const limitVal = parseInt(limit, 10) || 5

    // Trigger asynchronously so the client doesn't time out
    runCrawler(url, limitVal)
      .then(() => console.log(`[Spider] Finished run on target: ${url} (limit: ${limitVal})`))
      .catch((err) => console.error(`[Spider] Crashed running crawl:`, err))

    return c.json({
      success: true,
      message: 'Crawler initialized in the background.',
      target: url,
      limit: limitVal
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Fetch metrics & execution records (Unified from backend MySQL database)
app.get('/api/spider/logs', async (c) => {
  try {
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:6002/api'
    const response = await fetch(`${backendApiUrl}/crawl-records?limit=50`)
    if (response.ok) {
      const data = await response.json()
      // Map database records to the shape expected by the frontend cockpit UI
      const mappedLogs = (data.records || []).map((r: any) => ({
        timestamp: r.created_at || r.timestamp || new Date().toISOString(),
        url: r.url,
        status: r.status,
        extractedCount: r.extracted_count !== undefined ? r.extracted_count : r.extractedCount || 0,
        error: r.error_message || r.error
      }))
      return c.json({
        success: true,
        logs: mappedLogs
      })
    } else {
      throw new Error('Failed to fetch records from backend')
    }
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
      logs: []
    })
  }
})

// Serve inline GUI for spider controls (Ultra clean, responsive dark-mode cockpit)
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RemoteWeb3 Scraper Cockpit</title>
  <style>
    :root {
      --bg: #090a0f;
      --card: #12131a;
      --border: #222533;
      --text: #f1f5f9;
      --text-muted: #64748b;
      --accent: #00f2fe;
      --accent-purple: #7f00ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 2rem;
    }
    .container {
      max-width: 950px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-info h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(2, 180px);
      gap: 1rem;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      text-align: right;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent);
    }
    .panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .panel h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-group {
      display: flex;
      gap: 1rem;
    }
    input {
      flex: 1;
      background: #1a1c27;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.8rem 1rem;
      color: #fff;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: var(--accent);
    }
    button {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%);
      color: #000;
      font-weight: 700;
      border: none;
      padding: 0.8rem 1.8rem;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.98); }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
      text-align: left;
    }
    th, td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    th { color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .badge-failed { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-info">
        <h1>🕷️ RemoteWeb3 AI Scraper Cockpit</h1>
        <p style="color: var(--text-muted);">Trigger targeted crawls and parse structured listing schemas utilizing DeepSeek V4 Pro.</p>
      </div>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">Engine</div>
          <div class="stat-value" style="font-size: 0.95rem; color: #fff;">DeepSeek Chat</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Runs (DB)</div>
          <div class="stat-value" id="totalLogsVal">...</div>
        </div>
      </div>
    </header>

    <section class="panel">
      <h2>Launch New Scrape Task</h2>
      <div class="form-group" style="display: flex; gap: 1rem;">
        <input type="text" id="targetUrl" placeholder="Enter target remote job URL (e.g. blockchain-jobs.com/post-1)" value="https://example.com/web3-solidity-developer-job" style="flex: 3;">
        <input type="number" id="targetLimit" placeholder="Limit" value="5" min="1" max="50" style="flex: 1; max-width: 100px; background: #1a1c27; border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem 1rem; color: #fff; font-size: 1rem; outline: none;">
        <button onclick="triggerScrape()">Launch Scrape</button>
      </div>
    </section>

    <section class="panel">
      <h2>Unified Crawl & AI Extraction Logs (MySQL)</h2>
      <div id="logsContainer">Loading records...</div>
    </section>
  </div>

  <script>
    async function loadLogs() {
      try {
        // Fetch stats
        const statusRes = await fetch('/api/spider/status');
        const statusData = await statusRes.json();
        if (statusData.active) {
          document.getElementById('totalLogsVal').innerText = statusData.logsCount;
        }

        // Fetch logs
        const res = await fetch('/api/spider/logs');
        const data = await res.json();
        if (data.success && data.logs) {
          if (data.logs.length === 0) {
            document.getElementById('logsContainer').innerHTML = '<p style="color: var(--text-muted)">No recent crawler actions found in database.</p>';
            return;
          }
          
          let html = '<table><thead><tr><th>Time</th><th>Target URL</th><th>Status</th><th>Jobs Extracted</th></tr></thead><tbody>';
          data.logs.forEach(log => {
            let badgeClass = 'badge-pending';
            if (log.status === 'SUCCESS') badgeClass = 'badge-success';
            if (log.status === 'FAILED') badgeClass = 'badge-failed';
            
            let errorHtml = '';
            if (log.status === 'FAILED' && log.error) {
              errorHtml = '<div style="font-size: 0.8rem; color: #ef4444; margin-top: 0.25rem;">Error: ' + log.error + '</div>';
            }
            
            const formattedTime = new Date(log.timestamp).toLocaleString();
            
            html += \`<tr>
              <td>\${formattedTime}</td>
              <td style="word-break: break-all;">
                <div>\${log.url}</div>
                \${errorHtml}
              </td>
              <td><span class="badge \${badgeClass}">\${log.status}</span></td>
              <td>\${log.extractedCount || 0} items</td>
            </tr>\`;
          });
          html += '</tbody></table>';
          document.getElementById('logsContainer').innerHTML = html;
        }
      } catch (err) {
        document.getElementById('logsContainer').innerHTML = 'Failed to fetch logs: ' + err.message;
      }
    }

    async function triggerScrape() {
      const url = document.getElementById('targetUrl').value;
      const limit = document.getElementById('targetLimit').value;
      if (!url) return alert('Please enter a target URL');
      try {
        const res = await fetch('/api/spider/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, limit: parseInt(limit, 10) || 5 })
        });
        const data = await res.json();
        if (data.success) {
          alert('Crawler launched successfully in background!');
          setTimeout(loadLogs, 1000);
        } else {
          alert('Failed to launch: ' + data.error);
        }
      } catch (err) {
        alert('Error initiating: ' + err.message);
      }
    }

    // Refresh metrics on mount and every 5 seconds
    loadLogs();
    setInterval(loadLogs, 5000);
  </script>
</body>
</html>
  `)
})

// Start Crawler Service
const port = parseInt(process.env.PORT || '6004', 10)
console.log(`🕷️ Spider Service running on port ${port}`)

export default {
  port,
  fetch: app.fetch
}
