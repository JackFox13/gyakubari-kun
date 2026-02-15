module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { horses, betType, mode, raceInfo } = req.body;

    // APIキーの確認
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return res.status(500).json({ 
        error: 'API key not configured',
        details: 'Vercelの環境変数にANTHROPIC_API_KEYを設定してください'
      });
    }

    console.log('Calling Claude API...');

    // Claude APIを使って予想
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `あなたは競馬予想のプロです。以下のレース情報から、${betType}の買い目を予想してください。

レース情報:
- レース名: ${raceInfo.raceName}
- 開催地: ${raceInfo.location}
- 距離: ${raceInfo.distance}m
- 馬場: ${raceInfo.trackType}

出走馬:
${horses.map(h => `${h.number}番 ${h.name} (${h.jockey}) オッズ${h.odds}倍`).join('\n')}

モード: ${mode === 'gyakubari' ? '大穴狙い（高配当重視、波乱予想）' : '堅実（的中重視、本命中心）'}
賭け方: ${betType}

以下の形式でJSON形式で3つの買い目を提案してください:
[
  {
    "title": "買い目名",
    "horses": [馬番の配列],
    "confidence": 的中率(1-100),
    "expectedReturn": 期待回収率(100-5000),
    "reasoning": "予想の根拠（150文字以内）"
  }
]

重要な分析ポイント:
1. オッズだけでなく、騎手の実力、馬場適性、距離適性を考慮
2. ${mode === 'gyakubari' ? '人気薄の伏兵を積極的に評価し、波乱を予想' : '実力馬を中心に堅実な組み合わせ'}
3. 賭け方(${betType})に最適な買い目を提案
4. 具体的な根拠を示す

JSON形式のみで回答してください（説明文は不要）。`
        }]
      })
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return res.status(response.status).json({ 
        error: 'AI API failed',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('API response received');
    
    const content = data.content[0].text;
    console.log('AI response:', content.substring(0, 200));
    
    // JSONを抽出
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return res.status(500).json({ 
        error: 'Invalid AI response format',
        details: content.substring(0, 500)
      });
    }

    const predictions = JSON.parse(jsonMatch[0]);
    console.log('Predictions parsed:', predictions.length);
    
    return res.status(200).json({ predictions });
  } catch (error) {
    console.error('Predict error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};
