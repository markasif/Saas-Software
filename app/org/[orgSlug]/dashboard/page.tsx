import prisma from "@/app/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import DashboardChart from "@/components/dashboard-chart";
import { Users, Shield, ShieldCheck, Activity } from "lucide-react";

interface DashboardProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { orgSlug } = await params;

  // 1. Fetch the organization and its data in a single SQL query
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        include: {
          user: true
        }
      },
      auditLogs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5 // Load only the 5 most recent activities
      }
    }
  });

  if (!organization) {
    redirect("/register-org");
  }

  // 2. Compute live metrics from memberships
  const totalMembers = organization.memberships.length;
  const admins = organization.memberships.filter((m) => m.role === "ADMIN").length;
  const managers = organization.memberships.filter((m) => m.role === "MANAGER").length;
  const employees = organization.memberships.filter((m) => m.role === "EMPLOYEE").length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Welcome, {session.user.name}!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Here is what's happening today at <span className="font-semibold text-zinc-900 dark:text-zinc-50">{organization.name}</span>.
        </p>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Members</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalMembers}</p>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center">
          <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-600 dark:text-red-400 mr-4">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{admins}</p>
          </div>
        </div>

        {/* Managers */}
        <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400 mr-4">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Managers</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{managers}</p>
          </div>
        </div>

        {/* Employees */}
        <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Employees</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{employees}</p>
          </div>
        </div>
      </div>

      {/* GRAPH ROW */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardChart />
        </div>

        {/* RECENT ACTIVITY LIST */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-80">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-indigo-600" size={18} />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Recent Activity Logs
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {organization.auditLogs.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">No activity recorded yet.</p>
            ) : (
              organization.auditLogs.map((log) => (
                <div key={log.id} className="text-sm border-b border-zinc-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {log.action.replace("_", " ")}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Performed by <span className="font-medium">{log.performedBy}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
