"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "STAFF" ? "/staff" : "/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      await refresh();
      router.push(data.user.role === "STAFF" ? "/staff" : "/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Checking session" />;
  }

  return (
    <AuthShell
      title="Sign in"
      description="Access your canteen account to order or manage the counter"
      footer={
        <p className="text-center text-sm text-muted">
          New student?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" fullWidth loading={submitting} size="lg">
          Sign in
        </Button>
        {process.env.NODE_ENV === "development" && (
          <Alert variant="info" className="text-xs">
            <p className="font-medium">Local demo accounts</p>
            <p className="mt-1">
              Student: student@college.edu / student123
              <br />
              Staff: staff@canteen.edu / staff123
            </p>
            <p className="mt-1 text-muted">
              If login fails, run <code className="text-[11px]">npm run db:setup</code>{" "}
              once to create the database.
            </p>
          </Alert>
        )}
      </form>
    </AuthShell>
  );
}
