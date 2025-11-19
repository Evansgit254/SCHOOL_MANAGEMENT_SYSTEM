import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user?.publicMetadata?.role;

  let redirectUrl = '/';
  if (role === 'admin' || role === 'teacher' || role === 'student' || role === 'parent') {
    redirectUrl = `/${role}`;
  }

  return NextResponse.redirect(new URL(redirectUrl, req.url));
} 