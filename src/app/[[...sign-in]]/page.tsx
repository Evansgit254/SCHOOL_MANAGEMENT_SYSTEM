'use client'

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'

import React from 'react'

const LoginPage = () => {
  return (
    <div className='h-screen flex items-center justify-center bg-lamaSkyLight'>
        <SignIn.Root>
            <SignIn.Step name='start' className='bg-white p-12 rounded-md shadow-2xl flex flex-col gap-2 '>
                <h1>Shool Dashboard</h1>
                <h2>Sign in to your account</h2>
            <Clerk.GlobalError/>
            <Clerk.Field name="identifier">
                <Clerk.Label>Username</Clerk.Label>
                <Clerk.Input type='text' required />
            </Clerk.Field>
            </SignIn.Step>
        </SignIn.Root>
    </div>
  )
}

export default LoginPage