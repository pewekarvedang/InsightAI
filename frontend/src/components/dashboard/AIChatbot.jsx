import { useState, useRef, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import api from "../../services/api";

const QUICK_PROMPTS = [
  "What are our top revenue drivers?",
  "What is our profit margin and how healthy is it?",
  "Which regions or products are underperforming?",
  "Detect anomalies and loss-making transactions",
  "Give me 5 actionable recommendations to boost revenue",
];

export default function AIChatbot({ dashboard }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState(QUICK_PROMPTS);
  const messagesEndRef = useRef(null);

  // Ollama Model Configuration State
  const [aiStatus, setAiStatus] = useState(null);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemma3:4b");
  const [customModel, setCustomModel] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState("");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const fetchAiStatus = async () => {
    try {
      const res = await api.get("/ai/status");
      setAiStatus(res.data);
      if (res.data.active_model) {
        setSelectedModel(res.data.active_model);
      }
    } catch (e) {
      console.warn("Could not fetch AI status", e);
    }
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  const handleSaveModel = async () => {
    const modelToSet = customModel.trim() || selectedModel;
    if (!modelToSet) return;
    setSavingModel(true);
    try {
      const res = await api.post("/ai/model", { model: modelToSet });
      setAiStatus((prev) => ({ ...prev, active_model: res.data.active_model }));
      setSelectedModel(res.data.active_model);
      setCustomModel("");
      setModelDialogOpen(false);
    } catch (e) {
      console.error("Failed to update AI model", e);
    } finally {
      setSavingModel(false);
    }
  };

  const handlePullModel = async () => {
    const modelToPull = customModel.trim() || selectedModel;
    if (!modelToPull) return;
    setPulling(true);
    setPullMessage("");
    try {
      const res = await api.post("/ai/pull", { model: modelToPull });
      setPullMessage(res.data.message || `Started pulling '${modelToPull}' in background.`);
      setTimeout(() => {
        setPulling(false);
        fetchAiStatus();
      }, 6000);
    } catch (e) {
      console.error("Failed to pull model", e);
      setPulling(false);
    }
  };

  const handleCopyCommand = () => {
    const cmd = `ollama run ${customModel.trim() || selectedModel}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  // Initialize with an introductory greeting based on dataset
  useEffect(() => {
    if (dashboard && messages.length === 0) {
      const rev = dashboard.total_revenue ? `₹${Number(dashboard.total_revenue).toLocaleString("en-IN")}` : "N/A";
      const topP = dashboard.top_product || "your catalog";
      const initialGreeting = {
        role: "assistant",
        content: `👋 Hello! I am **InsightAI Business Analyst**.\n\nI have thoroughly audited your dataset containing **${dashboard.total_orders || 0} orders** generating **${rev}** in revenue, led by **${topP}**.\n\nAsk me anything about your revenue trends, profit margins, regional performance, anomalies, or growth strategies!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "analytical_engine",
      };
      setMessages([initialGreeting]);
    }
  }, [dashboard, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const query = questionText || input;
    if (!query || !query.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        question: query.trim(),
        dashboard: dashboard,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
        source: response.data.source || "analytical_engine",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.data.suggested_questions && response.data.suggested_questions.length > 0) {
        setSuggestedPrompts(response.data.suggested_questions);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = {
        role: "assistant",
        content: "⚠️ I encountered an issue retrieving the analysis. Please ensure the backend is reachable and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetChat = () => {
    const rev = dashboard.total_revenue ? `₹${Number(dashboard.total_revenue).toLocaleString("en-IN")}` : "N/A";
    const initialGreeting = {
      role: "assistant",
      content: `👋 Session reset. Ready to analyze your dataset (**${rev}** total revenue). What business question can I answer for you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "analytical_engine",
    };
    setMessages([initialGreeting]);
    setSuggestedPrompts(QUICK_PROMPTS);
  };

  // Render markdown-like text with bolding and bullet points cleanly
  const renderFormattedText = (text) => {
    const lines = text.split(/\r?\n/);
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
        {lines.map((line, idx) => {
          if (!line.trim()) return <Box key={idx} sx={{ height: 6 }} />;

          // Header lines ### or ####
          if (line.startsWith("### ")) {
            return (
              <Typography key={idx} variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mt: 1 }}>
                {line.replace("### ", "")}
              </Typography>
            );
          }
          if (line.startsWith("#### ")) {
            return (
              <Typography key={idx} variant="subtitle2" fontWeight={700} color="#334155" sx={{ mt: 0.5 }}>
                {line.replace("#### ", "")}
              </Typography>
            );
          }

          // Bullet point
          const isBullet = line.startsWith("- ") || line.startsWith("* ");
          const cleanLine = isBullet ? line.slice(2) : line;

          // Replace **bold** with <strong>
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

          return (
            <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              {isBullet && (
                <Typography component="span" sx={{ color: "#2563eb", fontWeight: 700, lineHeight: 1.6 }}>
                  •
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.6 }}>
                {parts.map((part, pIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={pIdx} style={{ color: "#0f172a" }}>
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                })}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Paper
      elevation={3}
      sx={{
        mt: 4,
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.07)",
        display: "flex",
        flexDirection: "column",
        height: "720px",
      }}
    >
      {/* Chatbot Header */}
      <Box
        sx={{
          p: 2.5,
          backgroundColor: "#0f172a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              position: "relative",
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#ffffff", fontSize: 22 }} />
            <Box
              sx={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "2px solid #0f172a",
              }}
            />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#ffffff">
                InsightAI Analyst
              </Typography>
              <Chip
                label="Online"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Conversational Business Intelligence grounded in your uploaded dataset
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: "14px !important", color: "#60a5fa" }} />}
            label={`Ollama: ${aiStatus?.active_model || "gemma3:4b"}`}
            size="small"
            onClick={() => setModelDialogOpen(true)}
            sx={{
              height: 24,
              fontSize: "0.74rem",
              backgroundColor: "rgba(37, 99, 235, 0.25)",
              color: "#93c5fd",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              fontWeight: 600,
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(37, 99, 235, 0.45)" },
            }}
          />
          <Tooltip title="Configure AI Model">
            <IconButton
              size="small"
              onClick={() => setModelDialogOpen(true)}
              sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" } }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Conversation">
            <Button
              size="small"
              onClick={handleResetChat}
              startIcon={<RestartAltIcon />}
              sx={{
                color: "#94a3b8",
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { color: "#ffffff", backgroundColor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              Clear Chat
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Suggested Quick Prompt Chips */}
      <Box
        sx={{
          p: 1.5,
          px: 2.5,
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: 1,
          overflowX: "auto",
          whiteSpace: "nowrap",
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: 4 },
        }}
      >
        <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ flexShrink: 0, mr: 0.5 }}>
          SUGGESTIONS:
        </Typography>
        {suggestedPrompts.map((prompt, pIdx) => (
          <Chip
            key={pIdx}
            label={prompt}
            size="small"
            onClick={() => handleSend(prompt)}
            clickable
            sx={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontWeight: 500,
              fontSize: "0.78rem",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "rgba(37, 99, 235, 0.08)",
                borderColor: "#2563eb",
                color: "#1d4ed8",
              },
            }}
          />
        ))}
      </Box>

      {/* Chat Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 3,
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <Box
              key={idx}
              sx={{
                display: "flex",
                flexDirection: isUser ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              {/* Avatar */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  backgroundColor: isUser ? "#2563eb" : "#0f172a",
                  color: "#ffffff",
                }}
              >
                {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
              </Box>

              {/* Message Bubble */}
              <Box sx={{ maxWidth: { xs: "85%", sm: "75%" } }}>
                <Paper
                  elevation={isUser ? 2 : 1}
                  sx={{
                    p: 2,
                    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    backgroundColor: isUser ? "#2563eb" : "#ffffff",
                    color: isUser ? "#ffffff" : "#1e293b",
                    border: isUser ? "none" : "1px solid #e2e8f0",
                  }}
                >
                  {isUser ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                      {msg.content}
                    </Typography>
                  ) : (
                    renderFormattedText(msg.content)
                  )}
                </Paper>

                {/* Bubble Footer */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isUser ? "flex-end" : "space-between",
                    gap: 1,
                    mt: 0.5,
                    px: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    {msg.timestamp}
                  </Typography>

                  {!isUser && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={msg.source === "ollama" ? "Gemma 3 LLM" : "Analytical Engine"}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.62rem",
                          backgroundColor: msg.source === "ollama" ? "rgba(124, 58, 237, 0.1)" : "rgba(37, 99, 235, 0.08)",
                          color: msg.source === "ollama" ? "#6d28d9" : "#1d4ed8",
                          fontWeight: 600,
                        }}
                      />

                      <Tooltip title={copiedIndex === idx ? "Copied!" : "Copy response"}>
                        <IconButton size="small" onClick={() => handleCopy(msg.content, idx)} sx={{ p: 0.2 }}>
                          {copiedIndex === idx ? (
                            <CheckIcon sx={{ fontSize: 14, color: "#10b981" }} />
                          ) : (
                            <ContentCopyIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: "4px 16px 16px 16px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={18} thickness={5} sx={{ color: "#2563eb" }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Analyzing dataset metrics & formulating insights...
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask any question about your sales, margins, top products, or growth recommendations..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            "&:hover": { backgroundColor: "#1d4ed8" },
            "&.Mui-disabled": { backgroundColor: "#e2e8f0", color: "#94a3b8" },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Model Configuration Modal */}
      <Dialog
        open={modelDialogOpen}
        onClose={() => setModelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: "#2563eb" }} />
          Configure Ollama AI Model
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          <Alert severity={aiStatus?.ollama_available ? "success" : "warning"} sx={{ borderRadius: 2 }}>
            {aiStatus?.ollama_available
              ? "Ollama service is connected and ready on localhost:11434."
              : "Ollama service is not detected on port 11434. Start Ollama to enable local LLM inference."}
          </Alert>

          <FormControl fullWidth size="small">
            <InputLabel id="model-select-label">Select Active AI Model</InputLabel>
            <Select
              labelId="model-select-label"
              value={selectedModel}
              label="Select Active AI Model"
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setCustomModel("");
              }}
            >
              <MenuItem value="gemma3:4b">gemma3:4b (Google Gemma 3 4B - Recommended)</MenuItem>
              <MenuItem value="gemma4">gemma4 (Google Gemma 4)</MenuItem>
              <MenuItem value="gemma:4b">gemma:4b (Gemma 4B Parameter)</MenuItem>
              <MenuItem value="gemma2:2b">gemma2:2b (Gemma 2 2B Lightweight)</MenuItem>
              <MenuItem value="gemma2:9b">gemma2:9b (Gemma 2 9B High Quality)</MenuItem>
              <MenuItem value="gemma2">gemma2 (Gemma 2 Standard)</MenuItem>
              <MenuItem value="llama3">llama3 (Meta Llama 3 8B)</MenuItem>
              <MenuItem value="phi3">phi3 (Microsoft Phi-3)</MenuItem>
              {aiStatus?.installed_models?.map((m) =>
                !["gemma3:4b", "gemma4", "gemma:4b", "gemma2:2b", "gemma2:9b", "gemma2", "llama3", "phi3"].includes(m) ? (
                  <MenuItem key={m} value={m}>
                    {m} (Installed Locally)
                  </MenuItem>
                ) : null
              )}
            </Select>
          </FormControl>

          <TextField
            label="Or Enter Custom Model Name / Tag"
            placeholder="e.g. gemma4, gemma3:4b, gemma:4b, mistral"
            size="small"
            fullWidth
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            helperText="Specify any custom Ollama model tag."
          />

          <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Typography variant="caption" fontWeight={700} color="#475569" sx={{ display: "block", mb: 0.8 }}>
              TERMINAL COMMAND TO PULL & RUN MODEL:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography
                variant="body2"
                component="code"
                sx={{
                  backgroundColor: "#0f172a",
                  color: "#38bdf8",
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 1.5,
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  flex: 1,
                  overflowX: "auto",
                }}
              >
                ollama run {customModel.trim() || selectedModel}
              </Typography>
              <Tooltip title={copiedCmd ? "Copied!" : "Copy Command"}>
                <IconButton onClick={handleCopyCommand} color={copiedCmd ? "success" : "primary"}>
                  {copiedCmd ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {pullMessage && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {pullMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={handlePullModel}
            disabled={pulling}
            startIcon={pulling ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
            sx={{ textTransform: "none", mr: "auto" }}
          >
            {pulling ? "Pulling..." : "Pull in Background"}
          </Button>
          <Button onClick={() => setModelDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveModel}
            disabled={savingModel}
            sx={{ textTransform: "none", backgroundColor: "#2563eb" }}
          >
            {savingModel ? "Saving..." : "Set Active Model"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
