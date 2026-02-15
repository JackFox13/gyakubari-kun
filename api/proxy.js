module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || !url.includes('netkeiba.com')) {
    return res.status(400).json({ error: 'Invalid URL', details: 'URL must contain netkeiba.com' });
  }

  try {
    console.log('Fetching URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch from netkeiba', 
        status: response.status,
        statusText: response.statusText
      });
    }

    const html = await response.text();
    console.log('HTML length:', html.length);

    if (html.length < 1000) {
      return res.status(500).json({ 
        error: 'Response too short', 
        length: html.length,
        preview: html.substring(0, 200)
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch',
      message: error.message,
      stack: error.stack
    });
  }
};
