import { NextResponse } from 'next/server';

const nodeApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const adminToken = url.searchParams.get('admin_token');

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin token is required' },
        { status: 401 }
      );
    }

    console.log('📈 Fetching feedback analytics for admin dashboard');

    const response = await fetch(`${nodeApiBase}/api/feedback/analytics?admin_token=${adminToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend analytics API error:', response.status, errorText);
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Successfully fetched feedback analytics');

    return NextResponse.json({
      success: true,
      analytics: data.analytics
    });

  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback analytics'
    }, { status: 500 });
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
