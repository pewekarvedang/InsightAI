import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return "₹0";
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

function formatDecimalCurrency(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return "₹0.00";
  return `₹${Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Insights({ dashboard }) {
  if (!dashboard) return null;

  const isVolume = dashboard?.metric_mode === "volume";
  const hasProfit = dashboard?.total_profit !== null && dashboard?.total_profit !== undefined;
  const profitLabel = dashboard?.profit_label || "Total profit";

  const insightsList = [];

  if (isVolume) {
    insightsList.push({
      text: `Total catalog volume comprises ${Number(dashboard.total_orders).toLocaleString()} master records.`,
      icon: <TrendingUpIcon />,
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.1)",
    });
    if (dashboard?.top_product && dashboard.top_product !== "N/A") {
      insightsList.push({
        text: `'${dashboard.top_product}' is the most frequently recorded entity anchor.`,
        icon: <EmojiEventsIcon />,
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
      });
    }
    if (dashboard?.top_region && dashboard.top_region !== "N/A") {
      insightsList.push({
        text: `'${dashboard.top_region}' represents the leading geographic operational territory.`,
        icon: <LocationOnIcon />,
        color: "#9333ea",
        bgColor: "rgba(147, 51, 234, 0.1)",
      });
    }
    if (dashboard?.top_category && dashboard.top_category !== "N/A") {
      insightsList.push({
        text: `'${dashboard.top_category}' is the primary category segment across records.`,
        icon: <ShoppingCartIcon />,
        color: "#0d9488",
        bgColor: "rgba(13, 148, 136, 0.1)",
      });
    }
  } else {
    insightsList.push({
      text: `Total revenue generated is ${formatCurrency(dashboard.total_revenue)} across ${Number(dashboard.total_orders).toLocaleString()} recorded transactions.`,
      icon: <TrendingUpIcon />,
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.1)",
    });
    if (hasProfit) {
      insightsList.push({
        text: `${profitLabel} is ${formatCurrency(dashboard.total_profit)} (${dashboard.profit_margin_pct}% margin).`,
        icon: <MonetizationOnIcon />,
        color: "#16a34a",
        bgColor: "rgba(22, 163, 74, 0.1)",
      });
    }
    if (dashboard?.top_product && dashboard.top_product !== "N/A") {
      insightsList.push({
        text: `'${dashboard.top_product}' is the best-selling catalog item.`,
        icon: <EmojiEventsIcon />,
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
      });
    }
    if (dashboard?.top_region && dashboard.top_region !== "N/A") {
      insightsList.push({
        text: `'${dashboard.top_region}' generated the highest regional sales volume.`,
        icon: <LocationOnIcon />,
        color: "#9333ea",
        bgColor: "rgba(147, 51, 234, 0.1)",
      });
    }
    if (dashboard?.average_order_value != null) {
      insightsList.push({
        text: `Average order value (AOV) is ${formatDecimalCurrency(dashboard.average_order_value)} per transaction.`,
        icon: <ShoppingCartIcon />,
        color: "#0d9488",
        bgColor: "rgba(13, 148, 136, 0.1)",
      });
    }
  }

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          }}
        >
          <LightbulbIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            Business Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Key takeaways from your business dataset
          </Typography>
        </Box>
      </Box>

      <List sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 0 }}>
        {insightsList.map((item, index) => (
          <ListItem
            key={index}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#f1f5f9",
                transform: "translateX(4px)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  backgroundColor: item.bgColor,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1" sx={{ fontWeight: 500, color: "#334155" }}>
                  {item.text}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}