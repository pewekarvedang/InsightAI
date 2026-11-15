import pandas as pd
from .dashboard_service import generate_dashboard


def compare_datasets(df_a: pd.DataFrame, df_b: pd.DataFrame, label_a: str = "Period A", label_b: str = "Period B") -> dict:
    """Compare two datasets (e.g. QoQ, YoY, or Budget vs Actual) and compute
    growth rates, margin expansion/contraction, and top gaining/declining entities.
    """
    dash_a = generate_dashboard(df_a)
    dash_b = generate_dashboard(df_b)

    rev_a = float(dash_a.get("total_revenue", 0.0))
    rev_b = float(dash_b.get("total_revenue", 0.0))
    rev_delta = round(rev_b - rev_a, 2)
    rev_growth_pct = round(((rev_b - rev_a) / max(rev_a, 1.0)) * 100, 2) if rev_a > 0 else 0.0

    profit_a = dash_a.get("total_profit")
    profit_b = dash_b.get("total_profit")
    if profit_a is not None and profit_b is not None:
        profit_delta = round(float(profit_b) - float(profit_a), 2)
        profit_growth_pct = round((profit_delta / max(abs(float(profit_a)), 1.0)) * 100, 2)
    else:
        profit_delta = None
        profit_growth_pct = None

    orders_a = int(dash_a.get("total_orders", 0))
    orders_b = int(dash_b.get("total_orders", 0))
    orders_delta = orders_b - orders_a
    orders_growth_pct = round((orders_delta / max(orders_a, 1)) * 100, 1) if orders_a > 0 else 0.0

    aov_a = float(dash_a.get("average_order_value", 0.0))
    aov_b = float(dash_b.get("average_order_value", 0.0))
    aov_delta = round(aov_b - aov_a, 2)
    aov_growth_pct = round((aov_delta / max(aov_a, 1.0)) * 100, 1) if aov_a > 0 else 0.0

    # Margin delta
    margin_a = dash_a.get("profit_margin_pct")
    margin_b = dash_b.get("profit_margin_pct")
    margin_delta = round(float(margin_b) - float(margin_a), 2) if (margin_a is not None and margin_b is not None) else None

    # Product Performance Shifts
    prods_a = {p["name"]: p["sales"] for p in dash_a.get("sales_by_product", [])}
    prods_b = {p["name"]: p["sales"] for p in dash_b.get("sales_by_product", [])}
    all_prods = set(prods_a.keys()).union(set(prods_b.keys()))

    prod_variances = []
    for p_name in all_prods:
        s_a = prods_a.get(p_name, 0.0)
        s_b = prods_b.get(p_name, 0.0)
        delta = round(s_b - s_a, 2)
        pct = round((delta / max(s_a, 1.0)) * 100, 1) if s_a > 0 else 100.0 if s_b > 0 else 0.0
        prod_variances.append({
            "name": p_name,
            "sales_a": s_a,
            "sales_b": s_b,
            "delta": delta,
            "growth_pct": pct,
        })

    # Sort gainers and decliners
    top_gainers = sorted([p for p in prod_variances if p["delta"] > 0], key=lambda x: x["delta"], reverse=True)[:5]
    top_decliners = sorted([p for p in prod_variances if p["delta"] < 0], key=lambda x: x["delta"])[:5]

    # Side-by-side metric comparison list for UI rendering
    kpi_comparison = [
        {
            "metric": "Total Revenue",
            "val_a": rev_a,
            "val_b": rev_b,
            "delta": rev_delta,
            "growth_pct": rev_growth_pct,
            "type": "currency",
            "is_positive": rev_delta >= 0,
        },
        {
            "metric": "Transaction Volume",
            "val_a": orders_a,
            "val_b": orders_b,
            "delta": orders_delta,
            "growth_pct": orders_growth_pct,
            "type": "number",
            "is_positive": orders_delta >= 0,
        },
        {
            "metric": "Average Order Value (AOV)",
            "val_a": aov_a,
            "val_b": aov_b,
            "delta": aov_delta,
            "growth_pct": aov_growth_pct,
            "type": "currency",
            "is_positive": aov_delta >= 0,
        },
    ]

    if profit_delta is not None:
        kpi_comparison.insert(1, {
            "metric": "Net Earnings",
            "val_a": profit_a,
            "val_b": profit_b,
            "delta": profit_delta,
            "growth_pct": profit_growth_pct,
            "type": "currency",
            "is_positive": profit_delta >= 0,
        })

    if margin_delta is not None:
        kpi_comparison.insert(2, {
            "metric": "Profit Margin Yield",
            "val_a": margin_a,
            "val_b": margin_b,
            "delta": margin_delta,
            "growth_pct": margin_delta,  # percentage points
            "type": "percentage",
            "is_positive": margin_delta >= 0,
        })

    # Side-by-side Top Products Chart Data
    comparison_chart_data = []
    top_overall = sorted(prod_variances, key=lambda x: max(x["sales_a"], x["sales_b"]), reverse=True)[:8]
    for p in top_overall:
        comparison_chart_data.append({
            "name": p["name"][:18],
            f"{label_a}": p["sales_a"],
            f"{label_b}": p["sales_b"],
            "delta": p["delta"],
        })

    # Strategic Variance Insights
    insights = []
    if rev_growth_pct > 0:
        insights.append(f"Revenue expanded by +{rev_growth_pct}% (+Rs. {rev_delta:,.2f}) compared to {label_a}.")
    elif rev_growth_pct < 0:
        insights.append(f"Revenue contracted by {rev_growth_pct}% (-Rs. {abs(rev_delta):,.2f}) compared to {label_a}.")
    else:
        insights.append(f"Revenue held steady with negligible variance between periods.")

    if top_gainers:
        insights.append(f"Leading growth engine: '{top_gainers[0]['name']}' with +Rs. {top_gainers[0]['delta']:,.2f} incremental sales.")
    if top_decliners:
        insights.append(f"Greatest margin headwind: '{top_decliners[0]['name']}' declined by -Rs. {abs(top_decliners[0]['delta']):,.2f}.")

    return {
        "label_a": label_a,
        "label_b": label_b,
        "kpi_comparison": kpi_comparison,
        "top_gainers": top_gainers,
        "top_decliners": top_decliners,
        "chart_data": comparison_chart_data,
        "insights": insights,
        "period_a_summary": {
            "revenue": rev_a,
            "orders": orders_a,
            "top_product": dash_a.get("top_product"),
            "top_region": dash_a.get("top_region"),
        },
        "period_b_summary": {
            "revenue": rev_b,
            "orders": orders_b,
            "top_product": dash_b.get("top_product"),
            "top_region": dash_b.get("top_region"),
        }
    }
