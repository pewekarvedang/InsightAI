import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import InsightsIcon from "@mui/icons-material/Insights";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

function formatMetric(val, isVolume) {
  if (val === undefined || val === null || isNaN(Number(val))) return isVolume ? "0 Records" : "₹0";
  return isVolume ? `${Number(val).toLocaleString()} Records` : `₹${Number(val).toLocaleString("en-IN")}`;
}

export default function DeepAnalytics({ dashboard }) {
  if (!dashboard) return null;

  const isVolume = dashboard?.metric_mode === "volume";
  const pareto = dashboard.pareto_analysis || {};
  const anomalies = dashboard.anomalies || [];
  const lossMakers = dashboard.loss_making_products || [];
  const products = dashboard.sales_by_product || [];
  const regions = dashboard.sales_by_region || [];
  const hasProfit =
    !isVolume &&
    dashboard.total_profit !== null &&
    dashboard.total_profit !== undefined &&
    dashboard.profit_by_product &&
    dashboard.profit_by_product.length > 0 &&
    dashboard.total_profit !== 0;

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* 1. Pareto 80/20 & Anomaly Intelligence Banner */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {/* Pareto Card */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InsightsIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#1e293b">
                {isVolume ? "Pareto (80/20) Record Distribution" : "Pareto (80/20) Revenue Concentration"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isVolume ? "Entity distribution balance and dataset dependency" : "Catalog dependency and distribution efficiency"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600} color="#334155">
                {isVolume ? "Top Entities Share of Records" : "Top Products Revenue Share"}
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#2563eb">
                {pareto.share_percentage || 0}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(pareto.share_percentage || 0, 100)}
              sx={{ height: 10, borderRadius: 5, backgroundColor: "#e2e8f0" }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, lineHeight: 1.5 }}>
              {pareto.insight || "Distribution evaluated across primary dataset dimensions."}
            </Typography>
          </Box>
        </Paper>

        {/* Anomalies Card */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: anomalies.length > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                color: anomalies.length > 0 ? "#dc2626" : "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {anomalies.length > 0 ? <WarningAmberIcon /> : <CheckCircleOutlinedIcon />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#1e293b">
                Statistical Anomaly Audit
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outliers, skewness, and operational risks
              </Typography>
            </Box>
          </Box>

          {anomalies.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}>
              {anomalies.map((a, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: a.severity === "high" ? "#fef2f2" : "#fffbeb",
                    border: `1px solid ${a.severity === "high" ? "#fecaca" : "#fde68a"}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={a.severity === "high" ? "#b91c1c" : "#b45309"}
                    sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    {a.title}
                  </Typography>
                  <Typography variant="body2" color="#334155" sx={{ mt: 0.3, fontSize: "0.82rem" }}>
                    {a.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: "center", backgroundColor: "#f0fdf4", borderRadius: 2, mt: 1 }}>
              <Typography variant="body2" color="#166534" fontWeight={600}>
                ✅ All data points fall within expected statistical confidence thresholds.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* 2. Loss-Making / Underperforming Items */}
      {lossMakers.length > 0 && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Gross Margin Alert: {lossMakers.length} Unprofitable Product(s) Found
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            {lossMakers.map((p, idx) => (
              <Chip
                key={idx}
                label={`${p.name}: -₹${Math.abs(p.loss).toLocaleString("en-IN")}`}
                size="small"
                color="error"
                variant="outlined"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* 3. Product / Master Entity Breakdown Table */}
      {products.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#1e293b">
                {isVolume ? "📊 Master Entity Distribution Matrix" : "📊 Product Margin & Unit Economics Matrix"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isVolume
                  ? "Record counts and distribution shares across primary catalog entities"
                  : "Revenue, bottom-line profit, and margin yields sorted by sales contribution"}
              </Typography>
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 340, borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    {isVolume ? "Entity / Name" : "Product Name"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    {isVolume ? "Record Count" : "Total Sales"}
                  </TableCell>
                  {hasProfit && (
                    <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                      Net Profit
                    </TableCell>
                  )}
                  {hasProfit && (
                    <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                      Profit Margin
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p, idx) => {
                  const margin = p.margin_pct ?? 0;
                  const isHealthy = margin >= 15;
                  const isModerate = margin >= 5 && margin < 15;

                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{p.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatMetric(p.sales, isVolume)}
                      </TableCell>
                      {hasProfit && (
                        <TableCell align="right" sx={{ fontWeight: 600, color: p.profit >= 0 ? "#16a34a" : "#dc2626" }}>
                          ₹{Number(p.profit).toLocaleString("en-IN")}
                        </TableCell>
                      )}
                      {hasProfit && (
                        <TableCell align="center">
                          <Chip
                            label={`${margin}%`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              backgroundColor: isHealthy
                                ? "rgba(16, 185, 129, 0.12)"
                                : isModerate
                                ? "rgba(245, 158, 11, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                              color: isHealthy ? "#059669" : isModerate ? "#d97706" : "#dc2626",
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color={isVolume ? "#2563eb" : isHealthy ? "#059669" : isModerate ? "#d97706" : "#dc2626"}
                        >
                          {isVolume ? "Verified" : isHealthy ? "High Yield" : isModerate ? "Standard" : "Low Margin"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 4. Regional Market Efficiency Matrix */}
      {regions.length > 0 && (
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
              {isVolume ? "🌍 Geographic Operational Coverage" : "🌍 Regional Market Performance Ranking"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isVolume ? "Record concentration across operational territories" : "Territory-by-territory revenue yield and profit conversion"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(220px, 1fr))" },
              gap: 2,
            }}
          >
            {regions.map((r, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                  {r.name}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#2563eb" sx={{ mt: 0.5 }}>
                  {formatMetric(r.sales, isVolume)}
                </Typography>
                {hasProfit && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Profit: ₹{Number(r.profit).toLocaleString("en-IN")}
                    </Typography>
                    <Chip
                      label={`${r.margin_pct || 0}% Margin`}
                      size="small"
                      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
