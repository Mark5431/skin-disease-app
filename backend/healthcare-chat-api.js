// Healthcare Chat API endpoint - integrates with existing backend
// Add this to your backend API (Node.js/MongoDB)

const express = require('express');
const router = express.Router();

// Healthcare chat endpoint
router.post('/api/healthcare-chat', async (req, res) => {
  try {
    const { prompt, userContext } = req.body;
    const userId = req.user?.id; // From auth middleware

    // Enhanced prompt for medical context
    const medicalPrompt = `${prompt}

Additional Context:
- Focus on skin health and dermatology
- Provide educational, not diagnostic information
- Use empathetic, clear language
- Include relevant preventive care advice
- Mention when to seek professional medical help

Response Guidelines:
- Start with acknowledgment of user's concern
- Provide factual, evidence-based information
- End with appropriate medical disclaimer
- Keep response under 200 words for clarity`;

    // Call your LLM service (adapt to your setup)
    const aiResponse = await callLLMService(medicalPrompt, {
      temperature: 0.7,
      maxTokens: 300,
      systemRole: "healthcare_assistant"
    });

    // Log interaction for analytics
    await logHealthcareInteraction(userId, {
      userMessage: req.body.prompt,
      aiResponse: aiResponse,
      userContext: userContext,
      timestamp: new Date()
    });

    res.json({
      response: aiResponse,
      timestamp: new Date(),
      disclaimer: "This information is for educational purposes only. Consult healthcare professionals for medical advice."
    });

  } catch (error) {
    console.error('Healthcare chat error:', error);
    res.status(500).json({
      response: "I'm experiencing technical difficulties. Please try again later or consult with a healthcare professional for urgent concerns.",
      error: true
    });
  }
});

// Helper function to call LLM service
async function callLLMService(prompt, options = {}) {
  // Replace with your actual LLM integration
  // This could be OpenAI, Anthropic, or your existing Qwen setup
  
  try {
    // Example using fetch to external API
    const response = await fetch('YOUR_LLM_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 300,
        system: options.systemRole || "assistant"
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.response || "I apologize, but I couldn't generate a response right now.";
    
  } catch (error) {
    console.error('LLM service error:', error);
    throw new Error('Failed to get AI response');
  }
}

// Log healthcare interactions for analytics
async function logHealthcareInteraction(userId, interaction) {
  try {
    // Add to your existing logging system
    const logEntry = {
      userId: userId,
      type: 'healthcare_chat',
      ...interaction,
      createdAt: new Date()
    };
    
    // Save to your database
    await logSystemAction('healthcare_interaction', logEntry);
    
  } catch (error) {
    console.error('Failed to log healthcare interaction:', error);
    // Don't throw - logging failure shouldn't break the chat
  }
}

module.exports = router;
