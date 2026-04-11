import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
    }

    try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: { 'User-Agent': 'kingslive-ctroom-monitor' }
        }).catch(() => 
            // Fallback to GET if HEAD fails
            fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'User-Agent': 'kingslive-ctroom-monitor' }
            })
        );

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // Check SSL certificate validity (basic check via URL protocol)
        const isHttps = url.startsWith('https://');
        
        return NextResponse.json({
            isOnline: response.ok,
            statusCode: response.status,
            responseTime,
            lastChecked: new Date().toISOString(),
            sslValid: isHttps ? true : undefined, // Simplified - real SSL check would need cert inspection
            protocol: isHttps ? 'https' : 'http'
        });
    } catch (err: any) {
        // Domain is offline or unreachable
        return NextResponse.json({
            isOnline: false,
            statusCode: 0,
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            error: err.message || 'Failed to reach domain'
        });
    }
}
