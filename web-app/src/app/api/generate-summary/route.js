import { NextResponse } from 'next/server';
import OpenAI from "openai";

// Initialize OpenAI client with DashScope compatibility
const openai = new OpenAI({
  apiKey: "sk-5b8d998434524363936311d878c90a4a",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function POST(request) {
  try {
    const { mlResults, userId, uploadId } = await request.json();

    if (!mlResults || !userId) {
      return NextResponse.json(
        { error: 'ML results and user ID are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Generating LLM summary for ML results:', { uploadId, userId });

    // Create a much more comprehensive prompt for the LLM to analyze ML results and provide a detailed, actionable summary
    // --- Confidence extraction logic (mirroring TimelineChart) ---
    let confidence = 0;
    if (typeof mlResults.confidence_score === 'number') {
      confidence = mlResults.confidence_score;
    } else if (
      mlResults.confidence_scores &&
      typeof mlResults.confidence_scores === 'object' &&
      mlResults.confidence_scores.confidence_scores &&
      typeof mlResults.confidence_scores.confidence_scores === 'object'
    ) {
      const vals = Object.values(mlResults.confidence_scores.confidence_scores)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      if (vals.length > 0) confidence = Math.max(...vals);
    }

    // --- Improved prompt for LLM ---
    const analysisPrompt = `You are a medical AI assistant specializing in dermatology. Given the following ML model results, generate a comprehensive, step-by-step action plan for the patient. Your response must be in JSON format and should be clear, supportive, and actionable for a non-expert user. In the summary, use markdown-style bullet points for the action plan (e.g., \n- Step 1: ...). If possible, also use markdown for any lists or warnings.

**ML Model Results:**
- Predicted Class: ${mlResults.predicted_class}
- Confidence Score: ${confidence ? confidence.toFixed(2) : 'Not available'}%
- Image Quality: ${mlResults.image_quality || 'Good'}
- Processing Time: ${mlResults.processing_time || 'N/A'}
- Model Version: ${mlResults.model_version || 'v1.0'}

**Required JSON Response Format:**
{
  "summary": "A clear, friendly explanation of what this result means for the patient, including a brief description of the lesion type and the confidence score. Explain what the confidence score means for the user.",
  "key_findings": ["Key finding 1", "Key finding 2", "..."],
  "step_by_step_action_plan": [
    "Step 1: Immediate action the user should take (e.g., monitor, consult a doctor, take a new photo in X weeks)",
    "Step 2: What to do next (e.g., schedule a dermatologist visit, re-upload if changes are noticed)",
    "Step 3: Ongoing monitoring advice (e.g., what changes to watch for: size, color, border, symptoms)",
    "Step 4: When to seek urgent medical attention (list warning signs)",
    "Step 5: Reassurance and positive factors (e.g., high confidence, benign features)"
  ],
  "interpretation": {
    "risk_level": "low|moderate|high",
    "confidence_assessment": "What the confidence score indicates in simple terms, and how certain the model is."
  },
  "recommendations": {
    "immediate_actions": ["Action 1", "Action 2"],
    "follow_up": "When and how to follow up (e.g., see a doctor, re-upload image)",
    "monitoring": "How to monitor this lesion going forward"
  },
  "context": {
    "lesion_type_explanation": "Simple explanation of the detected lesion type",
    "what_to_watch_for": ["Warning sign 1", "Warning sign 2"],
    "reassurance_factors": ["Positive aspect 1", "Positive aspect 2"]
  },
  "medical_disclaimer": "This is a screening tool, not diagnostic. Always consult healthcare providers for medical decisions."
}

**Instructions:**
- Use bullet points or numbered steps for the action plan.
- Make the language user-friendly and supportive.
- Avoid medical jargon or explain it simply.
- Be specific about when to seek medical help and what to watch for.
- Highlight any positive/reassuring factors if present.
- Explain the confidence score in a way that is meaningful for the user (e.g., what does 96% mean for them?).

Respond only with the JSON object, no extra text.`;

    try {
      // Generate summary using Qwen
      const completion = await openai.chat.completions.create({
        model: "qwen-turbo",
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specializing in dermatology. Provide accurate, helpful analysis of skin lesion results in the exact JSON format requested.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent medical analysis
        max_tokens: 800,
        top_p: 0.9,
      });

      const llmResponse = completion.choices?.[0]?.message?.content;
      
      if (!llmResponse) {
        throw new Error('No response from LLM');
      }

      // Parse the JSON response from LLM
      let parsedSummary;
      try {
        parsedSummary = JSON.parse(llmResponse);
      } catch (parseError) {
        console.error('Failed to parse LLM JSON response:', parseError);
        // Fallback to basic summary if JSON parsing fails
        parsedSummary = createFallbackSummary(mlResults);
      }

      // Prepare the summary document for MongoDB
      const summaryDocument = {
        userId,
        uploadId,
        originalResults: mlResults,
        llmSummary: parsedSummary,
        generatedAt: new Date().toISOString(),
        modelUsed: 'qwen-turbo',
        version: '1.0'
      };

      // Store the summary in MongoDB via backend API
      const response = await fetch(`${nodeApiBase}/api/llm-summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summaryDocument),
      });

      if (!response.ok) {
        console.error('Failed to store summary in MongoDB:', response.status);
        // Continue anyway - we still have the summary
      }

      console.log('✅ Successfully generated and stored LLM summary');

      return NextResponse.json({
        success: true,
        summary: parsedSummary,
        storedInDatabase: response.ok
      });

    } catch (llmError) {
      console.error('Error generating LLM summary:', llmError);
      
      // Generate fallback summary
      const fallbackSummary = createFallbackSummary(mlResults);
      
      return NextResponse.json({
        success: true,
        summary: fallbackSummary,
        fallback: true,
        error: 'Used fallback summary due to LLM error'
      });
    }

  } catch (error) {
    console.error('Error in generate-summary API:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary', details: error.message },
      { status: 500 }
    );
  }
}

// Fallback summary generation when LLM fails
function createFallbackSummary(mlResults) {
  // Try to extract the correct confidence for the detected lesion type
  let confidence = 0;
  if (
    mlResults.confidence_scores &&
    typeof mlResults.confidence_scores === 'object' &&
    mlResults.confidence_scores.lesion_type &&
    mlResults.confidence_scores.confidence_scores &&
    typeof mlResults.confidence_scores.confidence_scores === 'object'
  ) {
    const lesionLabel = mlResults.confidence_scores.lesion_type;
    const scoresObj = mlResults.confidence_scores.confidence_scores;
    if (scoresObj[lesionLabel] !== undefined) {
      confidence = scoresObj[lesionLabel];
    }
  }
  // Fallback to confidence_score if above not found
  if (!confidence && typeof mlResults.confidence_score === 'number') {
    confidence = mlResults.confidence_score;
  } else if (!confidence && mlResults.confidence_score) {
    confidence = parseFloat(mlResults.confidence_score) || 0;
  }

  const prediction = mlResults.predicted_class?.toLowerCase() || 'unknown';

  let riskLevel = 'moderate';
  let summary = '';

  // Use full lesion type name if available
  const lesionType = (
    mlResults.confidence_scores &&
    typeof mlResults.confidence_scores === 'object' &&
    mlResults.confidence_scores.lesion_type
  ) ? mlResults.confidence_scores.lesion_type : mlResults.predicted_class;

  if (prediction.includes('benign') || prediction.includes('nevus')) {
    riskLevel = 'low';
    summary = `The analysis suggests this is a benign (non-cancerous) lesion (${lesionType}) with a high confidence of ${confidence.toFixed(2)}%. Benign lesions are generally not dangerous, but regular self-monitoring is recommended. If you notice any changes in size, color, or shape, consult a dermatologist.`;
  } else if (prediction.includes('malignant') || prediction.includes('melanoma')) {
    riskLevel = 'high';
    summary = `The analysis detected features suggestive of a potentially malignant lesion (${lesionType}), with a confidence of ${confidence.toFixed(2)}%. It is important to consult a dermatologist for further evaluation as soon as possible.`;
  } else {
    summary = `The analysis provided a ${confidence.toFixed(2)}% confidence assessment for the detected lesion type: ${lesionType}. Please consult a healthcare professional for a more detailed evaluation and next steps.`;
  }

  return {
    summary,
    interpretation: {
      risk_level: riskLevel,
      confidence_assessment: `${confidence.toFixed(2)}% confidence indicates ${confidence > 80 ? 'high' : confidence > 60 ? 'moderate' : 'lower'} certainty in the analysis.`,
      key_findings: [`Detected: ${lesionType}`, `Confidence: ${confidence.toFixed(2)}%`]
    },
    recommendations: {
      immediate_actions: riskLevel === 'high' ?
        ['Schedule appointment with dermatologist', 'Monitor for changes'] :
        ['Continue regular self-examination', 'Take note of any changes'],
      follow_up: riskLevel === 'high' ?
        'Consult a dermatologist within 1-2 weeks' :
        'Regular dermatology check-ups as recommended',
      monitoring: 'Check monthly for size, color, or shape changes'
    },
    context: {
      lesion_type_explanation: `This appears to be classified as: ${mlResults.predicted_class}`,
      what_to_watch_for: ['Changes in size', 'Changes in color', 'Irregular borders', 'Unusual symptoms'],
      reassurance_factors: confidence > 70 ? 
        ['High confidence analysis', 'Clear imaging quality'] : 
        ['Analysis completed successfully']
    },
    medical_disclaimer: 'This is a screening tool, not diagnostic. Always consult healthcare providers for medical decisions.'
  };
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
