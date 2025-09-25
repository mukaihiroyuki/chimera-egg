import { NextResponse } from 'next/server';

export async function GET() {
    const credentialsVar = process.env.GOOGLE_CREDENTIALS_JSON;
    
    return NextResponse.json({
        message: "Environment Variable Check",
        isSet: !!credentialsVar,
        length: credentialsVar ? credentialsVar.length : 0,
        startsWith: credentialsVar ? credentialsVar.substring(0, 30) : null,
        endsWith: credentialsVar ? credentialsVar.substring(credentialsVar.length - 30) : null,
    });
}