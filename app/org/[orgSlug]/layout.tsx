import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";
import Link from "next/link";
import OrgSwitcher from "@/components/org-switcher";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  LogOut,
  ShieldAlert
} from "lucide-react";
import SignOutButton from "./sign-out-button"; 

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgSlug: string;
  }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const session = await getServerSession(authOptions);
  const { orgSlug } = await params;
  if (!session || !session.user) {
    redirect("/login");
  }
  const userMemberships = session.user.memberships || [];
  const currentMembership = userMemberships.find(
    (m) => m.organization.slug === orgSlug
  );

  if (!currentMembership) {
    if (userMemberships.length > 0) {
      redirect(`/org/${userMemberships[0].organization.slug}/dashboard`);
    } else {
      redirect("/register-org");
    }
  }

  const activeOrgName = currentMembership.organization.name;
  const userRole = currentMembership.role;

  // 5. Sidebar Navigation Links
  const navLinks = [
    { href: `/org/${orgSlug}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/org/${orgSlug}/users`, label: "User Management", icon: Users },
    { href: `/org/${orgSlug}/logs`, label: "Audit Logs", icon: FileText },
    { href: `/org/${orgSlug}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      {/* SIDEBAR CONTAINER */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        {/* Org Switcher Header */}
        <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-full">
            <OrgSwitcher memberships={userMemberships} activeSlug={orgSlug} />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-200"
                >
                  <Icon size={18} className="mr-3" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Info & Logout */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold uppercase shrink-0">
                {session.user.name?.charAt(0) || "U"}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
              </div>
            </div>
            
            {/* Interactive Client Logout Button */}
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* VIEWPORT BODY CONTAINER */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Navbar Header */}
        <header className="md:hidden flex h-16 items-center justify-between bg-white dark:bg-zinc-900 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-48">
            <OrgSwitcher memberships={userMemberships} activeSlug={orgSlug} />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold uppercase">
              {session.user.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* Dashboard Pages Render Here */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
