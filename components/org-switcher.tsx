"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Building } from "lucide-react";

interface OrgSwitcherProps {
  memberships: {
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  activeSlug: string;
}

export default function OrgSwitcher({ memberships, activeSlug }: OrgSwitcherProps) {
  const router = useRouter();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlug = e.target.value;
    if (selectedSlug !== activeSlug) {
      // Redirect the browser to the new organization's dashboard space!
      router.push(`/org/${selectedSlug}/dashboard`);
    }
  };

  return (
    <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700 transition-all hover:border-zinc-300 dark:hover:border-zinc-600">
      <Building size={16} className="text-zinc-500 mr-2 shrink-0" />
      <select
        value={activeSlug}
        onChange={handleSelect}
        className="w-full bg-transparent text-sm font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none appearance-none pr-8 cursor-pointer"
      >
        {memberships.map((membership) => (
          <option
            key={membership.organization.id}
            value={membership.organization.slug}
            className="text-zinc-900 bg-white dark:bg-zinc-800"
          >
            {membership.organization.name} ({membership.role})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 flex items-center text-zinc-500">
        <ChevronDown size={16} />
      </div>
    </div>
  );
}
