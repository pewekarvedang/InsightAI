import "./KPICards.css";
import { FaDollarSign, FaChartLine, FaShoppingCart, FaReceipt, FaBoxOpen, FaMapMarkedAlt } from "react-icons/fa";

export default function KPICards({ dashboard }) {
  const cards = [
    {
      title: "Total Revenue",
      value: `₹${dashboard.total_revenue.toLocaleString()}`,
      icon: <FaDollarSign />,
    },
    {
      title: "Total Profit",
      value: `₹${dashboard.total_profit.toLocaleString()}`,
      icon: <FaChartLine />,
    },
    {
      title: "Total Orders",
      value: dashboard.total_orders,
      icon: <FaShoppingCart />,
    },
    {
      title: "Average Order Value",
      value: `₹${dashboard.average_order_value.toFixed(2)}`,
      icon: <FaReceipt />,
    },
    {
      title: "Top Product",
      value: dashboard.top_product,
      icon: <FaBoxOpen />,
    },
    {
      title: "Top Region",
      value: dashboard.top_region,
      icon: <FaMapMarkedAlt />,
    }
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <div className="kpi-card" key={index}>
          <div className="kpi-icon">{card.icon}</div>
          <div>
            <h3>{card.title}</h3>
            <h2>{card.value}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}