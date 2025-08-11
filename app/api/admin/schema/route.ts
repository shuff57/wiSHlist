import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Schema endpoint available" 
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Schema update endpoint available" 
  });
}
