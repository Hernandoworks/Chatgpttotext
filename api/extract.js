const cheerio = require('cheerio');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { url } = req.body;

  if (!url || !/^https:\/\/(chat\.openai\.com|chatgpt\.com)\/share\//.test(url)) {
    return res.status(400).json({ error: 'Please provide a valid ChatGPT share URL (chat.openai.com/share/... or chatgpt.com/share/...)' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch share page (HTTP ${response.status})`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const messages = [];

    $('[data-message-author-role]').each((_, el) => {
      const role = $(el).attr('data-message-author-role');
      const textEl = $(el).find('.markdown').length
        ? $(el).find('.markdown')
        : $(el).find('.whitespace-pre-wrap');
      const text = textEl.text().trim();
      if (text && role) messages.push({ role, text });
    });

    if (messages.length === 0) {
      return res.status(404).json({
        error: "No messages found. The link may be private, expired, or ChatGPT's page structure may have changed."
      });
    }

    const plainText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}:\n${m.text}`)
      .join('\n\n---\n\n');

    return res.status(200).json({ text: plainText, messageCount: messages.length });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}