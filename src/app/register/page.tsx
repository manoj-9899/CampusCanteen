"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

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

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <AuthShell
      title="Create account"
      description="Register with your college email to start pre-ordering"
      footer={
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Full name"
          name="name"
          value={form.name}
          onChange={update("name")}
          autoComplete="name"
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={update("email")}
          autoComplete="email"
          required
        />
        <Field
          label="Student ID"
          name="studentId"
          value={form.studentId}
          onChange={update("studentId")}
          hint="Optional — helps staff verify pickup"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="new-password"
          required
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" fullWidth loading={submitting} size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
