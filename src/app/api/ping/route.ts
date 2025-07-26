import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.google.com/generate_204', { method: 'GET', cache: 'no-store' });
    if (res.status === 204) return NextResponse.json({ online: true });
    if (res.status === 200) return NextResponse.json({ online: true }); // Google sometimes returns 200
  } catch {}
  return NextResponse.json({ online: false });
}
