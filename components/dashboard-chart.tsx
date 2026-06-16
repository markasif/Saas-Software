"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Mock weekly analytics data for our chart
const data = [
  { name: "Week 1", users: 4 },
  { name: "Week 2", users: 10 },
  { name: "Week 3", users: 15 },
  { name: "Week 4", users: 22 },
  { name: "Week 5", users: 30 },
  { name: "Week 6", users: 45 },
];

export default function DashboardChart() {
  return (
    <div className="h-80 w-full bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
        Organization Growth (Total Users)
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(255, 255, 255, 0.9)", 
              border: "1px solid #e4e4e7",
              borderRadius: "8px"
            }} 
          />
          <Area type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
