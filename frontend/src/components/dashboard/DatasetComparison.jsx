import { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import api from "../../services/api";

export default function DatasetComparison() {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [labelA, setLabelA] = useState("Period A");
  const [labelB, setLabelB] = useState("Period B");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparison, setComparison] = useState(null);

  const handleFileChangeA = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileA(e.target.files[0]);
      setError(null);
    }
  };

  const handleFileChangeB = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileB(e.target.files[0]);
      setError(null);
    }
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) {
      setError("Please select both Period A and Period B datasets to compare.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file_a", fileA);
    formData.append("file_b", fileB);
    formData.append("label_a", labelA.trim() || "Period A");
    formData.append("label_b", labelB.trim() || "Period B");

    try {
      const response = await api.post("/compare", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setComparison(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Comparison failed. Please verify datasets are valid CSV or Excel files."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setComparison(null);
    setError(null);
  };

  const summary = comparison?.summary;
  const isVolume = summary?.metric_mode === "volume";

  return (
    <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header Banner */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "#ffffff",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            }}
          >
            <CompareArrowsIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              Period-over-Period Multi-Dataset Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload two business periods (e.g. Q1 vs Q2, YoY, or Budget vs Actual) to evaluate revenue growth, margin expansion, and top gainers/decliners.
            </Typography>
          </Box>
        </Box>

        {comparison && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleReset}
            startIcon={<RestartAltIcon />}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Compare Another Pair
          </Button>
        )}
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Dropzones (when no active comparison or to reconfigure) */}
      {!comparison && (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2.5 }}>
            📁 Select Two Datasets for Comparative Analysis
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Box A */}
            <Box
              sx={{
                p: 3,
                borderRadius: 2.5,
                border: "2px dashed #94a3b8",
                backgroundColor: fileA ? "#f0fdf4" : "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 1.5,
              }}
            >
              <TextField
                size="small"
                label="Baseline Period Label"
                value={labelA}
                onChange={(e) => setLabelA(e.target.value)}
                sx={{ width: "100%", maxWidth: 280 }}
              />

              <CloudUploadIcon sx={{ fontSize: 48, color: fileA ? "#16a34a" : "#64748b" }} />

              <Typography variant="body1" fontWeight={600} color="#1e293b">
                {fileA ? fileA.name : "Select Period A Dataset"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                CSV or Excel (.xlsx) file
              </Typography>

              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ textTransform: "none", borderRadius: 2, mt: 1 }}
              >
                {fileA ? "Replace File A" : "Browse File A"}
                <input type="file" accept=".csv, .xlsx" hidden onChange={handleFileChangeA} />
              </Button>
            </Box>

            {/* Box B */}
            <Box
              sx={{
                p: 3,
                borderRadius: 2.5,
                border: "2px dashed #94a3b8",
                backgroundColor: fileB ? "#f0fdf4" : "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 1.5,
              }}
            >
              <TextField
                size="small"
                label="Comparison Period Label"
                value={labelB}
                onChange={(e) => setLabelB(e.target.value)}
                sx={{ width: "100%", maxWidth: 280 }}
              />

              <CloudUploadIcon sx={{ fontSize: 48, color: fileB ? "#16a34a" : "#64748b" }} />

              <Typography variant="body1" fontWeight={600} color="#1e293b">
                {fileB ? fileB.name : "Select Period B Dataset"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                CSV or Excel (.xlsx) file
              </Typography>

              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ textTransform: "none", borderRadius: 2, mt: 1 }}
              >
                {fileB ? "Replace File B" : "Browse File B"}
                <input type="file" accept=".csv, .xlsx" hidden onChange={handleFileChangeB} />
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3.5 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCompare}
              disabled={!fileA || !fileB || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CompareArrowsIcon />}
              sx={{
                px: 5,
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
              }}
            >
              {loading ? "Comparing Datasets..." : `Compare ${labelA} vs. ${labelB}`}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Comparison Results */}
      {comparison && summary && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* KPI Comparison Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
              gap: 2.5,
            }}
          >
            {/* Card 1: Revenue Comparison */}
            <Paper elevation={2} sx={{ p: 2.8, borderRadius: 3, backgroundColor: "#ffffff" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {isVolume ? "Total Records / Volume" : "Gross Revenue Comparison"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {comparison.label_a}: {isVolume ? summary.revenue_a.toLocaleString() : `₹${Math.round(summary.revenue_a).toLocaleString("en-IN")}`}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    {comparison.label_b}: {isVolume ? summary.revenue_b.toLocaleString() : `₹${Math.round(summary.revenue_b).toLocaleString("en-IN")}`}
                  </Typography>
                </Box>
                <Chip
                  icon={summary.revenue_delta_pct >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${summary.revenue_delta_pct >= 0 ? "+" : ""}${summary.revenue_delta_pct.toFixed(1)}%`}
                  size="small"
                  color={summary.revenue_delta_pct >= 0 ? "success" : "error"}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color={summary.revenue_delta >= 0 ? "success.main" : "error.main"} fontWeight={600} sx={{ mt: 1, display: "block" }}>
                Variance: {summary.revenue_delta >= 0 ? "+" : ""}{isVolume ? summary.revenue_delta.toLocaleString() : `₹${Math.round(summary.revenue_delta).toLocaleString("en-IN")}`}
              </Typography>
            </Paper>

            {/* Card 2: Net Profit Comparison */}
            <Paper elevation={2} sx={{ p: 2.8, borderRadius: 3, backgroundColor: "#ffffff" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Net Profit Comparison
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {comparison.label_a}: ₹{Math.round(summary.profit_a || 0).toLocaleString("en-IN")}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    {comparison.label_b}: ₹{Math.round(summary.profit_b || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Chip
                  icon={summary.profit_delta_pct >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${summary.profit_delta_pct >= 0 ? "+" : ""}${summary.profit_delta_pct.toFixed(1)}%`}
                  size="small"
                  color={summary.profit_delta_pct >= 0 ? "success" : "error"}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color={summary.profit_delta >= 0 ? "success.main" : "error.main"} fontWeight={600} sx={{ mt: 1, display: "block" }}>
                Variance: {summary.profit_delta >= 0 ? "+" : ""}₹{Math.round(summary.profit_delta || 0).toLocaleString("en-IN")}
              </Typography>
            </Paper>

            {/* Card 3: Margin Comparison */}
            <Paper elevation={2} sx={{ p: 2.8, borderRadius: 3, backgroundColor: "#ffffff" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Operating Margin %
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {comparison.label_a}: {(summary.margin_a || 0).toFixed(1)}%
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    {comparison.label_b}: {(summary.margin_b || 0).toFixed(1)}%
                  </Typography>
                </Box>
                <Chip
                  label={`${summary.margin_shift_bps >= 0 ? "+" : ""}${Math.round(summary.margin_shift_bps || 0)} bps`}
                  size="small"
                  color={(summary.margin_shift_bps || 0) >= 0 ? "success" : "error"}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Status: {(summary.margin_shift_bps || 0) >= 0 ? "Margin Expansion" : "Margin Compression"}
              </Typography>
            </Paper>

            {/* Card 4: Orders Comparison */}
            <Paper elevation={2} sx={{ p: 2.8, borderRadius: 3, backgroundColor: "#ffffff" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Order / Transaction Count
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {comparison.label_a}: {summary.orders_a.toLocaleString()}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    {comparison.label_b}: {summary.orders_b.toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  label={`${summary.orders_delta_pct >= 0 ? "+" : ""}${summary.orders_delta_pct.toFixed(1)}%`}
                  size="small"
                  color={summary.orders_delta_pct >= 0 ? "success" : "default"}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Variance: {summary.orders_delta >= 0 ? "+" : ""}{summary.orders_delta.toLocaleString()} orders
              </Typography>
            </Paper>
          </Box>

          {/* Comparative Bar Chart */}
          {comparison.comparison_chart && comparison.comparison_chart.length > 0 && (
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
                📊 Top Product Performance: {comparison.label_a} vs. {comparison.label_b}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                Direct side-by-side revenue turnover comparison for top catalog items
              </Typography>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparison.comparison_chart} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" angle={-15} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={(v) => (v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  />
                  <RechartsTooltip
                    formatter={(val) => [isVolume ? `${val} records` : `₹${Number(val).toLocaleString("en-IN")}`]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                  <Legend verticalAlign="top" />
                  <Bar dataKey={comparison.label_a} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={comparison.label_b} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* Top Gainers & Top Decliners Tables */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Top Gainers */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#ffffff" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="subtitle1" fontWeight={700} color="#166534">
                  Top Gainers (Accelerating Products)
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f0fdf4" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{comparison.label_a}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{comparison.label_b}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(comparison.top_gainers || []).slice(0, 5).map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.name}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#64748b" }}>
                          ₹{Math.round(row.sales_a || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#1e293b" }}>
                          ₹{Math.round(row.sales_b || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`+${(row.growth_pct || 0).toFixed(1)}%`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 700, height: 20, fontSize: "0.72rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!comparison.top_gainers || comparison.top_gainers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 2 }}>
                          No significant gainers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Top Decliners */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#ffffff" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <TrendingDownIcon color="error" />
                <Typography variant="subtitle1" fontWeight={700} color="#991b1b">
                  Top Decliners (Contracting Products)
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#fef2f2" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{comparison.label_a}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{comparison.label_b}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Variance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(comparison.top_decliners || []).slice(0, 5).map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.name}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#64748b" }}>
                          ₹{Math.round(row.sales_a || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#1e293b" }}>
                          ₹{Math.round(row.sales_b || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${(row.growth_pct || 0).toFixed(1)}%`}
                            size="small"
                            color="error"
                            sx={{ fontWeight: 700, height: 20, fontSize: "0.72rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!comparison.top_decliners || comparison.top_decliners.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 2 }}>
                          No significant contracting products detected.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}
