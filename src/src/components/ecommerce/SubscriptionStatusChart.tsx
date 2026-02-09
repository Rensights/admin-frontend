"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SubscriptionStatusChartProps {
  subscriptionStatusStats?: { status: string; count: number }[];
}

export default function SubscriptionStatusChart({
  subscriptionStatusStats = [],
}: SubscriptionStatusChartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const processed = subscriptionStatusStats.length > 0
    ? subscriptionStatusStats
    : [
        { status: "ACTIVE", count: 0 },
        { status: "CANCELLED", count: 0 },
        { status: "EXPIRED", count: 0 },
      ];

  const labels = processed.map((item) => item.status);
  const series = processed.map((item) => item.count);

  const options: ApexOptions = {
    colors: ["#22C55E", "#F97316", "#9CA3AF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 320,
    },
    labels,
    legend: {
      position: "bottom",
      fontFamily: "Outfit",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Subscriptions",
              formatter: () => {
                const total = series.reduce((sum, val) => sum + val, 0);
                return total.toLocaleString();
              },
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} subscriptions`,
      },
    },
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Subscriptions by Status
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Active vs cancelled vs expired
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="py-6">
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={320}
        />
      </div>
    </div>
  );
}
