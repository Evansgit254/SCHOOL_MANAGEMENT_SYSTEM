'use client';

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.7 }
  })
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } }
};

const featureVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + 0.15 * i, duration: 0.7 }
  })
};

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.replace('/api/role-redirect');
    }
  }, [isLoaded, isSignedIn]);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center overflow-auto">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-16 pb-8 px-4">
        {/* === CHANGE 1: Main Logo === */}
        <motion.div
          className="w-24 h-24 mb-4 drop-shadow-lg"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <Image
            src="/logo.png"
            alt="School Management Logo"
            width={96}
            height={96}
            priority // Add priority to preload this important LCP image
          />
        </motion.div>
        <motion.h1
          className="text-5xl font-extrabold text-blue-800 text-center drop-shadow-sm"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          School Management System
        </motion.h1>
        <motion.p
          className="text-xl text-gray-700 text-center max-w-2xl mt-4 mb-2"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          A modern, role-based platform for managing students, teachers, parents, classes, assignments, messaging, and more.
        </motion.p>
        <motion.p
          className="text-md text-gray-500 text-center max-w-xl mb-4"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          Built with Next.js, Prisma, and Tailwind CSS.
        </motion.p>
      </section>
      {/* Sign-in Form Section */}
      <section className="w-full flex justify-center items-center mb-12 px-4">
        <AnimatePresence>
          <motion.div
            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 flex flex-col items-center w-full max-w-md border border-blue-100"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {!isLoaded ? (
              <div className="text-blue-600 font-semibold">Loading authentication...</div>
            ) : isSignedIn ? (
              <div className="text-blue-600 font-semibold">Redirecting to your dashboard...</div>
            ) : (
              <SignIn.Root>
                <SignIn.Step name='start' className='flex flex-col gap-4 w-full'>
                  <h2 className='text-2xl font-bold flex items-center gap-2 justify-center mb-2'>
                    {/* === CHANGE 2: Sign-in Logo === */}
                    <Image src='/logo.png' alt='' width={28} height={28} />
                    Welcome Back
                  </h2>
                  <h3 className='text-gray-500 text-center mb-2'>Sign in to your account</h3>
                  <Clerk.GlobalError className='text-sm text-red-400 mb-2'/>
                  <Clerk.Field name="identifier" className='flex flex-col gap-1'>
                    <Clerk.Label className='text-sm text-gray-500'>Username</Clerk.Label>
                    <Clerk.Input type='text' required className='p-2 rounded-md ring-1 ring-gray-300 focus:ring-blue-400 focus:outline-none' />
                    <Clerk.FieldError className='text-xs text-red-400'/> 
                  </Clerk.Field>
                  <Clerk.Field name="password" className='flex flex-col gap-1'>
                    <Clerk.Label  className='text-sm text-gray-500' >Password</Clerk.Label >
                    <Clerk.Input type='password' required className='p-2 rounded-md ring-1 ring-gray-300 focus:ring-blue-400 focus:outline-none'/>
                    <Clerk.FieldError className='text-xs text-red-400'/> 
                  </Clerk.Field>
                  <SignIn.Action submit className='bg-blue-600 hover:bg-blue-700 transition text-white mt-2 rounded-md text-base p-2 font-semibold shadow'>Sign In</SignIn.Action>
                </SignIn.Step>
              </SignIn.Root>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
      {/* Features Section ... (rest of the code is unchanged and correct) ... */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-8">
        <motion.h2
          className="text-3xl font-bold text-gray-800 mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Key Features
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {[
            {
              icon: "👥",
              title: "Role-Based Access",
              desc: "Separate dashboards and permissions for Admin, Teacher, Student, and Parent.",
              color: "bg-blue-50",
              delay: 0.6,
            },
            {
              icon: "📚",
              title: "Assignments & Exams",
              desc: "Create, manage, and track assignments and exams with deadlines and grading.",
              color: "bg-purple-50",
              delay: 0.7,
            },
            {
              icon: "💬",
              title: "Messaging",
              desc: "Secure, role-aware messaging between students, teachers, parents, and admins.",
              color: "bg-yellow-50",
              delay: 0.8,
            },
            {
              icon: "📈",
              title: "Analytics & Attendance",
              desc: "Track attendance, results, and key metrics with beautiful charts and dashboards.",
              color: "bg-green-50",
              delay: 0.9,
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              className={`${f.color} rounded-2xl p-6 flex flex-col items-center shadow-md border border-gray-100 cursor-pointer transition-transform`}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(80,80,200,0.10)' }}
              custom={i + 1}
            >
              <span className="text-4xl mb-2">{f.icon}</span>
              <h3 className="font-semibold text-lg mt-1 mb-1 text-blue-800">{f.title}</h3>
              <p className="text-base text-gray-600 text-center">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <footer className="mt-6 text-xs text-gray-400 text-center w-full pb-4">
        © {new Date().getFullYear()} School Management System. All rights reserved.
      </footer>
    </main>
  );
}