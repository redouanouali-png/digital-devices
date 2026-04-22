export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ reply: 'Hi! 🌟' });

  const { messages, systemPrompt } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(200).json({ reply: 'Hi! What would you like to learn? 🌟' });
  }

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }]
  }));

  const requestBody = {
    contents,
    generationConfig: { maxOutputTokens: 80, temperature: 0.7 }
  };

  if (systemPrompt) {
    requestBody.system_instruction = { parts: [{ text: String(systemPrompt) }] };
  }

  // Try models in order
  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      const text = await response.text();
      console.log(`${model} → ${response.status}: ${text.slice(0, 150)}`);

      if (!response.ok) continue;

      const data = JSON.parse(text);
      if (data.error) continue;

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return res.status(200).json({ reply: reply.trim() });

    } catch (e) {
      console.error(model, e.message);
      continue;
    }
  }

  return res.status(200).json({ reply: 'Great answer! 🌟' });
}
