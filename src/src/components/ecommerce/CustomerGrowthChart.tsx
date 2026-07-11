"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { CustomerGrowthPoint } from "@/lib/api";
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
  data: CustomerGrowthPoint[];
}

export default function CustomerGrowthChart({ data }: Props) {
  const categories = data.map((p) => formatMonth(p.month));
  const series = [
    { name: "Total Customers", type: "line", data: data.map((p) => p.cumulativeCustomers) },
    { name: "New Customers", type: "column", data: data.map((p) => p.newCustomers) },
  ];

  const options: ApexOptions = {
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      height: 300,
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: [3, 0] },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "40%" } },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: "Customers" } },
    grid: { yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: "top" },
    tooltip: { shared: true, intersect: false },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Total Customers
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Cumulative customer base with new signups per month
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "customer-growth",
              [
                { key: "month", label: "Month" },
                { key: "newCustomers", label: "New Customers" },
                { key: "cumulativeCustomers", label: "Total Customers" },
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
          No customers yet
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="line" height={300} />
      )}
    </div>
  );
}
