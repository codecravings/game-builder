import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const port = 3003

// Enable CORS for all routes
app.use(cors())
app.use(express.json())

// DeepSeek API proxy endpoint
app.post('/api/deepseek', async (req, res) => {
  try {
    const { prompt, maxTokens = 3000, temperature = 0.7 } = req.body
    
    console.log('🤖 Proxying request to DeepSeek API...')
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key-here'}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ DeepSeek API response received')
    
    res.json(data)
    
  } catch (error) {
    console.error('❌ DeepSeek API error:', error)
    res.status(500).json({ 
      error: 'Failed to call DeepSeek API', 
      details: error.message 
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`🚀 AI Game Engine Backend running on http://localhost:${port}`)
  console.log(`🔗 Frontend should be on http://localhost:3001`)
  console.log(`🤖 DeepSeek API proxy available at /api/deepseek`)
})