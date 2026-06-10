"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// loginUser is proxied through Next.js /api/auth/login so the cookie
// is set on the same origin as the app (avoiding cross-port cookie issues).
async function loginUser(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Login failed (${res.status})`);
  }
  return res.json();
}

export function LoginForm() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginUser(email.trim().toLowerCase(), password);
      router.push("/");
      router.refresh();
    } catch {
      setError("Invalid email or password. Check the demo accounts below.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-[11.5px] font-semibold text-[#5c5248]">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@sentinel.local"
          className="w-full bg-[#1a1918] border border-[#2a2825] rounded-lg px-3.5 py-2.5 text-[13.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] focus:bg-[#1e1c1a] transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[11.5px] font-semibold text-[#5c5248]">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          className="w-full bg-[#1a1918] border border-[#2a2825] rounded-lg px-3.5 py-2.5 text-[13.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] focus:bg-[#1e1c1a] transition-all"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-[12px] text-[#d4836e] bg-[#C86F5810] border border-[#C86F5828] rounded-lg px-3.5 py-2.5">
          <span className="flex-shrink-0 mt-px">✕</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold bg-[#8A9C8B] hover:bg-[#7a8c7b] text-[#1a1918] disabled:opacity-40 transition-all mt-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#1a1918" strokeWidth="1.5" strokeDasharray="8 20" strokeLinecap="round"/>
            </svg>
            Signing in…
          </span>
        ) : "Sign in"}
      </button>
    </form>
  );
}
