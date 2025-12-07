"use client";

import { DashboardStats } from "@/lib/api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardChartsProps {
  stats: DashboardStats;
}

const COLORS = {
  free: '#95a5a6',
  premium: '#f39c12',
  enterprise: '#9b59b6',
  active: '#27ae60',
  verified: '#3498db',
};

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  // User tier distribution data
  const userTierData = [
    { name: 'Free', value: stats.freeUsers, color: COLORS.free },
    { name: 'Premium', value: stats.premiumUsers, color: COLORS.premium },
    { name: 'Enterprise', value: stats.enterpriseUsers, color: COLORS.enterprise },
  ];

  // Revenue and subscription data for bar chart
  const subscriptionData = [
    { name: 'Active', value: stats.activeSubscriptions, color: COLORS.active },
    { name: 'Premium', value: stats.premiumUsers, color: COLORS.premium },
    { name: 'Enterprise', value: stats.enterpriseUsers, color: COLORS.enterprise },
  ];

  // Render custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="charts-container">
      <div className="chart-row">
        <div className="chart-item">
          <h4>User Tier Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userTierData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userTierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item">
          <h4>Subscription Overview</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#f39c12" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

