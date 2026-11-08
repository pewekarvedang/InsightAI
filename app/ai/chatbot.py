import re
import ollama
from .llm import get_active_model, get_installed_models, set_active_model


def build_system_context(dashboard: dict) -> str:
    """Build a rich, structured dataset context prompt for the AI Business Analyst."""
    mode = dashboard.get("metric_mode", "currency")
    rev = dashboard.get("total_revenue", 0)
    profit = dashboard.get("total_profit")
    profit_label = dashboard.get("profit_label") or "Net Profit"
    margin = dashboard.get("profit_margin_pct")
    orders = dashboard.get("total_orders", 0)
    aov = dashboard.get("average_order_value", 0)
    top_p = dashboard.get("top_product", "N/A")
    top_r = dashboard.get("top_region", "N/A")
    top_c = dashboard.get("top_category", "N/A")

    if mode == "volume":
        products_str = ", ".join(f"{p['name']} ({p['sales']} records)" for p in dashboard.get("sales_by_product", [])[:5])
        regions_str = ", ".join(f"{r['name']} ({r['sales']} records)" for r in dashboard.get("sales_by_region", [])[:5])
        categories_str = ", ".join(f"{c['name']} ({c['value']} records, {c['percentage']}%)" for c in dashboard.get("sales_by_category", [])[:5])
    else:
        products_str = ", ".join(f"{p['name']} (₹{p['sales']:,.2f})" for p in dashboard.get("sales_by_product", [])[:5])
        regions_str = ", ".join(f"{r['name']} (₹{r['sales']:,.2f})" for r in dashboard.get("sales_by_region", [])[:5])
        categories_str = ", ".join(f"{c['name']} (₹{c['value']:,.2f}, {c['percentage']}%)" for c in dashboard.get("sales_by_category", [])[:5])

    time_series_str = ", ".join(f"{t['period']}: {t['sales']}" for t in dashboard.get("time_series", [])[:6])

    anomalies_str = "; ".join(f"{a['title']}: {a['description']}" for a in dashboard.get("anomalies", []))
    swot = dashboard.get("swot_analysis", {})
    strengths_str = "; ".join(swot.get("strengths", []))
    weaknesses_str = "; ".join(swot.get("weaknesses", []))

    if mode == "volume":
        facts = f"""[CATALOG DISTRIBUTION FACTS]
- Total Records: {orders}
- Top Master Entity: {top_p}
- Top Region: {top_r}
- Top Category: {top_c}"""
    else:
        profit_str = f"₹{profit:,.2f} ({profit_label})" if profit is not None else "N/A"
        margin_str = f"{margin}%" if margin is not None else "N/A"
        facts = f"""[BUSINESS PERFORMANCE FACTS]
- Total Revenue: ₹{rev:,.2f}
- Total Net Profit: {profit_str}
- Overall Profit Margin: {margin_str}
- Total Transaction Volume: {orders} orders
- Average Order Value (AOV): ₹{aov:,.2f}
- Top Product: {top_p}
- Top Region: {top_r}
- Top Category: {top_c}"""

    return f"""You are InsightAI, an elite Senior Business Intelligence Analyst & Corporate Strategy Advisor.
You have analyzed a company's business dataset. Here are the exact ground-truth verified figures:

{facts}

[TOP ENTITIES / PRODUCTS]
{products_str if products_str else 'N/A'}

[REGIONAL PERFORMANCE]
{regions_str if regions_str else 'N/A'}

[CATEGORY DISTRIBUTION]
{categories_str if categories_str else 'N/A'}

[TIME TRENDS]
{time_series_str if time_series_str else 'N/A'}

[RISKS & ANOMALIES]
{anomalies_str if anomalies_str else 'None detected'}

[KEY STRENGTHS & WEAKNESSES]
- Strengths: {strengths_str}
- Weaknesses: {weaknesses_str}

GUIDELINES:
1. Always base your answers on the verified dataset numbers above.
2. Provide concise, professional, data-driven responses with markdown bullet points and bold numbers.
3. When asked for advice, give strategic, high-ROI business recommendations.
"""


