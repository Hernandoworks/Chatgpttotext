const cheerio = require('cheerio');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let url;
  try {
    const body = JSON.parse(event.body);
    url = body.url;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!url || !url.includes('chat.openai.com/share/')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ChatGPT share link' }) };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const messages = [];

    $('[data-message-author-role]').each((i, el) => {
      const role = $(el).attr('data-message-author-role');
      const textEl = $(el).find('.markdown, .whitespace-pre-wrap');
      const text = textEl.text().trim();
      if (text && role) messages.push({ role, text });
    });

    if (messages.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No messages found. ChatGPT may have changed its structure.' }) };
    }

    let plainText = '';
    for (const msg of messages) {
      plainText += `${msg.role === 'user' ? 'User' : 'Assistant'}:\n${msg.text}\n\n`;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: plainText, messageCount: messages.length })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};