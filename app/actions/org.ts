"use server"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import prisma from "../lib/db";
import { revalidatePath } from "next/cache";





export async function updateOrganization(orgSlug: string, newName: string) {
    try {
        const session = await getServerSession(authOptions);

        if(!session || !session.user) {
            return {success : false, error: "Unauthorized"}
        }

        if(!newName || newName.trim().length < 2 ) {
            return {success : false, error : "Name must be at least 2 characters long"}
        }

        const membership = await prisma.membership.findFirst({
            where : {
                userId: session.user.id,
                organization : {
                    slug : orgSlug
                }
            }
        })

        const isAuthorized = membership?.role === "ADMIN" || membership?.role === "MANAGER";

        if(!isAuthorized) {
            return {success : false, error: "Unauthorized. Only Admins or Managers can update settings." }
        }

        await prisma.$transaction(async (tx) => {
            const org = await tx.organization.update({
                where : {slug: orgSlug},
                data : { name: newName.trim()}
            })

            await tx.auditLog.create({
                data: {
                    action: "ORGANIZATION_UPDATE",
                    performedBy: session.user.email || "undefined",
                    organizationId: org.id,
                }
            })
        })

        revalidatePath(`/org/${orgSlug}/settings`);
    revalidatePath(`/org/${orgSlug}/dashboard`);
    revalidatePath(`/`);
    return { success: true };
        
    } catch (err : any) {
        console.error("Failed to update organization:", err);
        return { success: false, error: err.message || "Failed to update organization" };
    }
}