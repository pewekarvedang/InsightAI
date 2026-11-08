import "./Upload.css";
import { useState } from "react";
import api from "../../services/api";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    setSuccess(false);

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

  async function handleUpload() {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setError(null);
    setSuccess(false);

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
      setError("Please upload a CSV or Excel (.xlsx) file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const response = await api.post("/dashboard", formData);

      if (setDashboard) setDashboard(response.data.dashboard);
      if (setAiReport) setAiReport(response.data.ai_report);

      if (response.data.preview && setDataPreview) {
        if (Array.isArray(response.data.preview) && response.data.preview.length > 0) {
          const headers = Object.keys(response.data.preview[0]);
          setDataPreview({ headers, rows: response.data.preview });
        }
      }

      setSuccess(true);
      if (onUploadSuccess) onUploadSuccess(response.data);

      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Upload failed. Please verify that the backend server is running.";
      setError(message);
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  }

  return (
    <Paper
      elevation={3}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 5,
        mb: 4,
        borderRadius: 3,
        textAlign: "center",
        border: isDragging ? "2px dashed #2563eb" : "2px dashed #d1d5db",
        backgroundColor: isDragging ? "rgba(37, 99, 235, 0.05)" : "background.paper",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, textAlign: "left" }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 3, textAlign: "left" }}>
          Dataset uploaded and analyzed successfully!
        </Alert>
      )}

      <CloudUploadIcon
        color="primary"
        sx={{
          fontSize: 60,
          transform: isDragging ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.2s ease",
        }}
      />

      <Typography variant="h5" mt={2} fontWeight={600}>
        Upload Dataset
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Drag and drop your CSV or Excel file here, or click to browse.
      </Typography>

      <Button variant="contained" component="label" disabled={loading}>
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
            <Typography variant="body2" fontWeight={500}>
              {file.name} ({formatFileSize(file.size)})
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No file selected
          </Typography>
        )}
      </Box>

      <Box mt={3}>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpload}
          disabled={loading || !file}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? "Analyzing..." : "Analyze Dataset"}
        </Button>
      </Box>
    </Paper>
  );
}