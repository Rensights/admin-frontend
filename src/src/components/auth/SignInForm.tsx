"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { adminApiClient } from "@/lib/api";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-6 py-10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950" />
      <div className="w-full max-w-md">
        <div className="mb-6">
          <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
            Admin Access
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
            Sign in to Rensights
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Use your admin credentials to continue.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setLoading(true);
              try {
                await adminApiClient.login(email, password);
                router.push("/");
              } catch (err: any) {
                setError(err.message || "Login failed");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </div>
              )}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>{" "}
                </Label>
                <Input
                  placeholder="admin@rensights.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>{" "}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Button className="w-full" size="sm" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </div>
          </form>
        </div>
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Authorized administrators only.
        </p>
      </div>
    </div>
  );
}
