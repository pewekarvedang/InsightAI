export default function Insights({ dashboard }) {
  const insights = [
    `Total revenue generated is ₹${dashboard.total_revenue.toLocaleString()}.`,

    `Total profit earned is ₹${dashboard.total_profit.toLocaleString()}.`,

    `${dashboard.top_product} is the best-selling product.`,

    `${dashboard.top_region} generated the highest sales.`,

    `Average order value is ₹${dashboard.average_order_value.toFixed(2)}.`,
  ];

  return (
    <div
      style={{
        marginTop: "30px",
        background: "white",
        padding: "25px",
        borderRadius: "20px",
        boxShadow: "0 4px 10px rgba(0,0,0,.08)",
      }}
    >
      <h2>Business Insights</h2>

      <ul>
        {insights.map((item, index) => (
          <li key={index} style={{ marginBottom: "12px" }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}