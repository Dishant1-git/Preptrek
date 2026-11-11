"use client";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

// Colours taken from the PrepTrek logo (navy + purple) plus softer tints
export const COLORS = ["#6B4FA8", "#0E1A3D", "#A58BDB", "#3E5C9A", "#D4C6F1", "#E9A65E", "#5FA8A0"];

// Draws `data` ([{ name, value }]) as whichever chart type the user picked
export default function Chart({ type = "bar", data, unit = "" }) {
  const empty = !data?.length || data.every((d) => !d.value);
  if (empty) return <p className="empty">No data yet — start tracking to see this chart.</p>;

  const tooltip = <Tooltip formatter={(v) => `${v}${unit}`} />;
  const axes = [
    <CartesianGrid key="g" strokeDasharray="3 3" stroke="#ECE7F5" vertical={false} />,
    <XAxis key="x" dataKey="name" tick={{ fontSize: 12 }} />,
    <YAxis key="y" tick={{ fontSize: 12 }} allowDecimals={false} width={32} />,
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      {type === "pie" ? (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          {tooltip}
          <Legend />
        </PieChart>
      ) : type === "line" ? (
        <LineChart data={data}>
          {axes}{tooltip}
          <Line type="monotone" dataKey="value" stroke="#6B4FA8" strokeWidth={2.5} dot={false} />
        </LineChart>
      ) : type === "area" ? (
        <AreaChart data={data}>
          {axes}{tooltip}
          <Area type="monotone" dataKey="value" stroke="#6B4FA8" fill="#D4C6F1" />
        </AreaChart>
      ) : (
        <BarChart data={data}>
          {axes}{tooltip}
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % 2 ? 2 : 0]} />)}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
