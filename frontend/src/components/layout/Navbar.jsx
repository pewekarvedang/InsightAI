import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
} from "@mui/material";

import AnalyticsIcon from "@mui/icons-material/Analytics";

export default function Navbar() {
  return (
    <AppBar
      position="static"
      elevation={1}
      color="inherit"
    >
      <Toolbar>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexGrow={1}
        >
          <AnalyticsIcon color="primary" />

          <Typography
            variant="h6"
            fontWeight="bold"
          >
            InsightAI
          </Typography>
        </Box>

        <Avatar sx={{ bgcolor: "primary.main" }}>
          V
        </Avatar>

      </Toolbar>
    </AppBar>
  );
}