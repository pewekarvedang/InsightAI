import "./KPICards.css";
import Chip from "@mui/material/Chip";
import {
  FaDollarSign,
  FaChartLine,
  FaShoppingCart,
  FaReceipt,
  FaBoxOpen,
  FaMapMarkedAlt,
  FaPercentage,
} from "react-icons/fa";

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

function formatNumber(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return "0";
  return Number(val).toLocaleString("en-IN");
}

export default function KPICards({ dashboard }) {
  if (!dashboard) return null;

  const isVolume = dashboard?.metric_mode === "volume";
  const marginPct = dashboard?.profit_margin_pct ?? 0;
  const pareto = dashboard?.pareto_analysis?.share_percentage;
  const hasProfit = dashboard?.total_profit !== null && dashboard?.total_profit !== undefined;
  const profitLabel = dashboard?.profit_label || "Total Net Profit";

  let cards = [];

  if (isVolume) {
    cards = [
      {
        title: "Total Master Records",
        value: formatNumber(dashboard?.total_orders),
        subtitle: "Verified catalog / ledger entries",
        icon: <FaReceipt />,
        gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      },
      {
        title: "Lead Entity Anchor",
        value: dashboard?.top_product || "N/A",
        subtitle: "Highest frequency master record",
        icon: <FaBoxOpen />,
        gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
      },
      {
        title: "Primary Territory",
        value: dashboard?.top_region || "N/A",
        subtitle: "Top geographic concentration",
        icon: <FaMapMarkedAlt />,
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      },
      {
        title: "Primary Category",
        value: dashboard?.top_category || "N/A",
        subtitle: "Dominant classification segment",
        icon: <FaBoxOpen />,
        gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
      },
      {
        title: "Total Units / Density",
        value: `${formatNumber(dashboard?.total_orders)} Records`,
        subtitle: "Average 1.0 records per entry",
        icon: <FaShoppingCart />,
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      },
      {
        title: "Pareto Concentration",
        value: pareto ? `${pareto}% Volume` : `${formatNumber(dashboard?.total_orders)} Records`,
        subtitle: pareto ? "Driven by top 20% entities" : "Total dataset density",
        icon: <FaPercentage />,
        gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      },
    ];
  } else {
    cards = [
      {
        title: "Total Revenue",
        value: formatCurrency(dashboard?.total_revenue),
        subtitle: `${formatNumber(dashboard?.total_orders)} Transactions Recorded`,
        icon: <FaDollarSign />,
        gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      },
      {
        title: hasProfit ? profitLabel : "Total Units Sold",
        value: hasProfit ? formatCurrency(dashboard?.total_profit) : `${formatNumber(dashboard?.total_quantity)} Units`,
        badge: hasProfit ? `${marginPct}% Margin` : null,
        badgeColor: marginPct >= 15 ? "#10b981" : marginPct >= 5 ? "#f59e0b" : "#ef4444",
        subtitle: hasProfit ? "Calculated portfolio earnings" : "Total catalog units transacted",
        icon: hasProfit ? <FaChartLine /> : <FaShoppingCart />,
        gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
      },
      {
        title: "Average Order Value",
        value: formatDecimalCurrency(dashboard?.average_order_value),
        subtitle: "Mean revenue per transaction",
        icon: <FaReceipt />,
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      },
      {
        title: "Top Product Anchor",
        value: dashboard?.top_product || "N/A",
        subtitle: "Lead revenue contributor",
        icon: <FaBoxOpen />,
        gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
      },
      {
        title: "Top Regional Market",
        value: dashboard?.top_region || "N/A",
        subtitle: "Primary territory by demand",
        icon: <FaMapMarkedAlt />,
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      },
      {
        title: "Pareto Concentration",
        value: pareto ? `${pareto}% Revenue` : `${formatNumber(dashboard?.total_quantity)} Units`,
        subtitle: pareto ? "Driven by top 20% products" : "Total transaction volume",
        icon: pareto ? <FaPercentage /> : <FaShoppingCart />,
        gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      },
    ];
  }

  return (
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <div className="kpi-card" key={index}>
          <div className="kpi-icon" style={{ background: card.gradient }}>
            {card.icon}
          </div>
          <div className="kpi-content">
            <div className="kpi-header">
              <h3>{card.title}</h3>
              {card.badge && (
                <Chip
                  label={card.badge}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    backgroundColor: `${card.badgeColor}18`,
                    color: card.badgeColor,
                    border: `1px solid ${card.badgeColor}40`,
                  }}
                />
              )}
            </div>
            <h2>{card.value}</h2>
            {card.subtitle && <p className="kpi-subtitle">{card.subtitle}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
