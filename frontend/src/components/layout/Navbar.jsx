import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";

import AnalyticsIcon from "@mui/icons-material/Analytics";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function Navbar() {
  return (
    <AppBar
      position="sticky"
      elevation={1}
      color="inherit"
      sx={{
        top: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexGrow: 1,
            cursor: "pointer",
          }}
        >
          <AnalyticsIcon color="primary" sx={{ fontSize: 28 }} />

          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(90deg, #2563eb, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            InsightAI
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="View on GitHub">
            <IconButton
              color="inherit"
              component="a"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>

          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: "0.95rem" }}>
            V
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}