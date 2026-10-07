import { useState } from "react";
import { Brain, LogIn, User, Lock } from "lucide-react";
import { loginStudent } from "@/lib/auth";

interface Props {
  onLogin: (studentId: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError("Please enter your Student ID.");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your Password / Pin Code.");
      return;
    }
    if (loginStudent(studentId, pin)) {
      onLogin(studentId.trim());
    } else {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Japanese Study Guide
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Learn Japanese with spaced repetition
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Welcome back!
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Enter your Student ID and Password to continue learning Japanese.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                <User className="mr-1 inline h-3.5 w-3.5" />
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. S001"
                autoComplete="username"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                <Lock className="mr-1 inline h-3.5 w-3.5" />
                Password / Pin Code
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your pin"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
