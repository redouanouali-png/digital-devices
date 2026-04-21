export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ reply: 'API key missing' });

  const { messages, systemPrompt } = req.body || {};
  if (!messages) return res.status(400).json({ reply: 'No messages' });

  const contents = messages.map(function(m) {
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    };
  });

  const body = {
    contents: contents,
    generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
  };
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] };

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );
    const data = await response.json();
    if (data.error) return res.status(200).json({ reply: 'Great try! Keep going! 🌟' });
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Great answer! 🌟';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: 'Great try! 🌟' });
  }
}
