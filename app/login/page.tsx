"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

// 1. Define login schema using Zod
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // 2. Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 3. Handle login submission
  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    // A. Trigger NextAuth credentials sign-in
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // B. Fetch the active session to check which organization the user belongs to
    const session = await getSession();
    
    if (session?.user?.memberships && session.user.memberships.length > 0) {
      // Grab the slug of their first organization and redirect them to their dashboard
      const userOrgSlug = session.user.memberships[0].organization.slug;
      router.push(`/org/${userOrgSlug}/dashboard`);
    } else {
      // If the user somehow exists but doesn't have an organization, redirect them to create one
      router.push("/register-org");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-300">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Or{" "}
            <Link
              href="/register-org"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              create a new organization
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/50 p-4 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className="relative block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 bg-white dark:bg-zinc-800 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="relative block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 bg-white dark:bg-zinc-800 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="text-black" size={18} /> : <Eye className="text-black" size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
