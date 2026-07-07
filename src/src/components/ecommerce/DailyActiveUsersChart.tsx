"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DailyActiveUsersChartProps {
  data: { date: string; activeUsers: number }[];
}

export default function DailyActiveUsersChart({ data }: DailyActiveUsersChartProps) {
  const categories = data.map((point) => {
    const date = new Date(point.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });
  const series = [
    {
      name: "Active Users",
      data: data.map((point) => point.activeUsers),
    },
  ];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 300,
      toolbar: { show: false },
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
      hover: { size: 5 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "Active Users" },
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} active users`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Daily Active Users
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Distinct customers who logged in each day
        </p>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-gray-400 dark:text-gray-500">
          No login activity yet
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="area" height={300} />
      )}
    </div>
  );
}
