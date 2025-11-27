"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient } from "@/lib/api";
import "../login.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminApiClient.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="logo">Rensights</div>
          <p className="tagline">Admin Dashboard</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@rensights.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          
          <div className="security-note">
            <strong>Default Credentials:</strong><br />
            Email: admin@rensights.com<br />
            Password: admin123
          </div>
        </div>
      </div>
    </div>
  );
}

