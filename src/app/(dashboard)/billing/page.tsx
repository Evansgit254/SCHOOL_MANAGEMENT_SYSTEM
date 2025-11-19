import React from 'react';

async function createCheckout() {
  'use server';
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/stripe/checkout`, { method: 'POST' });
  const data = await res.json();
  if (data.url) {
    return data.url as string;
  }
  return '';
}

const BillingPage = async () => {
  return (
    <div className="bg-white p-4 rounded-lg m-4">
      <h1 className="text-lg font-semibold mb-4">Billing</h1>
      <p className="text-gray-600 mb-6">Upgrade your school to unlock premium features.</p>
      <form action={async () => {
        const url = await createCheckout();
        if (url) {
          // Client redirect via meta fallback
        }
      }}>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md">Upgrade</button>
      </form>
      <noscript>
        <p>After clicking Upgrade, you&apos;ll be redirected to Stripe.</p>
      </noscript>
    </div>
  );
};

export default BillingPage;

