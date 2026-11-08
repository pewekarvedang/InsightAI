import { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ShieldIcon from "@mui/icons-material/Shield";

export default function ExecutiveReport({ report, dashboard, loading }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const swot = dashboard?.swot_analysis || {
    strengths: ["Strong revenue foundation anchored by lead catalog items."],
    weaknesses: ["Concentration risk in dominant territory."],
    opportunities: ["Expand digital and regional footprint."],
    threats: ["Margin erosion from supply price variations."],
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 4, mt: 4, borderRadius: 3, backgroundColor: "#ffffff" }}>
        <Skeleton variant="text" width="40%" height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="85%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="75%" height={24} />
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* 1. Header Toolbar */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          backgroundColor: "#ffffff",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
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
            <AutoAwesomeIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              Executive Briefing & Strategic Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High-level strategic audit, SWOT matrix, and priority growth initiatives
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCopy}
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            color={copied ? "success" : "primary"}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            {copied ? "Copied!" : "Copy Full Report"}
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Print / Save PDF
          </Button>
        </Box>
      </Paper>

      {/* 2. 4-Quadrant Strategic SWOT Matrix */}
      <Box>
        <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
          🎯 Strategic SWOT Evaluation
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          {/* Strengths */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <CheckCircleIcon sx={{ color: "#059669", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#065f46">
                STRENGTHS (Core Competitive Advantages)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {swot.strengths?.map((s, idx) => (
                <Typography key={idx} variant="body2" color="#1e293b" sx={{ lineHeight: 1.5 }}>
                  • {s}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Weaknesses */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <WarningIcon sx={{ color: "#dc2626", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#991b1b">
                WEAKNESSES (Internal Vulnerabilities)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {swot.weaknesses?.map((w, idx) => (
                <Typography key={idx} variant="body2" color="#1e293b" sx={{ lineHeight: 1.5 }}>
                  • {w}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Opportunities */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "rgba(37, 99, 235, 0.05)",
              border: "1px solid rgba(37, 99, 235, 0.25)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <LightbulbIcon sx={{ color: "#2563eb", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#1e40af">
                OPPORTUNITIES (Growth & Expansion)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {swot.opportunities?.map((o, idx) => (
                <Typography key={idx} variant="body2" color="#1e293b" sx={{ lineHeight: 1.5 }}>
                  • {o}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Threats */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <ShieldIcon sx={{ color: "#d97706", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#92400e">
                THREATS (Market & Margin Risks)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {swot.threats?.map((t, idx) => (
                <Typography key={idx} variant="body2" color="#1e293b" sx={{ lineHeight: 1.5 }}>
                  • {t}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 3. Full Formatted AI Executive Report */}
      {report && (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
            📑 Comprehensive Executive Audit Findings
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {report.split(/\r?\n/).map((line, idx) => {
              if (!line.trim()) return <Box key={idx} sx={{ height: 6 }} />;

              if (line.startsWith("### ")) {
                return (
                  <Typography key={idx} variant="h6" fontWeight={700} color="#1e293b" sx={{ mt: 2, borderBottom: "1px solid #f1f5f9", pb: 0.5 }}>
                    {line.replace("### ", "")}
                  </Typography>
                );
              }
              if (line.startsWith("#### ")) {
                return (
                  <Typography key={idx} variant="subtitle1" fontWeight={700} color="#334155" sx={{ mt: 1 }}>
                    {line.replace("#### ", "")}
                  </Typography>
                );
              }

              const isBullet = line.startsWith("- ") || line.startsWith("* ");
              const cleanText = isBullet ? line.slice(2) : line;
              const parts = cleanText.split(/(\*\*.*?\*\*)/g);

              return (
                <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  {isBullet && (
                    <Typography component="span" sx={{ color: "#2563eb", fontWeight: 700 }}>
                      •
                    </Typography>
                  )}
                  <Typography variant="body1" sx={{ color: "#334155", lineHeight: 1.7 }}>
                    {parts.map((p, pIdx) => {
                      if (p.startsWith("**") && p.endsWith("**")) {
                        return <strong key={pIdx} style={{ color: "#0f172a" }}>{p.slice(2, -2)}</strong>;
                      }
                      return p;
                    })}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
