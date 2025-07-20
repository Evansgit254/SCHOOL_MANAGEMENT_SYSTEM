'use client'

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import Image from 'next/image'
import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

const LoginPage = () => {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    console.log('Sign-in page: isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
    if (isLoaded && isSignedIn) {
      window.location.replace('/api/role-redirect');
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <div>Loading Clerk authentication...</div>;
  }

  if (isSignedIn) {
    return <div>Redirecting to your dashboard...</div>;
  }

  return (
    <div className='h-screen flex items-center justify-center bg-lamaSkyLight'>
      <SignIn.Root afterSignInUrl="/welcome">
        <SignIn.Step name='start' className='bg-white p-12 rounded-md shadow-2xl flex flex-col gap-2 '>
          <h1 className='text-xl font-bold flex items-center gap-2 '>
            <Image src='/logo.png' alt='' width={24} height={24} />
            School Dasboard
          </h1>
          <h2 className='text-gray-400'>Sign in to your account</h2>
          <Clerk.GlobalError className='text-sm text-red-400'/>
          <Clerk.Field name="identifier" className='flex flex-col gap-2'>
            <Clerk.Label className='text-sm text-gray-500'>Username</Clerk.Label>
            <Clerk.Input type='text' required className='p-2 rounded-md ring-1 ring-gray-300' />
            <Clerk.FieldError className='text-sm text-red-400'/> 
          </Clerk.Field>
          <Clerk.Field name="password" className='flex flex-col gap-2'>
            <Clerk.Label  className='text-sm text-gray-500' >Password</Clerk.Label >
            <Clerk.Input type='password' required className='p-2 rounded-md ring-1 ring-gray-300'/>
            <Clerk.FieldError className='text-sm text-red-400'/> 
          </Clerk.Field>
          <SignIn.Action submit className='bg-blue-500 text-white my-1 rounded-md text-sm p-[10px]'>Sign In</SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  )
}

export default LoginPage; 