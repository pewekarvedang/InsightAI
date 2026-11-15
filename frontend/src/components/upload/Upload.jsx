import "./Upload.css";
import { useState, useEffect } from "react";
import api from "../../services/api";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LinkIcon from "@mui/icons-material/Link";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestoreIcon from "@mui/icons-material/Restore";
import StorageIcon from "@mui/icons-material/Storage";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function Upload({
  setDashboard,
  setAiReport,
  setDataPreview,
  setGlobalLoading,
  onUploadSuccess,
  onFileChange,
}) {
  const [activeTab, setActiveTab] = useState(0); // 0: File, 1: URL, 2: Samples, 3: History
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // URL Ingest state
  const [sheetUrl, setSheetUrl] = useState("");

  // Sample Datasets state
  const [samples, setSamples] = useState([]);
  const [loadingSample, setLoadingSample] = useState(null);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchSamples = async () => {
    try {
      const res = await api.get("/samples");
      setSamples(res.data);
    } catch (e) {
      console.warn("Could not fetch sample datasets", e);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/history");
      setHistoryList(res.data);
    } catch (e) {
      console.warn("Could not fetch dataset history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSamples();
    fetchHistory();
  }, []);

  const handleApplyDatasetPayload = (data, customFileName = null) => {
    if (setDashboard) setDashboard(data.dashboard);
    if (setAiReport) setAiReport(data.ai_report);

    if (data.preview && setDataPreview) {
      if (Array.isArray(data.preview) && data.preview.length > 0) {
        const headers = Object.keys(data.preview[0]);
        setDataPreview({ headers, rows: data.preview });
      }
    }

    if (onFileChange) {
      onFileChange({
        name: customFileName || data.file_name || "dataset.csv",
        size: data.dashboard?.total_orders ? data.dashboard.total_orders * 150 : 1024,
      });
    }

    setSuccess(data.message || "Dataset loaded and audited successfully!");
    if (onUploadSuccess) onUploadSuccess(data);
    fetchHistory();
    setTimeout(() => setSuccess(null), 4000);
  };

  const parseClientPreview = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.name.toLowerCase().endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 0) {
            const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
            const rows = lines.slice(1, 6).map((line) => {
              const vals = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
              const row = {};
              headers.forEach((h, idx) => {
                row[h] = vals[idx] !== undefined ? vals[idx] : "";
              });
              return row;
            });
            if (setDataPreview) {
              setDataPreview({ headers, rows });
            }
          }
        } catch (err) {
          console.error("Failed to parse CSV preview:", err);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile) return;
    setError(null);
    setSuccess(null);

    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
      setError("Please upload a CSV or Excel (.xlsx) file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    if (onFileChange) onFileChange(selectedFile);
    parseClientPreview(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const response = await api.post("/dashboard", formData);
      handleApplyDatasetPayload(response.data, file.name);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Upload failed. Please verify that the backend server is running."
      );
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  const handleSyncUrl = async () => {
    if (!sheetUrl.trim()) {
      setError("Please enter a valid Google Sheets or public CSV URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const response = await api.post("/ingest/url", { url: sheetUrl.trim() });
      handleApplyDatasetPayload(response.data, response.data.file_name);
      setSheetUrl("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to sync dataset from URL. Ensure the sheet is public or link is accessible."
      );
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  const handleLoadSample = async (sampleKey) => {
    setLoadingSample(sampleKey);
    setError(null);
    setSuccess(null);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const response = await api.post(`/samples/load/${sampleKey}`);
      handleApplyDatasetPayload(response.data, response.data.file_name);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load sample dataset.");
    } finally {
      setLoadingSample(null);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  const handleRestoreHistory = async (historyId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const response = await api.post(`/history/load/${historyId}`);
      handleApplyDatasetPayload(response.data, response.data.file_name);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to restore session from history.");
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 0,
        mb: 4,
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: "background.paper",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Tab Switcher Header */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc", px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => {
            setActiveTab(val);
            setError(null);
            if (val === 3) fetchHistory();
          }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              minHeight: 52,
            },
          }}
        >
          <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Upload File" />
          <Tab icon={<LinkIcon />} iconPosition="start" label="Google Sheets / Web URL" />
          <Tab icon={<FolderSpecialIcon />} iconPosition="start" label="Sample Datasets (1-Click)" />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <span>Recent History</span>
                {historyList.length > 0 && (
                  <Chip label={historyList.length} size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Alerts */}
      <Box sx={{ p: 3, pb: 0 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, textAlign: "left", borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, textAlign: "left", borderRadius: 2 }}>
            {success}
          </Alert>
        )}
      </Box>

      {/* TAB 0: File Dropzone */}
      {activeTab === 0 && (
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 4,
            pt: 2,
            textAlign: "center",
            border: isDragging ? "2px dashed #2563eb" : "none",
            backgroundColor: isDragging ? "rgba(37, 99, 235, 0.05)" : "transparent",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <CloudUploadIcon
            color="primary"
            sx={{
              fontSize: 56,
              transform: isDragging ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s ease",
            }}
          />

          <Typography variant="h6" mt={1.5} fontWeight={700} color="#1e293b">
            Upload CSV or Excel Dataset
          </Typography>

          <Typography color="text.secondary" mb={2.5} variant="body2">
            Drag and drop your file here, or click browse to analyze financial and volume metrics.
          </Typography>

          <Button variant="outlined" component="label" disabled={loading} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            Choose File
            <input
              hidden
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />
          </Button>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: file ? "text.primary" : "text.secondary",
            }}
          >
            {file ? (
              <>
                <InsertDriveFileIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={600}>
                  {file.name} ({formatFileSize(file.size)})
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No file selected yet
              </Typography>
            )}
          </Box>

          <Box mt={3}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpload}
              disabled={loading || !file}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
              }}
            >
              {loading ? "Analyzing Dataset..." : "Analyze Dataset"}
            </Button>
          </Box>
        </Box>
      )}

      {/* TAB 1: Google Sheets / Web URL Sync */}
      {activeTab === 1 && (
        <Box sx={{ p: 4, pt: 2, textAlign: "center" }}>
          <Box sx={{ maxWidth: 640, mx: "auto" }}>
            <LinkIcon sx={{ fontSize: 52, color: "#2563eb", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              Sync Public Google Sheet or Web CSV Link
            </Typography>
            <Typography color="text.secondary" variant="body2" mb={3}>
              Paste any public Google Sheets view/edit link or raw web CSV link. InsightAI automatically translates spreadsheet parameters to CSV stream and compiles the dashboard.
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit or raw .csv URL"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={loading}
              />
              <Button
                variant="contained"
                onClick={handleSyncUrl}
                disabled={loading || !sheetUrl.trim()}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LinkIcon />}
                sx={{
                  whiteSpace: "nowrap",
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {loading ? "Syncing..." : "Sync & Audit"}
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, textAlign: "left" }}>
              💡 <strong>Tip for Google Sheets:</strong> Click "Share" in your Google Sheet, set permission to "Anyone with the link can view", and paste the link here.
            </Typography>
          </Box>
        </Box>
      )}

      {/* TAB 2: Preloaded Sample Datasets */}
      {activeTab === 2 && (
        <Box sx={{ p: 3, pt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Explore InsightAI instantly with verified sample datasets spanning e-commerce sales, FMCG distribution targets, and enterprise ledgers:
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 2.5,
            }}
          >
            {samples.map((item) => (
              <Paper
                key={item.id}
                elevation={1}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 2,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <StorageIcon sx={{ color: "#2563eb", fontSize: 22 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: "block" }}>
                    {item.description}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleLoadSample(item.id)}
                  disabled={loadingSample !== null}
                  startIcon={loadingSample === item.id ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    width: "100%",
                  }}
                >
                  {loadingSample === item.id ? "Loading..." : "Load Dataset"}
                </Button>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* TAB 3: Session History */}
      {activeTab === 3 && (
        <Box sx={{ p: 3, pt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Recently audited business datasets stored in persistent local database:
            </Typography>
            <Button size="small" onClick={fetchHistory} sx={{ textTransform: "none" }}>
              Refresh
            </Button>
          </Box>

          {loadingHistory ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : historyList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              No dataset history found yet. Upload or load a dataset above to start recording sessions.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 280, borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rows</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Revenue / Records</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Top Entity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Analyzed At</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyList.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{row.file_name}</TableCell>
                      <TableCell>{row.total_rows?.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.metric_mode === "volume"
                          ? `${row.total_revenue?.toLocaleString()} records`
                          : `₹${Math.round(row.total_revenue || 0).toLocaleString("en-IN")}`}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.top_product || "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.78rem" }}>{row.created_at}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleRestoreHistory(row.id)}
                          disabled={loading}
                          startIcon={<RestoreIcon fontSize="small" />}
                          sx={{ textTransform: "none", borderRadius: 1.5, py: 0.2, fontSize: "0.75rem", fontWeight: 700 }}
                        >
                          Restore
                        </Button>
                      </TableCell>
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
