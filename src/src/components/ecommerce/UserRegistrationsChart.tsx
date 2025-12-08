"use client";
import { useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface UserRegistrationsChartProps {
  monthlyUserRegistrations?: { month: string; free: number; premium: number; enterprise: number }[];
  dailyUserRegistrations?: { date: string; free: number; premium: number; enterprise: number }[];
}

export default function UserRegistrationsChart({
  monthlyUserRegistrations = [],
  dailyUserRegistrations = [],
}: UserRegistrationsChartProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [isOpen, setIsOpen] = useState(false);

  // Separate monthly and daily data to avoid TypeScript union type issues
  const monthlyData = monthlyUserRegistrations || [];
  const dailyData = dailyUserRegistrations || [];

  const categories = viewMode === "monthly"
    ? (monthlyData.length > 0
        ? monthlyData.map(item => item.month)
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])
    : (dailyData.length > 0
        ? dailyData.map(item => {
            const date = new Date(item.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          })
        : []);

  const freeData = viewMode === "monthly"
    ? (monthlyData.length > 0 ? monthlyData.map(item => item.free) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    : (dailyData.length > 0 ? dailyData.map(item => item.free) : []);
  
  const premiumData = viewMode === "monthly"
    ? (monthlyData.length > 0 ? monthlyData.map(item => item.premium) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    : (dailyData.length > 0 ? dailyData.map(item => item.premium) : []);
  
  const enterpriseData = viewMode === "monthly"
    ? (monthlyData.length > 0 ? monthlyData.map(item => item.enterprise) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    : (dailyData.length > 0 ? dailyData.map(item => item.enterprise) : []);

  const options: ApexOptions = {
    colors: ["#9CB9FF", "#465FFF", "#7C3AED"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 300,
      toolbar: {
        show: false,
      },
      stacked: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 0,
      hover: {
        size: 5,
      },
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Users",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} users`,
      },
    },
  };

  const series = [
    {
      name: "Free",
      data: freeData,
    },
    {
      name: "Premium",
      data: premiumData,
    },
    {
      name: "Enterprise",
      data: enterpriseData,
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {viewMode === "monthly" ? "Monthly User Registrations" : "Daily User Registrations"}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            New users by type
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === "monthly"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === "daily"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Daily
            </button>
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
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}

