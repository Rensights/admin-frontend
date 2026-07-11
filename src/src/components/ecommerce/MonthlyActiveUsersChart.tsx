"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MonthlyActiveUsersPoint } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return `${d.toLocaleString("en", { month: "short" })} ${y.slice(2)}`;
}

interface Props {
  data: MonthlyActiveUsersPoint[];
}

export default function MonthlyActiveUsersChart({ data }: Props) {
  const categories = data.map((p) => formatMonth(p.month));
  const series = [{ name: "Active Users", data: data.map((p) => p.activeUsers) }];

  const options: ApexOptions = {
    colors: ["#12B76A"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 300,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: "45%" },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: "Active Users" } },
    grid: { yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val: number) => `${val} active users` } },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Active Users
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Distinct customers who logged in each month
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "monthly-active-users",
              [
                { key: "month", label: "Month" },
                { key: "activeUsers", label: "Active Users" },
              ],
              data
            )
          }
          disabled={data.length === 0}
          className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ⬇ CSV
        </button>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-gray-400 dark:text-gray-500">
          No login activity yet
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="bar" height={300} />
      )}
    </div>
  );
}
