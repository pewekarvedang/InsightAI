import "./Charts.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#64748b"];

function formatTooltipValue(val, isVolume) {
  if (val === undefined || val === null || isNaN(Number(val))) return isVolume ? "0 Records" : "₹0";
  return isVolume ? `${Number(val).toLocaleString()} Records` : `₹${Number(val).toLocaleString("en-IN")}`;
}

function formatAxisValue(v, isVolume) {
  if (isVolume) return Number(v).toLocaleString();
  if (v >= 1000000) return `₹${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${v}`;
}

export default function Charts({ dashboard }) {
  if (!dashboard) return null;

  const isVolume = dashboard?.metric_mode === "volume";
  const hasTimeSeries = dashboard.time_series && dashboard.time_series.length > 0;
  const hasCategories = dashboard.sales_by_category && dashboard.sales_by_category.length > 0;
  const hasRegion = dashboard.sales_by_region && dashboard.sales_by_region.length > 0;
  const hasProducts = dashboard.sales_by_product && dashboard.sales_by_product.length > 0;
  const hasProfit =
    !isVolume &&
    dashboard.total_profit !== null &&
    dashboard.total_profit !== undefined &&
    dashboard.profit_by_product &&
    dashboard.profit_by_product.length > 0 &&
    dashboard.total_profit !== 0;

  const profitLabel = dashboard.profit_label || "Net Profit";

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* 1. Time Series Area Chart */}
      {hasTimeSeries && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              {isVolume ? "📈 Record Volume Trends Over Time" : "📈 Revenue & Profit Trends Over Time"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isVolume ? "Chronological record velocity across periods" : "Chronological performance across periods"}
            </Typography>
          </Box>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dashboard.time_series}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>
                {hasProfit && (
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatAxisValue(v, isVolume)} />
              <Tooltip formatter={(value) => [formatTooltipValue(value, isVolume)]} />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey="sales"
                name={isVolume ? "Record Count" : "Sales Revenue"}
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorSales)"
              />
              {hasProfit && (
                <Area
                  type="monotone"
                  dataKey="profit"
                  name={profitLabel}
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* 2. Category Donut + Regional Market Share */}
      {(hasCategories || hasRegion) && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: hasCategories && hasRegion ? "1fr 1fr" : "1fr" },
            gap: 3,
          }}
        >
          {hasCategories && (
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
                {isVolume ? "📦 Distribution by Category" : "📦 Sales Share by Category"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isVolume ? "Catalog distribution across classification segments" : "Portfolio distribution & revenue concentration"}
              </Typography>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={dashboard.sales_by_category}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {dashboard.sales_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, entry) => [
                      `${formatTooltipValue(val, isVolume)} (${entry.payload.percentage}%)`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {hasRegion && (
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
                {isVolume ? "📍 Geographic Distribution" : "📍 Regional Sales Traction"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isVolume ? "Master record frequency across operational zones" : "Revenue distribution by geographic territory"}
              </Typography>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboard.sales_by_region || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatAxisValue(v, isVolume)} />
                  <Tooltip formatter={(value) => [formatTooltipValue(value, isVolume), isVolume ? "Records" : "Sales"]} />
                  <Bar dataKey="sales" fill="#9333ea" radius={[6, 6, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* 3. Product Sales & Profit Comparisons */}
      {hasProducts && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: hasProfit ? "1fr 1fr" : "1fr" },
            gap: 3,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
              {isVolume ? "🏆 Top Master Entities by Frequency" : "🏆 Top Products by Revenue"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isVolume ? "Highest frequency items in the uploaded dataset" : "Best performing catalog items by financial turnover"}
            </Typography>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboard.sales_by_product || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatAxisValue(v, isVolume)} />
                <Tooltip formatter={(value) => [formatTooltipValue(value, isVolume), isVolume ? "Records" : "Sales"]} />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {hasProfit && (
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
                💰 {profitLabel} by Product
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Net profitability contribution across top catalog items
              </Typography>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboard.profit_by_product || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatAxisValue(v, isVolume)} />
                  <Tooltip formatter={(value) => [formatTooltipValue(value, isVolume), profitLabel]} />
                  <Bar dataKey="profit" fill="#16a34a" radius={[6, 6, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}
