// Healthcare Knowledge Base for Skin Conditions
// Add this to your project as a utility file

export const skinConditionKnowledge = {
  // Benign conditions
  benign: {
    generalInfo: "Benign skin lesions are non-cancerous growths that do not spread to other parts of the body. While they are typically harmless, it's still important to monitor them for changes.",
    commonTypes: [
      "Melanocytic nevi (moles)",
      "Seborrheic keratoses", 
      "Dermatofibromas",
      "Cherry angiomas"
    ],
    monitoring: [
      "Check monthly for changes in size, color, or shape",
      "Look for asymmetry, irregular borders, or color variation",
      "Note any bleeding, itching, or pain",
      "Take photos to track changes over time"
    ],
    whenToSeeDoctor: [
      "Any sudden changes in appearance",
      "Bleeding or ulceration",
      "Rapid growth",
      "Unusual itching or pain",
      "New lesions appearing frequently"
    ]
  },

  // Malignant conditions  
  malignant: {
    generalInfo: "Malignant skin lesions are cancerous growths that can spread to other parts of the body if left untreated. Early detection and treatment are crucial for the best outcomes.",
    types: [
      "Melanoma - most serious form of skin cancer",
      "Basal cell carcinoma - most common skin cancer",
      "Squamous cell carcinoma - second most common"
    ],
    urgency: "If malignancy is suspected, it's important to see a dermatologist as soon as possible, ideally within 1-2 weeks.",
    treatment: "Treatment options may include surgical removal, radiation therapy, or other specialized treatments depending on the type and stage.",
    prognosis: "When caught early, most skin cancers have excellent cure rates. The key is early detection and prompt treatment."
  },

  // General skin health
  prevention: {
    sunProtection: [
      "Use broad-spectrum SPF 30+ sunscreen daily",
      "Seek shade during peak sun hours (10am-4pm)",
      "Wear protective clothing and wide-brimmed hats", 
      "Use UV-blocking sunglasses",
      "Avoid tanning beds completely"
    ],
    selfExams: [
      "Perform monthly self-examinations",
      "Use the ABCDE method: Asymmetry, Border, Color, Diameter, Evolving",
      "Check all areas including scalp, between toes, and genital areas",
      "Use mirrors or ask a partner to help check hard-to-see areas"
    ],
    riskFactors: [
      "Fair skin, light hair, and light eyes",
      "History of sunburns or excessive sun exposure",
      "Family history of skin cancer",
      "Many moles or unusual moles",
      "Weakened immune system"
    ]
  },

  // Emergency signs
  emergencySigns: [
    "Rapidly changing lesion",
    "Bleeding that won't stop",
    "Large, irregular, multi-colored lesions",
    "Lesions that look very different from others",
    "Sores that don't heal within 2-3 weeks"
  ],

  // Reassurance and support
  emotional: {
    anxiety: "It's completely normal to feel anxious about skin changes. Remember that most skin lesions are benign, and even when they're not, early detection leads to excellent outcomes.",
    support: "Consider joining support groups or speaking with a counselor if skin health concerns are causing significant stress.",
    empowerment: "Regular self-exams and professional check-ups put you in control of your skin health."
  },

  // Chronic condition monitoring
  chronicMonitoring: {
    trackingFrequency: {
      benign: "Monthly self-examinations with photos",
      suspicious: "Weekly monitoring with detailed documentation", 
      postTreatment: "Follow physician's schedule (typically every 3-6 months)"
    },
    progressionSigns: [
      "Increase in size (>2mm growth)",
      "Color changes or new colors appearing",
      "Shape becoming more irregular",
      "Surface texture changes",
      "Development of symptoms (itching, bleeding, pain)"
    ],
    documentationTips: [
      "Use consistent lighting and camera distance",
      "Include a ruler or coin for size reference",
      "Take photos from multiple angles",
      "Note any symptoms or sensations",
      "Record environmental factors (sun exposure, medications)"
    ],
    riskAssessment: {
      stable: "No significant changes over 6+ months",
      watchful: "Minor changes that require closer monitoring",
      concerning: "Changes meeting any progression criteria",
      urgent: "Rapid changes or new symptoms requiring immediate attention"
    }
  },

  // Timeline analysis
  timelineAnalysis: {
    stabilityIndicators: [
      "Consistent size measurements",
      "Stable color patterns", 
      "Regular shape maintenance",
      "No new symptoms"
    ],
    concerningTrends: [
      "Progressive size increase",
      "Color intensification or new colors",
      "Irregular border development",
      "Symptom onset or worsening"
    ],
    analysisRecommendations: {
      stable: "Continue current monitoring schedule",
      gradual: "Increase monitoring frequency and consider dermatologist consultation",
      rapid: "Seek immediate medical evaluation"
    }
  }
};

// Helper function to get relevant information based on prediction
export function getConditionInfo(predictionType, confidence) {
  const info = {
    type: predictionType?.toLowerCase(),
    confidence: confidence,
    isHighConfidence: confidence > 80,
    isMediumConfidence: confidence >= 60 && confidence <= 80,
    isLowConfidence: confidence < 60
  };

  if (predictionType?.toLowerCase().includes('benign')) {
    info.category = 'benign';
    info.knowledgeBase = skinConditionKnowledge.benign;
  } else if (predictionType?.toLowerCase().includes('malignant')) {
    info.category = 'malignant'; 
    info.knowledgeBase = skinConditionKnowledge.malignant;
  }

  return info;
}

// Generate contextual responses
export function generateContextualResponse(userQuestion, predictionInfo) {
  const responses = {
    whatDoesThisMean: {
      benign: `Your analysis suggests a benign (non-cancerous) lesion with ${predictionInfo.confidence}% confidence. ${skinConditionKnowledge.benign.generalInfo}`,
      malignant: `Your analysis indicates a potential malignant lesion with ${predictionInfo.confidence}% confidence. ${skinConditionKnowledge.malignant.generalInfo} ${skinConditionKnowledge.malignant.urgency}`
    },
    whatShouldIDo: {
      benign: `For benign lesions: ${skinConditionKnowledge.benign.monitoring.join(', ')}. See a doctor if: ${skinConditionKnowledge.benign.whenToSeeDoctor.slice(0,2).join(', ')}.`,
      malignant: `For suspected malignant lesions: ${skinConditionKnowledge.malignant.urgency} Professional evaluation and potential biopsy are essential for definitive diagnosis.`
    },
    howWorried: {
      benign: predictionInfo.isHighConfidence 
        ? "With high confidence for a benign result, this is reassuring. Continue monitoring as recommended."
        : "While the prediction suggests benign, the confidence level means professional evaluation would be wise for peace of mind.",
      malignant: "Any suspicion of malignancy warrants prompt medical attention. Remember that early detection leads to excellent treatment outcomes."
    }
  };

  return responses;
}

export default skinConditionKnowledge;
