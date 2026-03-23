import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Capture referral code from URL and store in cookie
  const ref = request.nextUrl.searchParams.get('ref');
  if (ref && /^[a-f0-9]{8}$/i.test(ref)) {
    response.cookies.set('ref_code', ref, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      httpOnly: false, // Needs to be readable by client JS at signup
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
