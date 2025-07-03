import { NextResponse } from 'next/server';

const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function POST(request) {
  try {
    const { summaryId, userId, feedbackType, usefulnessScore, userComment, imageId } = await request.json();

    if (!summaryId || !userId || !feedbackType) {
      return NextResponse.json(
        { error: 'Summary ID, User ID, and feedback type are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Submitting feedback for LLM summary: ${summaryId}`);

    // Submit feedback to backend
    const response = await fetch(`${nodeApiBase}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary_id: summaryId,
        user_id: userId,
        image_id: imageId,
        feedback_type: feedbackType,
        usefulness_score: usefulnessScore,
        user_comment: userComment,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend feedback API error:', response.status, errorText);
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Feedback submitted successfully');

    return NextResponse.json({
      success: true,
      feedbackId: data.feedbackId,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit feedback'
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const summaryId = url.searchParams.get('summaryId');
    const feedbackType = url.searchParams.get('feedbackType');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching feedback for user: ${userId}`);

    let apiUrl = `${nodeApiBase}/api/feedback?user_id=${userId}`;
    if (summaryId) apiUrl += `&summary_id=${summaryId}`;
    if (feedbackType) apiUrl += `&feedback_type=${feedbackType}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend feedback API error:', response.status, errorText);
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Successfully fetched ${data.feedback?.length || 0} feedback entries`);

    return NextResponse.json({
      success: true,
      feedback: data.feedback || [],
      totalCount: data.totalCount || 0
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback',
      feedback: []
    });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
