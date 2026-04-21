export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    return res.status(200).json({ reply: 'Configuration error. Ask your teacher! 😊' });
  }

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
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.8
    }
  };

  if (systemPrompt) {
    requestBody.system_instruction = {
      parts: [{ text: String(systemPrompt) }]
    };
  }

  console.log('Calling Gemini with', contents.length, 'messages');

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );

  const text = await geminiRes.text();
  console.log('Gemini raw response:', text.slice(0, 300));

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return res.status(200).json({ reply: 'Wow, great answer! 🌟 Tell me more!' });
  }

  if (data.error) {
    console.error('Gemini error:', data.error.message);
    return res.status(200).json({ reply: 'Amazing! Keep going! 😊' });
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Great answer! 🌟';

  console.log('Reply:', reply.slice(0, 100));
  return res.status(200).json({ reply });
}
