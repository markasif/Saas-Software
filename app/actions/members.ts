"use server";

import z from "zod";
import prisma from "../lib/db";
import { hashPassword } from "../lib/crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { error } from "console";


const addMemberSchema = z.object({
  name: z.string().min(2,"Name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6,"Password is too short"),
  role: z.enum([
      "ADMIN",
      "MANAGER",
      "EMPLOYEE"
  ]),
  orgSlug: z.string(),
});


export async function addMemberToOrg(formData : z.infer< typeof addMemberSchema>) {
    try {
        const validatedData = addMemberSchema.parse(formData);
        const {name, email, password, role, orgSlug} = validatedData;

        const session = await getServerSession(authOptions);

        if(!session || !session.user) {
            return {sucess: false, error: "Unauthenticated"};
        }

        const org = await prisma.organization.findUnique({
            where:{
                slug : orgSlug
            }
        })

        if(!org) {
            return{success: false, error: "Organization not found."};
        }

        const callerMembership = await prisma.membership.findFirst({
            where: {
                userId : session.user.id,
                organizationId : org.id

            }
        })

        if(!callerMembership){
            return { success: false, error: "You do not belong to this organization." };
        }

        const canInvite = callerMembership.role === "ADMIN" || callerMembership.role === "MANAGER";

        if (!canInvite) {
            return {success: false, error: "Unauthorized. Only Admins or Managers can invite members"}
        }

        const Password = await hashPassword(password);

        await prisma.$transaction(async(tx)=>{
            let user = await tx.user.findUnique({where:{
                email
            }});

            if(!user) {
                user = await tx.user.create({
                    data: {
                        name,
                        email,
                        password: Password,

                    }
                })
            }
            
        const existingMembership = await tx.membership.findUnique({
            where:{
                userId_organizationId:{
                    userId: user.id,
                    organizationId: org.id
                }
            }
        })

            if (existingMembership) {
        throw new Error("This user is already a member of this organization.");
      }

      await tx.membership.create({
        data:{
            role,
            userId : user.id,
            organizationId : org.id
        },
      })

      await tx.auditLog.create({
        data: {
            action: 'MEMBER_INVITED',
            performedBy: email,
            organizationId: org.id,
        }
      })


        })

    revalidatePath(`/org/${orgSlug}/users`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add member:", error);
    return { success: false, error: error.message || "Failed to add member." };
    }
}


export async function UpdateMemberRole(membershipId: string, role: string, orgSlug: string) {
    try {

        const session = await getServerSession(authOptions);
        if(!session || !session.user) {
            return {sucess : false, error : "Unauthenticated"}
        }

        const targetMembership = await prisma.membership.findUnique({
            where: {id: membershipId},
            include : {user: true},
        })

        if (!targetMembership) {
            return { success: false, error: "Membership not found." };
        }

        const callerMembership = await prisma.membership.findFirst({
            where: {
                userId : session.user.id,
                organizationId : targetMembership.organizationId
            }
        })

        if (!callerMembership) {
            return { success: false, error: "You do not belong to this organization." };
        }

        const isCallerAdminOrManager = callerMembership.role === "ADMIN" || callerMembership.role === "MANAGER";
        if (!isCallerAdminOrManager) {
            return { success: false, error: "Unauthorized. Only Admins or Managers can update roles." };
        }

               if(targetMembership.role === "ADMIN" && callerMembership.role !== "ADMIN") {
            return { success: false, error: "Managers cannot modify an Admin's role." };
        }
        

        if(targetMembership.userId === session.user.id) {
              return { success: false, error: "You cannot change your own role." };
        }


        const updatedMembership = await prisma.membership.update({
            where : {id: membershipId},
            data : {role},
            include: { user :true}
        });

        await prisma.auditLog.create({
            data: {
                action: 'MEMBER_ROLE_UPDATED',
                performedBy: updatedMembership.user?.email,
                organizationId: updatedMembership.organizationId,
            }
        })

        revalidatePath(`/org/${orgSlug}/users`);
        return { success: true};

    } catch (error: any) {
        console.error("Failed to update member role:", error);
        return { success: false, error: error.message || "Failed to update member role." };
    }
}

export async function RemoveMemberFromOrg(membershipId: string, orgSlug: string) {
    try {

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return { success: false, error: "Unauthenticated." };
        }

        const targetMembership = await prisma.membership.findUnique({
            where : {id : membershipId}
        });

        if(!targetMembership) {
            return {success : false, error : "Membership not found"}
        }

        const callerMembership = await prisma.membership.findFirst({
            where : {
                userId : session.user.id,
                organizationId : targetMembership.organizationId
            }
        })

        if (!callerMembership) {
            return { success: false, error: "You do not belong to this organization." };
        }

        const isCallerAdminOrManager = callerMembership.role === "ADMIN" || callerMembership.role === "MANAGER";
        if (!isCallerAdminOrManager) {
            return { success: false, error: "Unauthorized. Only Admins or Managers can update roles." };
        }

        if(targetMembership.role === "ADMIN" && callerMembership.role !== "ADMIN") {
            return { success: false, error: "Managers cannot modify an Admin's role." };
        }
        

        if(targetMembership.userId === session.user.id) {
              return { success: false, error: "You cannot change your own role." };
        }

        const removeMembershipFromOrg = await prisma.membership.delete({
            where : {id : membershipId},
            include : {user : true}
        })

        await prisma.auditLog.create({
            data: {
                action: 'MEMBER_REMOVED',
                performedBy: removeMembershipFromOrg.user?.email,
                organizationId: removeMembershipFromOrg.organizationId,
            }
        })

        revalidatePath(`/org/${orgSlug}/users`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to remove member:", error);
        return { success: false, error: error.message || "Failed to remove member." };
    }
}
