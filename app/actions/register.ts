"use server";

import prisma from "@/app/lib/db";
import { hashPassword } from "@/app/lib/crypto";
import { z } from "zod";

// 1. Define input validation schema using Zod
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
});

/**
 * Creates a URL-safe slug from a string (e.g. "Acme Corp!" -> "acme-corp")
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)+/g, "");  // Remove leading or trailing hyphens
}

export async function registerOrganization(formData: z.infer<typeof registerSchema>) {
  try {
    // 2. Validate input fields using Zod
    const validatedData = registerSchema.parse(formData);
    const { name, email, password, orgName } = validatedData;

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    // 4. Generate organization slug and check uniqueness
    const baseSlug = generateSlug(orgName);
    let slug = baseSlug;
    let counter = 1;

    // In case two companies have the exact same name, we append a number (e.g., "acme-1")
      while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 5. Hash the password using Argon2id
    const hashedPassword = await hashPassword(password);

    // 6. Execute database transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Create the User
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // B. Create the Organization
      const newOrg = await tx.organization.create({
        data: {
          name: orgName,
          slug,
        },
      });

      // C. Link them together in the Membership table as the initial ADMIN
      await tx.membership.create({
        data: {
          role: "ADMIN",
          userId: newUser.id,
          organizationId: newOrg.id,
        },
      });

      // D. Write an Audit Log entry
      await tx.auditLog.create({
        data: {
          action: "ORGANIZATION_CREATED",
          performedBy: email,
          organizationId: newOrg.id,
        },
      });

      return { user: newUser, organization: newOrg };
    });

    return { success: true, slug: result.organization.slug };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Registration failed:", error);
    return { success: false, error: "Something went wrong during registration." };
  }
}
