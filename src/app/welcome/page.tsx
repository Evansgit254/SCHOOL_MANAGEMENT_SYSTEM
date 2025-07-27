'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useEffect } from 'react';

export default function WelcomePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  const role = String(user?.publicMetadata?.role || 'user');
  const dashboardPath = `/${role}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
        <Image
          src={user.imageUrl || '/noAvatar.png'}
          alt="Profile"
          width={80}
          height={80}
          className="rounded-full border"
        />
        <h1 className="text-2xl font-bold">Welcome, {user.firstName || user.username || 'User'}!</h1>
        <p className="text-gray-600">Role: <span className="font-semibold capitalize">{role}</span></p>
        <div className="flex gap-4 mt-4">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            onClick={() => router.push(dashboardPath)}
          >
            Continue to Dashboard
          </button>
          <button
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            onClick={async () => {
              await signOut();
              router.replace('/sign-in');
            }}
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
} 