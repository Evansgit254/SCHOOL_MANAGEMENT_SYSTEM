import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import MessagingClient from "@/components/MessagingClient";

export default async function MessagesPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return <div className="p-4">You must be logged in to view messages.</div>;

  const metadata = sessionClaims?.metadata as { role?: string };
  const role = metadata?.role;

  if (!role) return <div className="p-4">Access denied. No role assigned.</div>;

  // Fetch all messages for the user
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    orderBy: { timestamp: "desc" },
  });

  // Build a list of unique conversation partners
  const partnersSet = new Set<string>();
  messages.forEach(msg => {
    if (msg.senderId !== userId) partnersSet.add(msg.senderId);
    if (msg.receiverId !== userId) partnersSet.add(msg.receiverId);
  });
  const partners = Array.from(partnersSet);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <MessagingClient userId={userId} partners={partners} userRole={role} />
    </div>
  );
} 