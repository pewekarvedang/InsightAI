import { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Chip from "@mui/material/Chip";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

export default function AIReport({ report, loading }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          borderRadius: 3,
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box flex={1}>
            <Skeleton variant="text" width="220px" height={32} />
            <Skeleton variant="text" width="140px" height={20} />
          </Box>
        </Box>

        <Skeleton variant="text" width="95%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="85%" height={24} sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={56}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      </Paper>
    );
  }

  if (!report) return null;

  // Parse lines to detect numbered lists, bullet points, headers, and standard text
  const lines = report
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

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
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <AutoAwesomeIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1e293b">
              AI Business Intelligence Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Automated executive summary and analytical findings
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            icon={<AutoAwesomeIcon fontSize="small" />}
            label="AI Generated"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={handleCopy}
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            color={copied ? "success" : "primary"}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {copied ? "Copied!" : "Copy Report"}
          </Button>
        </Box>
      </Box>

      {/* Structured Content */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {lines.map((line, index) => {
          // Detect Numbered List e.g. "1. Revenue increased..." or "1) Summary..."
          const numberedMatch = line.match(/^(\d+)[.)]\s*(.*)$/);
          if (numberedMatch) {
            const itemNumber = numberedMatch[1];
            const itemText = numberedMatch[2];

            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#f1f5f9",
                    borderColor: "#cbd5e1",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    mt: 0.2,
                  }}
                >
                  {itemNumber}
                </Box>
                <Typography
                  variant="body1"
                  color="#334155"
                  sx={{ lineHeight: 1.7, fontWeight: 500 }}
                >
                  {itemText}
                </Typography>
              </Box>
            );
          }

          // Detect markdown subheader e.g. "### Heading" or "**Heading**"
          if (line.startsWith("###") || line.startsWith("##")) {
            return (
              <Typography
                key={index}
                variant="h6"
                fontWeight={700}
                color="#0f172a"
                mt={1}
              >
                {line.replace(/^#+\s*/, "")}
              </Typography>
            );
          }

          // Regular paragraph
          return (
            <Typography
              key={index}
              variant="body1"
              color="#475569"
              sx={{ lineHeight: 1.8, fontSize: "0.98rem" }}
            >
              {line}
            </Typography>
          );
        })}
      </Box>
    </Paper>
  );
}