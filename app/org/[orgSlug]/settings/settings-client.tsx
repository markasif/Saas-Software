"use client";

import { useState, useTransition } from "react";
import { 
  Building2, 
  Hash, 
  Calendar, 
  ShieldAlert, 
  Loader2 
} from "lucide-react";
import { updateOrganization } from "@/app/actions/org";

interface SettingsClientProps {
  org: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
  };
  currentUserMembership: {
    role: string;
  };
}

export default function SettingsClient({ org, currentUserMembership }: SettingsClientProps) {
  // 1. Establish state and transition variables
  const [name, setName] = useState(org.name);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. Determine permissions (Only ADMIN and MANAGER can modify settings)
  const isAuthorized = 
    currentUserMembership.role === "ADMIN" || 
    currentUserMembership.role === "MANAGER";

  // 3. Handle submit using transition hook
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await updateOrganization(org.slug, name);
        if (res.success) {
          setMessage({ type: "success", text: "Workspace profile updated successfully!" });
        } else {
          setMessage({ type: "error", text: res.error || "Failed to update profile." });
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
      }
    });
  };

  return (
    <div className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      
      {/* Read-only warning if role is EMPLOYEE */}
      {!isAuthorized && (
        <div className="flex gap-2.5 items-start p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-b border-amber-200 dark:border-amber-900/50 text-xs">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Read-Only Access:</strong> You are viewing this organization settings panel as a guest. Only Admins or Managers can save updates.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Status Notification Alerts */}
        {message && (
          <div className={`p-4 text-xs font-semibold rounded-lg border ${
            message.type === "success" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50" 
              : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/50"
          }`}>
            {message.text}
          </div>
        )}

        {/* Workspace Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider block">
            Organization Name
          </label>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              required
              disabled={!isAuthorized || isPending}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all disabled:opacity-60"
            />
          </div>
        </div>

        {/* Locked Slug Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider block">
            Workspace URL Slug (Immutable)
          </label>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              disabled
              value={org.slug}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-lg select-none opacity-60"
            />
          </div>
          <span className="text-[10px] text-zinc-400">
            URL slugs are unique identifiers and cannot be altered to preserve route structures.
          </span>
        </div>

        {/* Grid Meta Information (ID & Creation Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Organization ID</span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-650 dark:text-zinc-350">
              <Hash size={12} className="text-zinc-400" />
              {org.id}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Creation Date</span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350">
              <Calendar size={12} className="text-zinc-400" />
              {new Date(org.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Submit Actions Footer (Only shows if user has save privileges) */}
        {isAuthorized && (
          <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              disabled={isPending || name === org.name}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
