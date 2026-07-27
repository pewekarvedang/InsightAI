import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb",
    },
    secondary: {
      main: "#14b8a6",
    },
    background: {
      default: "#f5f7fb",
    },
  },

  typography: {
    fontFamily: "Inter, Roboto, sans-serif",

    h4: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 14,
  },
});

export default theme;