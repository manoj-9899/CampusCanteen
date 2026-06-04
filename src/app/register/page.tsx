"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", ...form, role: "STUDENT" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      await refresh();
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-lg shadow-orange-100/50">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Register as a college student</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {(["name", "email", "studentId", "password"] as const).map((field) => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium capitalize text-slate-700">
                {field === "studentId" ? "Student ID" : field}
              </label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                required={field !== "studentId"}
              />
            </div>
          ))}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-base font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
