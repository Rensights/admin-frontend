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

interface IncomeChartProps {
  monthlyIncome?: { month: string; income: number }[];
  dailyIncome?: { date: string; income: number }[];
  totalRevenue: number;
}

export default function IncomeChart({ monthlyIncome = [], dailyIncome = [], totalRevenue }: IncomeChartProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [isOpen, setIsOpen] = useState(false);

  const monthlyData = monthlyIncome.length > 0 
    ? monthlyIncome.map(item => item.income)
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  const monthlyCategories = monthlyIncome.length > 0
    ? monthlyIncome.map(item => item.month)
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dailyData = dailyIncome.length > 0
    ? dailyIncome.slice(-30).map(item => item.income) // Last 30 days
    : [];
  
  const dailyCategories = dailyIncome.length > 0
    ? dailyIncome.slice(-30).map(item => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      })
    : [];

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 300,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: viewMode === "monthly" ? "39%" : "50%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: viewMode === "monthly" ? monthlyCategories : dailyCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    yaxis: {
      title: {
        text: "Income ($)",
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `$${val.toLocaleString()}`,
      },
    },
  };

  const series = [
    {
      name: "Income",
      data: viewMode === "monthly" ? monthlyData : dailyData,
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
            {viewMode === "monthly" ? "Monthly Income" : "Daily Income"}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Revenue overview
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
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}







