'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MetricChartProps {
  data: Array<Record<string, string | number>>;
  type?: 'area' | 'bar';
  dataKey: string;
}

export function MetricChart({ data, type = 'area', dataKey }: Readonly<MetricChartProps>) {
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey={dataKey} stroke="#0891b2" fill="#06b6d4" fillOpacity={0.18} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
