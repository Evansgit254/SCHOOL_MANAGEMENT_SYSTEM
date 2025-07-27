import { auth } from "@clerk/nextjs/server";
import MessagingClient from "@/components/MessagingClient";

export default async function MessagesPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return <div className="p-4">You must be logged in to view messages.</div>;

  const metadata = sessionClaims?.metadata as { role?: string };
  const role = metadata?.role;

  if (!role) return <div className="p-4">Access denied. No role assigned.</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <MessagingClient userId={userId} />
    </div>
  );
} 