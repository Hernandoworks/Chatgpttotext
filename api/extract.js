<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChatGPT Share → Text</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #f7f7f8;
      color: #1a1a2e;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .card {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2rem;
      width: 100%;
      max-width: 760px;
    }

    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    p.sub { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }

    label { font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 4px; }

    input[type="text"] {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
      outline: none;
      transition: border 0.2s;
    }
    input[type="text"]:focus { border-color: #10a37f; }

    .row { display: flex; gap: 10px; margin-bottom: 1rem; }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s, opacity 0.2s;
    }

    #extractBtn {
      background: #10a37f;
      color: #fff;
      flex: 1;
    }
    #extractBtn:hover { background: #0d8f6e; }
    #extractBtn:disabled { opacity: 0.6; cursor: not-allowed; }

    #copyBtn {
      background: #f0f0f0;
      color: #333;
    }
    #copyBtn:hover { background: #e0e0e0; }

    #error {
      color: #d9534f;
      font-size: 0.88rem;
      min-height: 1.2em;
      margin-bottom: 0.5rem;
    }

    .meta {
      font-size: 0.82rem;
      color: #888;
      margin-bottom: 6px;
    }

    textarea {
      width: 100%;
      height: 380px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.88rem;
      resize: vertical;
      background: #fafafa;
      outline: none;
    }

    #copySuccess {
      font-size: 0.82rem;
      color: #10a37f;
      margin-top: 6px;
      min-height: 1.2em;
    }

    footer {
      margin-top: 1.5rem;
      font-size: 0.78rem;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧠 ChatGPT & DeepSeek Share → Plain Text</h1>
    <p class="sub">Paste a ChatGPT or DeepSeek share link to extract the full conversation as plain text.</p>

    <label for="url">Share Link</label>
          <input type="text" id="url" placeholder="https://chatgpt.com/share/... or https://chat.deepseek.com/a/chat/s/..." />

    <div id="error"></div>

    <div class="row">
      <button id="extractBtn">Extract Conversation</button>
      <button id="copyBtn">Copy Text</button>
    </div>

    <div class="meta" id="meta"></div>
    <textarea id="output" readonly placeholder="Extracted conversation will appear here…"></textarea>
    <div id="copySuccess"></div>
  </div>

  <footer>Powered by a Netlify serverless function · No data stored</footer>

  <script>
    const urlInput   = document.getElementById('url');
    const extractBtn = document.getElementById('extractBtn');
    const copyBtn    = document.getElementById('copyBtn');
    const outputArea = document.getElementById('output');
    const errorDiv   = document.getElementById('error');
    const metaDiv    = document.getElementById('meta');
    const copyMsg    = document.getElementById('copySuccess');

    extractBtn.addEventListener('click', async () => {
      const shareUrl = urlInput.value.trim();
      if (!shareUrl) { errorDiv.textContent = 'Please enter a share link.'; return; }

      errorDiv.textContent = '';
      metaDiv.textContent  = '';
      outputArea.value     = '';
      copyMsg.textContent  = '';
      extractBtn.disabled  = true;
      extractBtn.textContent = 'Extracting…';

      try {
        const res  = await fetch('/api/extract', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ url: shareUrl })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unknown error');
        outputArea.value    = data.text;
        metaDiv.textContent = `✅ ${data.messageCount} message${data.messageCount !== 1 ? 's' : ''} extracted`;
      } catch (err) {
        errorDiv.textContent = `Error: ${err.message}`;
      } finally {
        extractBtn.disabled    = false;
        extractBtn.textContent = 'Extract Conversation';
      }
    });

    copyBtn.addEventListener('click', async () => {
      if (!outputArea.value) return;
      try {
        await navigator.clipboard.writeText(outputArea.value);
        copyMsg.textContent = '✅ Copied to clipboard!';
        setTimeout(() => copyMsg.textContent = '', 2500);
      } catch {
        outputArea.select();
        document.execCommand('copy');
        copyMsg.textContent = '✅ Copied!';
      }
    });
  </script>
</body>
</html>