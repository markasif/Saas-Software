import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MembersClient from "./members-client";


interface PageProps {
    params : Promise<{
        orgSlug : string;
    }>;
}

export default async function UsersPage({params}: PageProps) {

    const {orgSlug} = await params;

    const session = await getServerSession(authOptions);

    if(!session || !session.user) {
        redirect("/login");
    }

    const org = await prisma.organization.findUnique({
        where: { slug : orgSlug},
        include:{
            memberships : {
                include : {
                    user : {
                        select : {
                            id : true,
                            email : true,
                            name : true,
                            createdAt : true,
                            
                        }
                    }
                }
            }
        }
    })

    console.log("organization",org)
    if(!org) {
        redirect("/");
    }

    const currentUserMembership = org.memberships.find((m)=> m.user.id === session.user?.id);

    if(!currentUserMembership){
        redirect("/");
    }

    console.log("users",session.user)
     return (
     <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          User Management
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your organization's members, update their roles, or invite new teammates.
        </p>
      </div>
      <MembersClient
        memberships={org.memberships}
        currentUserMembership={currentUserMembership}
        orgSlug={orgSlug}
      />
    </div>
  );
}
