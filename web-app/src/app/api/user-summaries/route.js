import { NextResponse } from 'next/server';

const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const summaryId = url.searchParams.get('summaryId');
    const limit = url.searchParams.get('limit') || '5';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching LLM summaries for user: ${userId}`);

    let apiUrl;
    if (summaryId) {
      // Get specific summary
      apiUrl = `${nodeApiBase}/api/llm-summaries/${summaryId}`;
    } else {
      // Get user's recent summaries from the llm_summaries collection directly
      apiUrl = `${nodeApiBase}/api/llm-summaries/user/${userId}?limit=${limit}`;
    }

    const response = await fetch(apiUrl, {
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
    
    console.log(`✅ Successfully fetched ${data.summaries?.length || 1} LLM summaries`);

    return NextResponse.json({
      success: true,
      summaries: data.summaries || [data.summary],
      totalCount: data.totalCount || 1
    });

  } catch (error) {
    console.error('Error fetching LLM summaries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch LLM summaries',
      summaries: []
    });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
