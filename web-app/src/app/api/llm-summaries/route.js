import { NextResponse } from 'next/server';

const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const timeRange = url.searchParams.get('timeRange') || '30d';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`� Loading summaries for user: ${userId} (limit: ${limit}, timeRange: ${timeRange})`);

    // Call the Node.js backend API to get user summaries
    const response = await fetch(`${nodeApiBase}/api/llm-summaries?userId=${userId}&limit=${limit}&timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.summaries) {
      console.log('No summaries returned from backend, generating default response');
      return NextResponse.json({
        summaries: [],
        insights: generateInsights([]),
        trends: generateTrends([]),
        personalizedActions: getDefaultPersonalizedActions(),
        totalCount: 0
      });
    }

    console.log(`✅ Successfully fetched ${data.summaries.length} summaries`);

    // Generate insights and trends from the summaries
    const insights = generateInsights(data.summaries);
    const trends = generateTrends(data.summaries);
    const personalizedActions = generatePersonalizedActions(data.summaries, insights);

    return NextResponse.json({
      summaries: data.summaries,
      insights,
      trends,
      personalizedActions,
      totalCount: data.totalCount || data.summaries.length
    });

  } catch (error) {
    console.error('Error fetching user summaries:', error);
    return NextResponse.json({
      summaries: [],
      insights: generateInsights([]),
      trends: generateTrends([]),
      personalizedActions: getDefaultPersonalizedActions(),
      totalCount: 0,
      error: 'Failed to fetch summaries'
    });
  }
}

// Helper function to generate insights from summaries
function generateInsights(summaries) {
  if (!summaries || summaries.length === 0) {
    return {
      riskLevel: 'unknown',
      totalAnalyses: 0,
      averageConfidence: 0,
      riskTrend: 'stable',
      lastAnalysisDate: null
    };
  }

  const totalAnalyses = summaries.length;
  const averageConfidence = summaries.reduce((sum, s) => sum + (s.confidence_scores || 0), 0) / totalAnalyses;
  
  // Count risk categories
  const riskCounts = summaries.reduce((counts, summary) => {
    const prediction = summary.predicted_class?.toLowerCase() || '';
    if (prediction.includes('benign') || prediction.includes('nevus')) {
      counts.benign++;
    } else if (prediction.includes('malignant') || prediction.includes('melanoma')) {
      counts.malignant++;
    } else {
      counts.uncertain++;
    }
    return counts;
  }, { benign: 0, malignant: 0, uncertain: 0 });

  // Determine overall risk level
  let riskLevel = 'low';
  if (riskCounts.malignant > 0) {
    riskLevel = 'high';
  } else if (riskCounts.uncertain > riskCounts.benign * 0.3) {
    riskLevel = 'moderate';
  }

  return {
    riskLevel,
    totalAnalyses,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    riskTrend: calculateRiskTrend(summaries),
    lastAnalysisDate: summaries[0]?.upload_timestamp || null,
    riskDistribution: riskCounts
  };
}

// Helper function to analyze trends
function analyzeTrends(summaries) {
  if (!summaries || summaries.length < 2) {
    return {
      confidenceTrend: 'stable',
      frequencyTrend: 'stable',
      recommendations: ['Continue regular monitoring']
    };
  }

  // Sort by date (newest first)
  const sorted = summaries.sort((a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp));
  
  // Analyze confidence trend
  const recentConfidence = sorted.slice(0, 3).reduce((sum, s) => sum + (s.confidence_scores || 0), 0) / Math.min(3, sorted.length);
  const olderConfidence = sorted.slice(-3).reduce((sum, s) => sum + (s.confidence_scores || 0), 0) / Math.min(3, sorted.slice(-3).length);
  
  let confidenceTrend = 'stable';
  if (recentConfidence > olderConfidence + 5) {
    confidenceTrend = 'improving';
  } else if (recentConfidence < olderConfidence - 5) {
    confidenceTrend = 'declining';
  }

  // Analyze frequency (uploads per month)
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentUploads = summaries.filter(s => new Date(s.upload_timestamp) > monthAgo).length;
  
  let frequencyTrend = 'stable';
  if (recentUploads >= 4) {
    frequencyTrend = 'increasing';
  } else if (recentUploads <= 1) {
    frequencyTrend = 'decreasing';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(sorted, confidenceTrend, frequencyTrend);

  return {
    confidenceTrend,
    frequencyTrend,
    recentConfidence: Math.round(recentConfidence * 100) / 100,
    averageMonthlyUploads: recentUploads,
    recommendations
  };
}

// Helper function to calculate risk trend
function calculateRiskTrend(summaries) {
  if (summaries.length < 3) return 'stable';
  
  const recent = summaries.slice(0, Math.floor(summaries.length / 2));
  const older = summaries.slice(Math.floor(summaries.length / 2));
  
  const recentHighRisk = recent.filter(s => 
    s.predicted_class?.toLowerCase().includes('malignant') || 
    s.predicted_class?.toLowerCase().includes('melanoma')
  ).length;
  
  const olderHighRisk = older.filter(s => 
    s.predicted_class?.toLowerCase().includes('malignant') || 
    s.predicted_class?.toLowerCase().includes('melanoma')
  ).length;
  
  if (recentHighRisk > olderHighRisk) return 'increasing';
  if (recentHighRisk < olderHighRisk) return 'decreasing';
  return 'stable';
}

// Helper function to generate personalized quick actions
function generatePersonalizedActions(summaries) {
  const defaultActions = [
    { text: "🔍 How to take better photos", query: "Quick tips for taking better skin lesion photos?", priority: 1 },
    { text: "📊 Understanding confidence scores", query: "What do confidence scores mean in 2-3 sentences?", priority: 1 },
    { text: "⚠️ When to see a doctor", query: "When should I see a dermatologist? Brief answer please.", priority: 1 },
    { text: "🎯 Types of skin lesions", query: "What skin lesion types can AI detect? Short list please.", priority: 1 }
  ];

  if (!summaries || summaries.length === 0) {
    return defaultActions;
  }

  const personalizedActions = [...defaultActions];
  
  // Add personalized actions based on history
  if (summaries.length >= 3) {
    personalizedActions.push({
      text: "📈 My analysis trends",
      query: `Based on my ${summaries.length} recent analyses, what trends do you see?`,
      priority: 2
    });
  }

  if (hasMultipleBenignResults(summaries)) {
    personalizedActions.push({
      text: "🎯 Prevention tips",
      query: "Since my results have been mostly benign, what prevention tips can you give me?",
      priority: 2
    });
  }

  if (hasRecentHighRiskResults(summaries)) {
    personalizedActions.push({
      text: "🏥 Next steps for high-risk results",
      query: "I had some concerning results recently. What should I do next?",
      priority: 3
    });
  }

  if (hasInconsistentResults(summaries)) {
    personalizedActions.push({
      text: "🔄 Why different results?",
      query: "Why am I getting different confidence scores for similar lesions?",
      priority: 2
    });
  }

  // Sort by priority (higher priority first)
  return personalizedActions.sort((a, b) => b.priority - a.priority);
}

// Helper functions for pattern detection
function hasMultipleBenignResults(summaries) {
  const benignCount = summaries.filter(s => 
    s.predicted_class?.toLowerCase().includes('benign') || 
    s.predicted_class?.toLowerCase().includes('nevus')
  ).length;
  return benignCount >= 3;
}

function hasRecentHighRiskResults(summaries) {
  const recent = summaries.slice(0, 3);
  return recent.some(s => 
    s.predicted_class?.toLowerCase().includes('malignant') || 
    s.predicted_class?.toLowerCase().includes('melanoma') ||
    (s.confidence_scores && s.confidence_scores < 70)
  );
}

function hasInconsistentResults(summaries) {
  if (summaries.length < 3) return false;
  
  const confidences = summaries.map(s => s.confidence_scores || 0);
  const variance = calculateVariance(confidences);
  return variance > 400; // High variance in confidence scores
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}

// Missing helper functions
function generateTrends(summaries) {
  return analyzeTrends(summaries);
}

function getDefaultPersonalizedActions() {
  return [
    { text: "🔍 How to take better photos", query: "Quick tips for taking better skin lesion photos?", priority: 1 },
    { text: "📊 Understanding confidence scores", query: "What do confidence scores mean in 2-3 sentences?", priority: 1 },
    { text: "⚠️ When to see a doctor", query: "When should I see a dermatologist? Brief answer please.", priority: 1 },
    { text: "🎯 Types of skin lesions", query: "What skin lesion types can AI detect? Short list please.", priority: 1 }
  ];
}

function generateRecommendations(summaries, confidenceTrend, frequencyTrend) {
  const recommendations = [];
  
  if (confidenceTrend === 'declining') {
    recommendations.push('Consider improving photo quality for better analysis');
  }
  
  if (frequencyTrend === 'increasing') {
    recommendations.push('Regular monitoring is good - keep tracking changes');
  } else if (frequencyTrend === 'decreasing') {
    recommendations.push('Consider more frequent self-examinations');
  }
  
  if (summaries.length > 0 && hasRecentHighRiskResults(summaries)) {
    recommendations.push('Consult a dermatologist for professional evaluation');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue regular monitoring and maintain good skin health');
  }
  
  return recommendations;
}
