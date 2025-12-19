"use client";
import React from "react";

interface UserTypeTotalsCardProps {
  freeUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
}

export default function UserTypeTotalsCard({
  freeUsers,
  premiumUsers,
  enterpriseUsers,
}: UserTypeTotalsCardProps) {
  const total = freeUsers + premiumUsers + enterpriseUsers;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Users by Type
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Free</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{freeUsers.toLocaleString()}</span>
          </div>
          <div className="relative block h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-800">
            <div
              className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-gray-400 text-xs font-medium text-white"
              style={{ width: `${total > 0 ? (freeUsers / total) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            {total > 0 ? ((freeUsers / total) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Premium</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{premiumUsers.toLocaleString()}</span>
          </div>
          <div className="relative block h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-800">
            <div
              className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
              style={{ width: `${total > 0 ? (premiumUsers / total) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            {total > 0 ? ((premiumUsers / total) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Enterprise</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{enterpriseUsers.toLocaleString()}</span>
          </div>
          <div className="relative block h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-800">
            <div
              className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-purple-500 text-xs font-medium text-white"
              style={{ width: `${total > 0 ? (enterpriseUsers / total) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            {total > 0 ? ((enterpriseUsers / total) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Total</span>
            <span className="text-lg font-bold text-gray-800 dark:text-white/90">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}







