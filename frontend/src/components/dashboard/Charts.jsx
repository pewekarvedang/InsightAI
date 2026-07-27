import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Charts({ dashboard }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "25px",
        marginTop: "30px",
      }}
    >
      <ChartCard
        title="Sales by Product"
        data={dashboard.sales_by_product}
        dataKey="sales"
      />

      <ChartCard
        title="Profit by Product"
        data={dashboard.profit_by_product}
        dataKey="profit"
      />

      <ChartCard
        title="Sales by Region"
        data={dashboard.sales_by_region}
        dataKey="sales"
      />

      <ChartCard
        title="Profit by Region"
        data={dashboard.profit_by_region}
        dataKey="profit"
      />
    </div>
  );
}

function ChartCard({ title, data, dataKey }) {
  return (
    <div className="chart-card">
    
      <h3>{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Bar 
          dataKey={dataKey} 
          Fill="#2563eb"
          radius={[8, 8, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}