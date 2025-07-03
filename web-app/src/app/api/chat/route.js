import { NextResponse } from 'next/server';

// Qwen API configuration - Using direct DashScope API
const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = 'sk-5b8d998434524363936311d878c90a4a';

export async function POST(request) {
  try {
    const { message, conversation_history = [], context = {} } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Enhanced system prompt for medical AI assistant
    let predictionContext = '';
    if (context.predictionDetails) {
      predictionContext = '\n\n---\nPATIENT ANALYSIS CONTEXT (for LLM use only):\n';
      for (const [k, v] of Object.entries(context.predictionDetails)) {
        predictionContext += `- ${k.replace(/_/g, ' ')}: ${v}\n`;
      }
      predictionContext += '\n---\n';
    }
    const systemPrompt = `You are an intelligent medical AI assistant for a dermatology image analysis platform. Your expertise includes:

🔬 MEDICAL EXPERTISE:
- Dermatology and skin lesion analysis (melanoma, basal cell carcinoma, squamous cell carcinoma, benign moles)
- Interpreting AI analysis results and confidence scores
- Explaining medical terminology in accessible language
- Risk assessment and when to seek professional care
- Image quality optimization for better analysis

📊 ANALYSIS SUPPORT:
- Help users understand their skin analysis results
- Explain confidence percentages and what they indicate
- Interpret different types of lesions detected
- Provide context for analysis trends over time
- Guide users on image upload best practices

� GUIDANCE & EDUCATION:
- When to consult a dermatologist or healthcare provider
- Understanding the difference between screening and diagnosis
- Preventive skin care and self-examination techniques
- Explaining the importance of regular skin checks
- UV protection and skin health awareness

⚠️ SAFETY & DISCLAIMERS:
- Always emphasize this is a screening tool, not a diagnostic replacement
- Encourage professional medical consultation for concerning results
- Remind users that AI analysis supplements but doesn't replace medical advice
- For urgent concerns, direct users to immediate medical care

🎯 COMMUNICATION STYLE:
- Be empathetic and supportive, especially for health concerns
- Use clear, accessible language while maintaining medical accuracy
- **KEEP RESPONSES CONCISE AND FOCUSED** - aim for 2-4 sentences unless detailed explanation is specifically requested
- Use bullet points and markdown formatting for better readability
- Provide actionable next steps and practical guidance
- Be encouraging about preventive care and early detection

CONTEXT: User is currently on ${context.current_page || 'the application'} page.
${context.app_type ? `Application type: ${context.app_type}` : ''}
${context.specialization ? `Focus area: ${context.specialization}` : ''}
${predictionContext}

Provide helpful, accurate, and supportive responses while prioritizing user safety and encouraging appropriate medical care. Keep responses brief and to the point.`;

    // Prepare messages for Qwen API (DashScope native format like your AlibabaHackathon project)
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Include conversation history (last 10 messages to avoid token limits)
      ...conversation_history.slice(-10),
      {
        role: 'user',
        content: message
      }
    ];

    // Make request to Qwen API using DashScope native format
    console.log('Making request to Qwen API...');
    console.log('API URL:', QWEN_API_URL);
    console.log('API Key exists:', !!QWEN_API_KEY);
    console.log('API Key prefix:', QWEN_API_KEY.substring(0, 10) + '...');

    // Use DashScope native format for Qwen API
    const requestBody = {
      model: 'qwen-max',
      input: {
        messages: messages
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        result_format: 'message'
      }
    };

    console.log('Making request to Qwen API...');
    console.log('Using model: qwen-max');
    console.log('Message count:', messages.length);

    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Qwen API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      // Provide helpful fallback responses based on the error
      let fallbackMessage = "I'm experiencing some technical difficulties connecting to my knowledge base. ";
      
      if (response.status === 401) {
        fallbackMessage += "There seems to be an authentication issue. ";
      } else if (response.status === 429) {
        fallbackMessage += "I'm currently handling many requests. Please try again in a moment. ";
      } else if (response.status >= 500) {
        fallbackMessage += "The service is temporarily unavailable. ";
      }
      
      fallbackMessage += "For immediate medical concerns, please contact your healthcare provider directly. 🏥\n\nI'll be back to help you with skin analysis questions soon! 🔬";
      
      return NextResponse.json({
        response: fallbackMessage
      });
    }

    const data = await response.json();
    console.log('Qwen API success response received');
    
    // Extract the assistant's response from DashScope format
    let assistantMessage = '';
    
    if (data.output?.text) {
      assistantMessage = data.output.text;
    } else if (data.output?.choices?.[0]?.message?.content) {
      assistantMessage = data.output.choices[0].message.content;
    } else if (data.choices?.[0]?.message?.content) {
      assistantMessage = data.choices[0].message.content;
    } else {
      // Fallback response if parsing fails
      assistantMessage = "I understand you're looking for help with your skin analysis. I'm here to assist with:\n\n🔍 Explaining analysis results and confidence scores\n📊 Understanding different types of skin lesions\n🎯 Guidance on when to see a dermatologist\n📋 Tips for better image quality\n\nPlease feel free to ask me about any specific aspect of your skin health! 🔬";
    }

    // Ensure the response is helpful and not empty
    if (!assistantMessage || assistantMessage.trim().length === 0) {
      assistantMessage = "I'm here to help with your dermatology questions! Feel free to ask me about:\n\n• Understanding your skin analysis results\n• Interpreting confidence scores\n• When to consult a dermatologist\n• Improving image quality for analysis\n• General skin health guidance\n\nWhat would you like to know? 🩺";
    }

    console.log('Returning response of length:', assistantMessage.length);

    return NextResponse.json({
      response: assistantMessage,
      timestamp: new Date().toISOString(),
      model: 'qwen-max'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide contextual error responses
    let errorResponse = "I'm experiencing some technical difficulties. ";
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorResponse += "There seems to be a network connectivity issue. Please check your internet connection and try again. ";
    } else if (error.message.includes('JSON')) {
      errorResponse += "I received an unexpected response format. ";
    } else {
      errorResponse += "An unexpected error occurred. ";
    }
    
    errorResponse += "For immediate medical concerns, please contact your healthcare provider directly. 🏥\n\nI'm here to help when the technical issues are resolved! 🔬";
    
    return NextResponse.json({
      response: errorResponse,
      error: true,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
