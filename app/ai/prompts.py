def business_prompt(metrics: dict) -> str:
    """Generate an enhanced, highly structured prompt for business intelligence analysis.

    Calculates profit margin when both revenue and profit are present and structures the output
    request for an executive-level analysis.
    """
    revenue = metrics.get("total_revenue", 0)
    profit = metrics.get("total_profit", 0)
    orders = metrics.get("total_orders", 0)
    aov = metrics.get("average_order_value", 0)
    top_prod = metrics.get("top_product", "N/A")
    top_reg = metrics.get("top_region", "N/A")

    # Calculate profit margin if revenue and profit are available
    if isinstance(revenue, (int, float)) and isinstance(profit, (int, float)) and revenue > 0:
        margin_pct = (profit / revenue) * 100
        margin_text = f"{margin_pct:.2f}%"
    else:
        margin_text = "N/A"

    rev_str = f"₹{revenue:,.2f}" if isinstance(revenue, (int, float)) else str(revenue)
    prof_str = f"₹{profit:,.2f}" if isinstance(profit, (int, float)) else str(profit)
    aov_str = f"₹{aov:,.2f}" if isinstance(aov, (int, float)) else str(aov)

    # Top products breakdown
    sales_by_product = metrics.get("sales_by_product", [])
    if sales_by_product:
        prod_breakdown = "\n".join(
            f"  - {item.get('name')}: ₹{item.get('sales', 0):,.2f}"
            for item in sales_by_product[:5]
        )
    else:
        prod_breakdown = "  - Not available"

    # Top regions breakdown
    sales_by_region = metrics.get("sales_by_region", [])
    if sales_by_region:
        reg_breakdown = "\n".join(
            f"  - {item.get('name')}: ₹{item.get('sales', 0):,.2f}"
            for item in sales_by_region[:5]
        )
    else:
        reg_breakdown = "  - Not available"

    return f"""You are a senior business intelligence consultant and strategic analyst.

Analyze the following business performance metrics and provide an executive-ready strategic report.

### KEY METRICS:
- Total Revenue: {rev_str}
- Total Profit: {prof_str}
- Profit Margin: {margin_text}
- Total Orders: {orders}
- Average Order Value (AOV): {aov_str}
- Top Performing Product: {top_prod}
- Top Performing Region: {top_reg}

### TOP PRODUCTS BY SALES:
{prod_breakdown}

### TOP REGIONS BY SALES:
{reg_breakdown}

Please organize your analysis into the following clear sections:
1. Executive Summary: High-level overview of overall business performance, profitability, and health.
2. Financial & Profitability Analysis: Detailed evaluation of revenue, profit margins, and average order value.
3. Core Strengths & Growth Drivers: Key drivers behind top-selling products and leading regions.
4. Vulnerabilities & Areas for Improvement: Margin compression, product/regional over-reliance, or underperformance.
5. Strategic Recommendations: 3 to 5 concrete, actionable initiatives to drive revenue and enhance margins.
6. Risk Factors & Mitigation: Key operational and market risks to monitor.

Respond in a professional, data-driven, and actionable business tone.
"""