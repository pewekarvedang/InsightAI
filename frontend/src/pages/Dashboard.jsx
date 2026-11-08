import { useState, useRef, useEffect } from "react";
import "../styles/dashboard.css";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import DescriptionIcon from "@mui/icons-material/Description";
import StorageIcon from "@mui/icons-material/Storage";
import TableChartIcon from "@mui/icons-material/TableChart";

import Navbar from "../components/layout/Navbar";
import Upload from "../components/upload/Upload";
import KPICards from "../components/dashboard/KPICards";
import Charts from "../components/dashboard/Charts";
import Insights from "../components/dashboard/Insights";
import DataProfiling from "../components/dashboard/DataProfiling";
import AIChatbot from "../components/dashboard/AIChatbot";
import DeepAnalytics from "../components/dashboard/DeepAnalytics";
import ExecutiveReport from "../components/dashboard/ExecutiveReport";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [aiReport, setAiReport] = useState("");
  const [dataPreview, setDataPreview] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const dashboardRef = useRef(null);

  useEffect(() => {
    if (dashboard && dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [dashboard]);

  // Normalize preview data whether it's { headers, rows } or an array of objects
  const normalizedPreview = (() => {
    if (!dataPreview) return null;
    if (dataPreview.headers && Array.isArray(dataPreview.rows)) {
      return dataPreview;
    }
    if (Array.isArray(dataPreview) && dataPreview.length > 0) {
      return {
        headers: Object.keys(dataPreview[0]),
        rows: dataPreview.slice(0, 5),
      };
    }
    return null;
  })();

  return (
    <>
      <Navbar />

      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 999,
          flexDirection: "column",
          gap: 2,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
        }}
        open={loading}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Typography variant="h6" fontWeight={600}>
          Synthesizing AI Business Intelligence...
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Executing statistical audits, trend parsing, anomaly detection, and strategic briefings.
        </Typography>
      </Backdrop>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        {/* Hero Title */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ letterSpacing: "-0.5px" }}>
              InsightAI Business Intelligence Platform
            </Typography>
            <Chip
              label="Enterprise Edition"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, borderRadius: "6px" }}
            />
          </Box>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: "1rem" }}>
            Upload raw CSV or Excel datasets to automatically generate interactive dashboards, detect anomalies, and query your business analyst chatbot.
          </Typography>
        </Box>

        {/* Upload Component */}
        <Upload
          setDashboard={setDashboard}
          setAiReport={setAiReport}
          setDataPreview={setDataPreview}
          setGlobalLoading={setLoading}
          onFileChange={setCurrentFile}
        />

        {/* Dashboard Display */}
        {dashboard && (
          <div ref={dashboardRef}>
            {/* Intelligence Mode & Mapping Chips */}
            <Box
              sx={{
                mb: 2.5,
                p: 1.8,
                borderRadius: 2.5,
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={dashboard.metric_mode === "volume" ? "📁 Master Data / Volume Mode" : "💰 Financial BI Mode"}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    backgroundColor: dashboard.metric_mode === "volume" ? "#eff6ff" : "#f0fdf4",
                    color: dashboard.metric_mode === "volume" ? "#1d4ed8" : "#166534",
                    border: `1px solid ${dashboard.metric_mode === "volume" ? "#bfdbfe" : "#bbf7d0"}`,
                  }}
                />
                <Chip
                  label={`Metric: ${dashboard.column_mapping?.sales || "Record Frequency"}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.73rem", color: "#475569" }}
                />
                {dashboard.column_mapping?.product && (
                  <Chip
                    label={`Entity: ${dashboard.column_mapping.product}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.73rem", color: "#475569" }}
                  />
                )}
                {dashboard.column_mapping?.region && (
                  <Chip
                    label={`Territory: ${dashboard.column_mapping.region}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.73rem", color: "#475569" }}
                  />
                )}
                {dashboard.column_mapping?.category && (
                  <Chip
                    label={`Segment: ${dashboard.column_mapping.category}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.73rem", color: "#475569" }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {dashboard.total_orders?.toLocaleString()} total records processed
              </Typography>
            </Box>

            {/* KPI Cards Overview */}
            <KPICards dashboard={dashboard} />

            {/* Navigation Tabs */}
            <Paper
              elevation={1}
              sx={{
                mt: 4,
                borderRadius: 3,
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Tabs
                value={currentTab}
                onChange={(e, val) => setCurrentTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  px: 2,
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    minHeight: 58,
                    py: 1.5,
                  },
                }}
              >
                <Tab icon={<BarChartIcon />} iconPosition="start" label="Executive Overview" />
                <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Deep Analytics & Outliers" />
                <Tab
                  icon={<SmartToyIcon />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <span>AI Business Analyst</span>
                      <Chip
                        label="AI Chat"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                        }}
                      />
                    </Box>
                  }
                />
                <Tab icon={<DescriptionIcon />} iconPosition="start" label="Executive Briefing & SWOT" />
                <Tab icon={<StorageIcon />} iconPosition="start" label="Data Health & Auto-Clean" />
              </Tabs>
            </Paper>

            {/* TAB 0: Executive Overview */}
            {currentTab === 0 && (
              <Box>
                <Charts dashboard={dashboard} />

                {/* Dataset Preview */}
                {normalizedPreview && normalizedPreview.rows.length > 0 && (
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      mt: 4,
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid rgba(0, 0, 0, 0.05)",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
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
                        <TableChartIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="#1e293b">
                          Dataset Preview (First {normalizedPreview.rows.length} Rows)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sample view of raw uploaded records
                        </Typography>
                      </Box>
                    </Box>

                    <TableContainer sx={{ maxHeight: 350, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {normalizedPreview.headers.map((col, idx) => (
                              <TableCell
                                key={idx}
                                sx={{
                                  backgroundColor: "#f8fafc",
                                  fontWeight: 700,
                                  color: "#334155",
                                }}
                              >
                                {col}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {normalizedPreview.rows.map((row, rIdx) => (
                            <TableRow key={rIdx} hover>
                              {normalizedPreview.headers.map((col, cIdx) => (
                                <TableCell key={cIdx} sx={{ color: "#475569" }}>
                                  {row[col] !== undefined ? String(row[col]) : "-"}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}

            {/* TAB 1: Deep Analytics */}
            {currentTab === 1 && <DeepAnalytics dashboard={dashboard} />}

            {/* TAB 2: AI Business Analyst Chatbot */}
            {currentTab === 2 && <AIChatbot dashboard={dashboard} />}

            {/* TAB 3: Executive Briefing & SWOT */}
            {currentTab === 3 && (
              <Box>
                <ExecutiveReport report={aiReport} dashboard={dashboard} loading={loading} />
                <Insights dashboard={dashboard} />
              </Box>
            )}

            {/* TAB 4: Data Health & Auto-Cleaner */}
            {currentTab === 4 && <DataProfiling dashboard={dashboard} currentFile={currentFile} />}
          </div>
        )}
      </Container>
    </>
  );
}
