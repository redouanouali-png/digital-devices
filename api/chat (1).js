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

  const defaultPrompt = 'You are Noura, a friendly AI guide for children age 6-7 in Morocco. Max 2 SHORT sentences. Use 1 emoji. Simple English only. If the child answers CORRECTLY about digital devices celebrate loudly! If WRONG encourage gently with a small hint. Only discuss digital devices. Never negative.';

  const requestBody = {
    contents,
    generationConfig: { maxOutputTokens: 100, temperature: 0.8 },
    system_instruction: { parts: [{ text: systemPrompt || defaultPrompt }] }
  };

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
      if (!response.ok) continue;
      const data = JSON.parse(text);
      if (data.error) continue;
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return res.status(200).json({ reply: reply.trim() });
    } catch (e) {
      continue;
    }
  }

  return res.status(200).json({ reply: 'Great answer! 🌟' });
}
