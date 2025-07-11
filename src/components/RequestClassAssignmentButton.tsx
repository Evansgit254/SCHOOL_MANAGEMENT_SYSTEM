"use client";
import { useState } from "react";
import { toast } from "react-toastify";

export default function RequestClassAssignmentButton({ studentId, pending }: { studentId: string, pending: boolean }) {
  const [isPending, setIsPending] = useState(pending);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/class-assignment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (res.ok) {
        toast.success("Request sent!");
        setIsPending(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send request");
      }
    } catch (e) {
      toast.error("Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <button className="bg-gray-400 text-white py-2 px-4 rounded-md" disabled>
        Request Pending
      </button>
    );
  }
  return (
    <button className="bg-lamaYellow text-black py-2 px-4 rounded-md" onClick={handleRequest} disabled={loading}>
      {loading ? "Requesting..." : "Request Class Assignment"}
    </button>
  );
} 