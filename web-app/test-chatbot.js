// Quick test script for the chatbot functionality
// Run this in the browser console to test the API

async function testChatbot() {
  console.log('🤖 Testing Chatbot API...');
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me understand confidence scores?',
        conversation_history: [],
        context: {
          app_type: 'medical_image_analysis',
          current_page: '/dashboard',
          specialization: 'dermatology_ai_assistant'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Chatbot Response:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Chatbot Test Failed:', error);
    return null;
  }
}

// Run the test
console.log('Call testChatbot() to test the API functionality');

// Export for potential use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testChatbot };
}
