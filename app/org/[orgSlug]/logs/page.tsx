import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/db";
import { Clock, FileText } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";


interface LogsPageProps {
    params : Promise<{
        orgSlug : string
    }>
}

function getActionDescription(action: string, performedBy: string){
    switch (action) {
         case "ORGANIZATION_CREATED":
      return `${performedBy}created the organization workspace.`;
      case "MEMBER_INVITED":
      return `${performedBy} invited a new member to the organization.`;
    case "MEMBER_ROLE_UPDATED":
      return `Member role was updated by system action (performed by ${performedBy}).`;
    case "MEMBER_REMOVED":
      return `${performedBy} removed a member from the organization.`;
    default:
      return `${performedBy} performed action: ${action}`;
    }

}

function getActionBadgeStyle(action: string) {
  switch (action) {
    case "ORGANIZATION_CREATED":
    case "MEMBER_INVITED":
      return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50";
    case "MEMBER_ROLE_UPDATED":
      return "bg-indigo-50 text-indigo-700 border-indigo-250 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50";
    case "MEMBER_REMOVED":
      return "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700";
  }
}

export default async function AuditLogsPage({params}: LogsPageProps) {

    const {orgSlug} = await params;

    const session = await getServerSession(authOptions);

    if(!session || !session.user) {
        redirect("/login");
    }

    const org = await prisma.organization.findUnique({
        where: {slug: orgSlug},
        include:{
            memberships:{
                where:{
                    userId: session.user.id
                }
            }
        }
    })

      if (!org || org.memberships.length === 0) {
    redirect("/");
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {organizationId: org.id},
    orderBy : {createdAt: "desc"},
    take: 50
  })

    return(
           <div className="space-y-6">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <FileText size={24} className="text-indigo-600" />
          Audit Logs
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          A security history trail of administrative events performed in this workspace.
        </p>
      </div>
      {/* 2. Timeline Activity Feed */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
        {auditLogs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            No history logs recorded in this organization yet.
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {auditLogs.map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {/* Vertical timeline connector track line */}
                    {logIdx !== auditLogs.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-850"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      {/* Timeline dot */}
                      <div>
                        <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                          <Clock size={14} className="text-zinc-500 dark:text-zinc-400" />
                        </span>
                      </div>
                      
                      {/* Event description and details */}
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-zinc-800 dark:text-zinc-200">
                            {getActionDescription(log.action, log.performedBy)}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getActionBadgeStyle(log.action)}`}>
                              {log.action}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400 pt-1">
                          {new Date(log.createdAt).toLocaleDateString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric"
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
 
}