def analytical_fallback_reply(question: str, dashboard: dict) -> dict:
    """Intelligent analytical query engine that answers business questions directly
    from computed metrics when Ollama is offline or unavailable.
    """
    q = question.lower().strip()
    mode = dashboard.get("metric_mode", "currency")
    rev = dashboard.get("total_revenue", 0)
    profit = dashboard.get("total_profit")
    profit_label = dashboard.get("profit_label") or "Net Profit"
    margin = dashboard.get("profit_margin_pct")
    orders = dashboard.get("total_orders", 0)
    aov = dashboard.get("average_order_value", 0)
    top_p = dashboard.get("top_product", "N/A")
    top_r = dashboard.get("top_region", "N/A")
    top_c = dashboard.get("top_category", "N/A")
    prods = dashboard.get("sales_by_product", [])
    regs = dashboard.get("sales_by_region", [])
    cats = dashboard.get("sales_by_category", [])
    ts = dashboard.get("time_series", [])
    anomalies = dashboard.get("anomalies", [])
    swot = dashboard.get("swot_analysis", {})

    # Intent 1: Revenue, Sales, Turnover
    if any(k in q for k in ["revenue", "sales", "turnover", "how much did we sell", "total earn", "records", "volume"]):
        if mode == "volume":
            reply = (
                f"### 📊 Master Record Volume Overview\n\n"
                f"- **Total Records**: **{orders}** master entries recorded.\n"
                f"- **Lead Entity Anchor**: **{top_p}**\n"
                f"- **Primary Geographic Market**: **{top_r}**\n\n"
            )
            if prods:
                reply += "**Top 3 Distribution Leaders:**\n"
                for p in prods[:3]:
                    reply += f"- **{p['name']}**: {p['sales']} entries ({round(p['sales']/max(orders,1)*100, 1)}% of total)\n"
            suggested = ["Which region has the highest density?", "Show category breakdown", "What are the key catalog strengths?"]
            return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

        reply = (
            f"### 📊 Revenue Performance Overview\n\n"
            f"- **Total Revenue**: **₹{rev:,.2f}** across **{orders}** recorded orders.\n"
            f"- **Average Order Value (AOV)**: **₹{aov:,.2f}** per transaction.\n"
            f"- **Top Revenue Driver**: **{top_p}** leading the catalog.\n\n"
        )
        if prods:
            reply += "**Top 3 Revenue Contributors:**\n"
            for p in prods[:3]:
                reply += f"- **{p['name']}**: ₹{p['sales']:,.2f} ({round(p['sales']/max(rev,1)*100, 1)}% of total)\n"
        suggested = ["What is our net profit and margin?", "Which region generates the most sales?", "Show product breakdown"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 2: Profit, Margins, Loss
    elif any(k in q for k in ["profit", "margin", "loss", "earnings", "net income"]):
        if profit is not None:
            margin_status = "Healthy" if margin and margin >= 15 else "Moderate" if margin and margin >= 8 else "Compressed"
            reply = (
                f"### 💰 Profitability & Margin Analysis\n\n"
                f"- **Total Net Profit**: **₹{profit:,.2f}** ({profit_label})\n"
                f"- **Overall Profit Margin**: **{margin}%** ({margin_status})\n"
                f"- **Average Profit per Order**: **₹{(profit/max(orders,1)):,.2f}**\n\n"
            )
            if prods and any("profit" in p for p in prods):
                reply += "**Product Profit Breakdown (Top 3):**\n"
                for p in prods[:3]:
                    reply += f"- **{p['name']}**: ₹{p.get('profit', 0):,.2f} profit ({p.get('margin_pct', 0)}% margin)\n"
            if dashboard.get("loss_making_products"):
                reply += "\n⚠️ **Unprofitable / Loss-Making Products:**\n"
                for lp in dashboard["loss_making_products"]:
                    reply += f"- **{lp['name']}**: Loss of ₹{abs(lp['loss']):,.2f}\n"
        else:
            reply = (
                f"### 💰 Profitability & Margin Analysis\n\n"
                f"The current dataset does not include explicit cost-of-goods (COGS) or net margin columns to compute net profit directly.\n\n"
                f"- **Total Recorded Revenue**: **₹{rev:,.2f}**\n"
                f"- **Total Transaction Volume**: **{orders}** orders\n"
                f"- **Average Order Value (AOV)**: **₹{aov:,.2f}**\n\n"
                f"💡 *Recommendation: Enrich your file with a Unit Cost or Profit column for bottom-line modeling.*"
            )
        suggested = ["How can we increase our profit margins?", "Which region generates the most sales?", "What are our revenue figures?"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 3: Best / Top Product
    elif any(k in q for k in ["best product", "top product", "best seller", "highest selling", "popular item", "products"]):
        reply = f"### 🏆 Product Performance Breakdown\n\n"
        reply += f"The best-performing product is **{top_p}**.\n\n"
        if prods:
            reply += "**Sales & Margin Leaderboard:**\n"
            for i, p in enumerate(prods[:5], 1):
                reply += f"{i}. **{p['name']}** — Sales: **₹{p['sales']:,.2f}** | Margin: **{p.get('margin_pct', 0)}%**\n"
        pareto = dashboard.get("pareto_analysis", {})
        if pareto.get("insight"):
            reply += f"\n💡 **Pareto Insight**: {pareto['insight']}\n"
        suggested = ["Which regions buy the top product?", "Show category distribution", "What are the biggest business risks?"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 4: Regions, Locations, Cities, Geography
    elif any(k in q for k in ["region", "city", "location", "area", "market", "where", "geography"]):
        reply = f"### 📍 Geographic & Regional Performance\n\n"
        reply += f"The leading regional market is **{top_r}**.\n\n"
        if regs:
            reply += "**Regional Sales Ranking:**\n"
            for i, r in enumerate(regs[:5], 1):
                share = round(r['sales'] / max(rev, 1) * 100, 1)
                reply += f"{i}. **{r['name']}**: ₹{r['sales']:,.2f} ({share}% share) | Margin: **{r.get('margin_pct', 0)}%**\n"
        suggested = ["Compare region profits", "What is the best selling product?", "Give me growth recommendations"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 5: Category, Segment
    elif any(k in q for k in ["category", "categories", "segment", "department"]):
        reply = f"### 📦 Category Performance Breakdown\n\n"
        if cats:
            for c in cats:
                reply += f"- **{c['name']}**: **₹{c['value']:,.2f}** ({c['percentage']}% of total sales)\n"
        else:
            reply += f"Leading category is **{top_c}**.\n"
        suggested = ["Which category has the highest profit?", "Show top products", "What are our total sales?"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 6: Time, Monthly, Trend, Seasonality
    elif any(k in q for k in ["trend", "month", "time", "date", "growth", "history", "seasonality"]):
        if ts:
            reply = f"### 📈 Period & Monthly Sales Trend\n\n"
            for t in ts:
                reply += f"- **{t['period']}**: Sales: **₹{t['sales']:,.2f}** | Profit: **₹{t['profit']:,.2f}**\n"
            best_period = max(ts, key=lambda x: x["sales"])
            reply += f"\n🚀 **Peak Performance Period**: **{best_period['period']}** with **₹{best_period['sales']:,.2f}** in sales.\n"
        else:
            reply = "### 📈 Trend Overview\n\nNo continuous date timestamp column was detected in this dataset to generate time-series analysis."
        suggested = ["What are our key strengths?", "What are our revenue figures?", "Show product performance"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 7: Anomalies, Risks, Threat, Weakness
    elif any(k in q for k in ["risk", "anomaly", "anomalies", "threat", "weakness", "problem", "bottleneck"]):
        reply = f"### ⚠️ Detected Risks & Anomalies\n\n"
        if anomalies:
            for a in anomalies:
                reply += f"#### 🚨 {a['title']}\n{a['description']}\n\n"
        if swot.get("weaknesses"):
            reply += "**Operational Vulnerabilities:**\n"
            for w in swot["weaknesses"]:
                reply += f"- {w}\n"
        if swot.get("threats"):
            reply += "\n**Market & Business Threats:**\n"
            for t in swot["threats"]:
                reply += f"- {t}\n"
        suggested = ["What strategic recommendations do you have?", "Which products are losing money?", "What are our strengths?"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Intent 8: Recommendations, Strategy, How to grow
    elif any(k in q for k in ["recommend", "strategy", "improve", "increase", "grow", "action", "advice", "how to"]):
        margin_lift_text = f"from {margin}%" if margin is not None else "by 3-5%"
        reply = (
            f"### 🎯 Strategic Business Recommendations\n\n"
            f"1. **Double Down on Top Driver ({top_p})**: Implement bundle cross-selling to lift Average Order Value from the current **₹{aov:,.2f}**.\n"
            f"2. **Regional Expansion**: Replicate the success of **{top_r}** into lower-volume regions through localized promotional campaigns.\n"
            f"3. **Margin Preservation**: Target an overall margin lift {margin_lift_text} by reviewing pricing and eliminating discounts on low-margin SKUs.\n"
            f"4. **Churn & Retention**: Target high-volume buyers with volume discount tiers rather than flat reductions.\n"
        )
        if dashboard.get("loss_making_products"):
            reply += f"5. **Eliminate Loss Leaders**: Re-evaluate pricing on {', '.join(p['name'] for p in dashboard['loss_making_products'][:2])} to stop gross profit bleeding.\n"
        suggested = ["What are our risks?", "Show profitability analysis", "Summarize the dataset"]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}

    # Default: Executive Summary
    else:
        if mode == "volume":
            reply = (
                f"### 📋 Executive Master Data Summary\n\n"
                f"Here is the high-level synthesis of your catalog/master dataset:\n\n"
                f"- **Total Records**: **{orders}** verified master entries\n"
                f"- **Primary Entity Anchor**: **{top_p}**\n"
                f"- **Primary Operational Territory**: **{top_r}**\n"
                f"- **Primary Category Segment**: **{top_c}**\n\n"
                f"Ask me any specific question about entity frequency, geographic distribution, category concentrations, or SWOT audit!"
            )
            suggested = [
                "What are our top entities by frequency?",
                "Which regions have the highest density?",
                "What are the key catalog strengths?",
                "Show category breakdown"
            ]
        else:
            profit_line = f"- **Net Profit**: **₹{profit:,.2f}** ({profit_label}, {margin}% margin)\n" if profit is not None else ""
            reply = (
                f"### 📋 Executive Business Intelligence Summary\n\n"
                f"Here is the high-level synthesis of your uploaded dataset:\n\n"
                f"- **Total Revenue**: **₹{rev:,.2f}** across **{orders}** transactions\n"
                f"{profit_line}"
                f"- **Average Order Value (AOV)**: **₹{aov:,.2f}**\n"
                f"- **Star Product**: **{top_p}**\n"
                f"- **Primary Regional Market**: **{top_r}**\n\n"
                f"Ask me any specific question about your sales trends, product rankings, regional margins, or strategic growth opportunities!"
            )
            suggested = [
                "What are our top revenue drivers?",
                "Which products or regions have the highest traction?",
                "Detect anomalies and outliers",
                "Give me 5 strategic recommendations"
            ]
        return {"answer": reply, "source": "analytical_engine", "suggested_questions": suggested}


def ask_business_chatbot(question: str, dashboard: dict, history: list = None) -> dict:
    """Entry point for the AI Business Analyst Chatbot.
    Tries Ollama local LLM first; if unavailable, falls back to the intelligent analytical engine.
    """
    if history is None:
        history = []

    model = get_active_model()

    # Attempt local Ollama inference
    try:
        system_prompt = build_system_context(dashboard)
        messages = [{"role": "system", "content": system_prompt}]

        # Append recent history (last 4 turns)
        for turn in history[-4:]:
            if "role" in turn and "content" in turn:
                messages.append({"role": turn["role"], "content": turn["content"]})

        messages.append({"role": "user", "content": question})

        response = ollama.chat(
            model=model,
            messages=messages,
            options={"temperature": 0.4}
        )
        llm_reply = response["message"]["content"]
        return {
            "answer": llm_reply,
            "source": f"ollama ({model})",
            "model": model,
            "suggested_questions": [
                "What are our biggest profit opportunities?",
                "Which product or region has the lowest margin?",
                "Detect anomalies in this dataset"
            ]
        }
    except Exception:
        # Check if another installed model can answer
        try:
            installed = get_installed_models()
            for alt_model in installed:
                if alt_model != model:
                    try:
                        response = ollama.chat(
                            model=alt_model,
                            messages=messages,
                            options={"temperature": 0.4}
                        )
                        llm_reply = response["message"]["content"]
                        set_active_model(alt_model)
                        return {
                            "answer": llm_reply,
                            "source": f"ollama ({alt_model})",
                            "model": alt_model,
                            "suggested_questions": [
                                "What are our biggest profit opportunities?",
                                "Which product or region has the lowest margin?",
                                "Detect anomalies in this dataset"
                            ]
                        }
                    except Exception:
                        continue
        except Exception:
            pass

        # Fall back to high-fidelity analytical engine
        fallback_res = analytical_fallback_reply(question, dashboard)
        fallback_res["model"] = model
        return fallback_res
