import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";

interface SettingsPageProps {
    params : Promise <{
        orgSlug : string;
    }>
}
    

export default async function Settings({params} : SettingsPageProps){
    const {orgSlug} = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    const org = await prisma.organization.findUnique({
        where : {
            slug : orgSlug
        },
        include : {
            memberships:{
                where : {
                    userId : session.user.id
                }
            },
        }
    })

    if (!org || org.memberships.length === 0) {
    redirect("/");
  }
  const currentUserMembership = org.memberships[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Workspace Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your organization profile, view unique identifiers, and update details.
        </p>
      </div>
      <SettingsClient
        org={{
          id: org.id,
          name: org.name,
          slug: org.slug,
          createdAt: org.createdAt
        }}
        currentUserMembership={{
          role: currentUserMembership.role
        }}
      />
    </div>
    
    )

}