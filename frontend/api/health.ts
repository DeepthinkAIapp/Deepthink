import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Ollama is available
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemma:7b', messages: [{ role: 'user', content: 'test' }] })
    });

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ollama: ollamaResponse.ok ? 'healthy' : 'unhealthy'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 