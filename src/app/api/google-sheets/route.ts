// app/api/google-sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOTu8hPKWlPq88i5w6_pGyQtigdakPKnI-vk5oMHiY5TWcSRc7vGAqgF9j-x-uI3eMaQ/exec";

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
    
    // Get the body as text first to handle both JSON and form data
    const bodyText = await request.text();
    console.log('📤 POST raw body:', bodyText);
    
    let requestBody = '';
    
    // Check if the content type is form data
    if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      // Parse URL-encoded form data
      const params = new URLSearchParams(bodyText);
      
      // Handle different data parameters based on action
      if (action === 'saveHistory') {
        const historyData = params.get('historyData');
        console.log('📤 Parsed form data - historyData:', historyData);
        requestBody = historyData ? `historyData=${encodeURIComponent(historyData)}` : '';
      } else {
        // Default to groupData for other actions (saveGroup, updateGroup, etc.)
        const groupData = params.get('groupData');
        console.log('📤 Parsed form data - groupData:', groupData);
        requestBody = groupData ? `groupData=${encodeURIComponent(groupData)}` : '';
      }
    } else {
      // Assume JSON - determine parameter name based on action
      if (action === 'saveHistory') {
        requestBody = `historyData=${encodeURIComponent(bodyText)}`;
      } else {
        requestBody = `groupData=${encodeURIComponent(bodyText)}`;
      }
    }
    
    console.log('🔁 Proxying POST to:', url);
    console.log('📤 Final request body length:', requestBody.length);
    console.log('📤 Final request body preview:', requestBody.substring(0, 200) + '...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    });
    
    console.log('📡 POST Response status:', response.status);
    console.log('📡 POST Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('📄 POST Raw response length:', responseText.length);
    console.log('📄 POST Raw response preview:', responseText.substring(0, 200) + '...');
    
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
      console.log('✅ POST Successfully parsed JSON response from Google Script');
      return NextResponse.json(data);
    } catch (jsonError) {
      console.error('❌ POST JSON parse error:', jsonError);
      console.error('❌ Raw response that failed to parse:', responseText);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from Google Script',
          success: false,
          rawResponse: responseText.substring(0, 500)
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