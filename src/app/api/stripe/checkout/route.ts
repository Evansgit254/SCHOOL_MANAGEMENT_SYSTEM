import { NextRequest, NextResponse } from 'next/server';
import { initSentry, captureError } from '@/lib/telemetry';
import { auth, clerkClient } from '@clerk/nextjs/server';
initSentry();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const priceId = process.env.STRIPE_PRICE_ID;
    const secret = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    if (!priceId || !secret) return NextResponse.json({ error: 'Billing not configured' }, { status: 400 });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });
    // Create or reuse Stripe customer and store id in Clerk metadata
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    let customerId = (user.publicMetadata as any)?.stripeCustomerId as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses?.[0]?.emailAddress,
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        metadata: { userId },
      });
      customerId = customer.id;
      await client.users.updateUser(userId, { publicMetadata: { ...user.publicMetadata, stripeCustomerId: customerId } });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      customer: customerId,
      metadata: { userId },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    captureError(error, { route: 'POST /api/stripe/checkout' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

