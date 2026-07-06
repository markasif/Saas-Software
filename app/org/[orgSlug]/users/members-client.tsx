"use client";

import { useState } from "react";
import { 
  Search, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  X, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { 
  addMemberToOrg, 
  UpdateMemberRole, 
  RemoveMemberFromOrg 
} from "@/app/actions/members";

// Type definitions based on our Prisma relations
interface MemberUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

interface MembershipData {
  id: string;
  role: string;
  userId: string;
  organizationId: string;
  user: MemberUser;
}

interface MembersClientProps {
  memberships: MembershipData[];
  currentUserMembership: {
    id: string;
    role: string;
    userId: string;
  };
  orgSlug: string;
}

export default function MembersClient({ 
  memberships, 
  currentUserMembership, 
  orgSlug 
}: MembersClientProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Invite Modal & Form State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [inviteError, setInviteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // General Action Loading State (for role updates or deletions)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  // Check if current user is allowed to perform admin actions (ADMIN or MANAGER)
  const canManageMembers = 
    currentUserMembership.role === "ADMIN" || 
    currentUserMembership.role === "MANAGER";

  // Handle member invitation submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setIsSubmitting(true);

    try {
      const res = await addMemberToOrg({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        role: inviteRole as "ADMIN" | "MANAGER" | "EMPLOYEE",
        orgSlug,
      });

      if (res.success) {
        // Reset states and close modal
        setInviteName("");
        setInviteEmail("");
        setInvitePassword("");
        setInviteRole("EMPLOYEE");
        setIsInviteOpen(false);
      } else {
        setInviteError(res.error || "Failed to invite member.");
      }
    } catch (err: any) {
      setInviteError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle changing user roles
  const handleRoleChange = async (membershipId: string, newRole: string) => {
    setPendingActionId(membershipId);
    try {
      const res = await UpdateMemberRole(membershipId, newRole, orgSlug);
      if (!res.success) {
        alert(res.error || "Failed to update role.");
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setPendingActionId(null);
    }
  };

  // Handle removing users
  const handleRemoveMember = async (membershipId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the organization?`)) {
      return;
    }
    setPendingActionId(membershipId);
    try {
      const res = await RemoveMemberFromOrg(membershipId, orgSlug);
      if (!res.success) {
        alert(res.error || "Failed to remove member.");
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setPendingActionId(null);
    }
  };

  // Client-side filtering logic
  const filteredMemberships = memberships.filter((m) => {
    const matchesSearch = 
      (m.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      m.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  console.log("filter",filteredMemberships)
  // Badge styles mapping helper
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
      case "MANAGER":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700/50";
    }
  };

  return (
    <div className="space-y-4">
      {/* FILTER & HEADER BUTTON CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search & Filter Controls */}
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="MANAGER">Managers</option>
            <option value="EMPLOYEE">Employees</option>
          </select>
        </div>

        {/* Invite Button */}
        {canManageMembers && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow transition-all"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        )}
      </div>

      {/* MEMBERS TABLE */}
      <div className="overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-850 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined Date</th>
                {canManageMembers && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 divide-solid">
              {filteredMemberships.length === 0 ? (
                <tr>
                  <td 
                    colSpan={canManageMembers ? 4 : 3} 
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No members found matching the search.
                  </td>
                </tr>
              ) : (
                filteredMemberships.map((m) => {
                  const isSelf = m.userId === currentUserMembership.userId;
                  const isPending = pendingActionId === m.id;
                  
                  return (
                    <tr 
                      key={m.id} 
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-150"
                    >
                      {/* Name / Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 text-sm uppercase border border-zinc-200 dark:border-zinc-700">
                            {m.user.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                              {m.user.name || "Unnamed User"}
                              {isSelf && (
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/50 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {m.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge or Selector */}
                      <td className="px-6 py-4">
                        {canManageMembers && !isSelf ? (
                          <select
                            value={m.role}
                            disabled={isPending}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="bg-transparent border-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(m.role)}`}>
                            {m.role}
                          </span>
                        )}
                      </td>

                      {/* Date Added */}
                      <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(m.user.createdAt).toLocaleDateString("en-US", {
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </td>

                      {/* Action Menu (Delete Button) */}
                      {canManageMembers && (
                        <td className="px-6 py-4 text-right">
                          {isSelf ? (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 select-none">
                              Owner
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRemoveMember(m.id, m.user.name || m.user.email)}
                              disabled={isPending}
                              className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all inline-flex items-center justify-center"
                              title="Remove Member"
                            >
                              {isPending ? (
                                <Loader2 size={16} className="animate-spin text-zinc-400" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE DIALOG MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Invite New Member
              </h3>
              <button
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteError("");
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-450 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="font-medium">{inviteError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. alice@company.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Initial Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Organization Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Standard Access)</option>
                  <option value="MANAGER">MANAGER (Intermediate Privileges)</option>
                  <option value="ADMIN">ADMIN (Full Control)</option>
                </select>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteOpen(false);
                    setInviteError("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
