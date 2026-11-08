import { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import StorageIcon from "@mui/icons-material/Storage";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import DownloadIcon from "@mui/icons-material/Download";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import api from "../../services/api";

export default function DataProfiling({ dashboard, currentFile }) {
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);
  const [cleanError, setCleanError] = useState(null);

  if (!dashboard || !dashboard.summary) return null;

  const summary = dashboard.summary;
  const missingCols = summary.missing_by_column || summary.column_missing_values || {};
  const missingColNames = Object.keys(missingCols);

  const handleCleanDataset = async () => {
    if (!currentFile) {
      setCleanError("No file reference available for auto-cleaning. Please re-upload your file.");
      return;
    }

    setCleaning(true);
    setCleanError(null);

    const formData = new FormData();
    formData.append("file", currentFile);

    try {
      const response = await api.post("/clean", formData);
      setCleanResult(response.data);
    } catch (err) {
      console.error(err);
      setCleanError(
        err.response?.data?.detail || err.message || "Failed to execute automated data cleaning."
      );
    } finally {
      setCleaning(false);
    }
  };

  const handleDownloadCleaned = () => {
    if (!cleanResult?.download_filename) return;
    const downloadUrl = `http://127.0.0.1:8000/download/${cleanResult.download_filename}`;
    window.open(downloadUrl, "_blank");
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mt: 4,
        borderRadius: 3,
        backgroundColor: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          pb: 2.5,
          mb: 3,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
            }}
          >
            <StorageIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1e293b">
              Dataset Profiling & Quality Health
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Structural analysis, null detection, and automated cleaning tools
            </Typography>
          </Box>
        </Box>

        {currentFile && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCleanDataset}
            disabled={cleaning}
            startIcon={cleaning ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
            sx={{ borderRadius: 2, textTransform: "none", px: 2.5, py: 1 }}
          >
            {cleaning ? "Cleaning Dataset..." : "Auto-Clean Dataset"}
          </Button>
        )}
      </Box>

      {/* Profiling Metrics Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            TOTAL ROWS & COLS
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mt: 0.5 }}>
            {summary.rows} × {summary.columns}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            MEMORY SIZE
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mt: 0.5 }}>
            {summary.memory_usage_mb} MB
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: summary.missing_values > 0 ? "rgba(245, 158, 11, 0.08)" : "#f8fafc",
            border: "1px solid",
            borderColor: summary.missing_values > 0 ? "#f59e0b" : "#e2e8f0",
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color={summary.missing_values > 0 ? "warning.dark" : "text.secondary"} fontWeight={600}>
            MISSING CELLS
          </Typography>
          <Typography variant="h6" fontWeight={700} color={summary.missing_values > 0 ? "#d97706" : "#0f172a"} sx={{ mt: 0.5 }}>
            {summary.missing_values}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: summary.duplicate_rows > 0 ? "rgba(239, 68, 68, 0.08)" : "#f8fafc",
            border: "1px solid",
            borderColor: summary.duplicate_rows > 0 ? "#ef4444" : "#e2e8f0",
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color={summary.duplicate_rows > 0 ? "error.dark" : "text.secondary"} fontWeight={600}>
            DUPLICATE ROWS
          </Typography>
          <Typography variant="h6" fontWeight={700} color={summary.duplicate_rows > 0 ? "#dc2626" : "#0f172a"} sx={{ mt: 0.5 }}>
            {summary.duplicate_rows}
          </Typography>
        </Box>
      </Box>

      {/* Column Type Distribution */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mb: 1.5 }}>
          COLUMN TYPES IDENTIFIED
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {summary.numeric_columns?.map((col) => (
            <Chip
              key={col}
              label={`${col} (Numeric)`}
              size="small"
              sx={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#1d4ed8", fontWeight: 600 }}
            />
          ))}
          {summary.categorical_columns?.map((col) => (
            <Chip
              key={col}
              label={`${col} (Text)`}
              size="small"
              sx={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#7e22ce", fontWeight: 600 }}
            />
          ))}
          {summary.datetime_columns?.map((col) => (
            <Chip
              key={col}
              label={`${col} (Datetime)`}
              size="small"
              sx={{ backgroundColor: "rgba(20, 184, 166, 0.1)", color: "#0f766e", fontWeight: 600 }}
            />
          ))}
        </Box>
      </Box>

      {/* Missing Values Breakdown if any */}
      {missingColNames.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            Missing data detected in {missingColNames.length} column{missingColNames.length > 1 ? "s" : ""}:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            {missingColNames.map((col) => (
              <Chip
                key={col}
                label={`${col}: ${missingCols[col]} missing`}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Error alert for cleaning */}
      {cleanError && (
        <Alert severity="error" onClose={() => setCleanError(null)} sx={{ mb: 3, borderRadius: 2 }}>
          {cleanError}
        </Alert>
      )}

      {/* Clean Result Presentation */}
      {cleanResult && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2.5,
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            mt: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleOutlinedIcon color="success" />
              <Typography variant="h6" fontWeight={700} color="#065f46">
                Cleaning Pipeline Complete
              </Typography>
            </Box>

            {cleanResult.download_filename && (
              <Button
                variant="outlined"
                color="success"
                size="small"
                onClick={handleDownloadCleaned}
                startIcon={<DownloadIcon />}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Download Cleaned CSV
              </Button>
            )}
          </Box>

          {/* Audit report stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Duplicate Rows Purged
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#1e293b">
                {cleanResult.cleaning_report?.duplicate_rows_removed ?? 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Numeric Values Imputed (Median)
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#1e293b">
                {cleanResult.cleaning_report?.numeric_values_filled ?? 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Empty Rows / Cols Removed
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#1e293b">
                {(cleanResult.cleaning_report?.empty_rows_removed ?? 0) + (cleanResult.cleaning_report?.empty_columns_removed ?? 0)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Cleaned Rows Output
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#1e293b">
                {cleanResult.cleaning_report?.cleaned_rows ?? 0}
              </Typography>
            </Box>
          </Box>

          {/* Cleaned Data Preview Table */}
          {cleanResult.cleaned_preview && cleanResult.cleaned_preview.length > 0 && (
            <TableContainer sx={{ maxHeight: 240, borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(cleanResult.cleaned_preview[0]).map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cleanResult.cleaned_preview.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.keys(cleanResult.cleaned_preview[0]).map((col) => (
                        <TableCell key={col}>
                          {row[col] !== undefined ? String(row[col]) : "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Paper>
  );
}
