import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label
} from "recharts";

export default function LeadsChart({ data, callout }) {
  // data: [{ month: "Jan", leads: 12, deals: 3 }, ...]
  // callout: { month: "Oct", value: 22 } — shows a floating "N new leads" pill at that point
  const peakIndex = callout
    ? data.findIndex(d => d.month === callout.month)
    : data.reduce((best, d, i) => d.leads > (data[best]?.leads || 0) ? i : best, 0);
  const peakMonth = callout?.month || data[peakIndex]?.month;
  const peakValue = callout?.value ?? data[peakIndex]?.leads ?? 0;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="km-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6c635" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#f6c635" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10.5, fill: "var(--mut)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10.5, fill: "var(--mut)" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            background: "var(--ink)",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: 11,
          }}
          labelStyle={{ color: "#fff" }}
        />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="none"
          fill="url(#km-area)"
        />
        <Line
          type="monotone"
          dataKey="leads"
          stroke="#f6c635"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: "#fff", stroke: "#f6c635", strokeWidth: 3 }}
        />
        <Line
          type="monotone"
          dataKey="deals"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 5"
          opacity={0.7}
          dot={false}
        />
        {peakMonth && peakValue > 0 && (
          <ReferenceLine
            x={peakMonth}
            stroke="currentColor"
            strokeOpacity={0.4}
            label={{
              content: ({ viewBox }) => {
                if (!viewBox) return null;
                return (
                  <g>
                    <rect
                      x={viewBox.x - 52}
                      y={viewBox.y - 28}
                      width={104}
                      height={24}
                      rx={12}
                      fill="var(--ink)"
                    />
                    <text
                      x={viewBox.x}
                      y={viewBox.y - 12}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#fff"
                    >
                      {peakValue} new leads
                    </text>
                  </g>
                );
              },
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
