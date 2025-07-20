import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const user = await clerkClient.users.getUser(userId);
  const role = user?.publicMetadata?.role;

  let redirectUrl = '/';
  if (role === 'admin' || role === 'teacher' || role === 'student' || role === 'parent') {
    redirectUrl = `/${role}`;
  }

  return NextResponse.redirect(new URL(redirectUrl, req.url));
} 