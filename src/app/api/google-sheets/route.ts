// app/api/google-sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxk2SAOnG9gzjcIYZG1h4GNsu_PPv1qAjJDrbHujGnZiMJiNAtm0CKLwezy9JOfUMbLEA/exec";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const orgId = searchParams.get('orgId');
  
  try {
    if (!action || !orgId) {
      return NextResponse.json(
        { error: 'Missing action or orgId parameters', success: false },
        { status: 400 }
      );
    }
    
    const url = `${SCRIPT_URL}?action=${encodeURIComponent(action)}&orgId=${encodeURIComponent(orgId)}`;
    
    console.log('🔁 Proxying to Google Script:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache'
    });
    
    console.log('📡 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Raw response length:', responseText.length);
    
    // Check for HTML errors
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('❌ Google Script returned HTML error');
      return NextResponse.json(
        { 
          error: 'Google Apps Script returned error page',
          success: false,
          details: 'Check script deployment and permissions'
        },
        { status: 502 }
      );
    }
    
    // Parse JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON from Google Script');
      return NextResponse.json(data);
    } catch (jsonError) {
      console.error('❌ JSON parse error:', jsonError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from Google Script',
          success: false,
          rawResponse: responseText.substring(0, 200)
        },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error('💥 Proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const orgId = searchParams.get('orgId');
  const groupId = searchParams.get('groupId');
  
  try {
    if (!action || !orgId) {
      return NextResponse.json(
        { error: 'Missing action or orgId parameters', success: false },
        { status: 400 }
      );
    }
    
    let url = `${SCRIPT_URL}?action=${encodeURIComponent(action)}&orgId=${encodeURIComponent(orgId)}`;
    if (groupId) {
      url += `&groupId=${encodeURIComponent(groupId)}`;
    }
    
    const body = await request.json();
    console.log('📤 POST body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `groupData=${encodeURIComponent(JSON.stringify(body))}`
    });
    
    console.log('📡 POST Response status:', response.status);
    
    const responseText = await response.text();
    
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('❌ Google Script returned HTML error for POST');
      return NextResponse.json(
        { 
          error: 'Google Apps Script POST failed',
          success: false
        },
        { status: 502 }
      );
    }
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (jsonError) {
      console.error('❌ POST JSON parse error:', jsonError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from Google Script',
          success: false
        },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error('💥 POST Proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}