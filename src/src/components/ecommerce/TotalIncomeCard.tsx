"use client";
import React from "react";
import { ArrowUpIcon } from "@/icons";
import Badge from "../ui/badge/Badge";

interface TotalIncomeCardProps {
  totalRevenue: number;
}

export default function TotalIncomeCard({ totalRevenue }: TotalIncomeCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-brand-100 rounded-xl dark:bg-brand-500/20">
        <svg className="text-brand-600 size-6 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total Income
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            ${totalRevenue.toLocaleString()}
          </h4>
        </div>
        <Badge color="success">
          <ArrowUpIcon />
          All time
        </Badge>
      </div>
    </div>
  );
}

