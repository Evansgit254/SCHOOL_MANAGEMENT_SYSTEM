import { NextRequest, NextResponse } from 'next/server';
import { initSentry, captureError } from '@/lib/telemetry';
initSentry();

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get('stripe-signature');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) return NextResponse.json({ ok: true });
    // Lazy load stripe to avoid bundling always
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

    switch (event.type) {
      case 'checkout.session.completed':
        // TODO: mark subscription active
        break;
      case 'customer.subscription.deleted':
        // TODO: mark subscription inactive
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    captureError(error, { route: 'POST /api/stripe/webhook' });
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}

export const runtime = 'nodejs';

