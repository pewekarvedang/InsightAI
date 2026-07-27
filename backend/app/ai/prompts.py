def business_prompt(metrics):

    return f"""
You are a senior business analyst.

Analyze the following business metrics.

Total Revenue:
{metrics["total_revenue"]}

Total Profit:
{metrics["total_profit"]}

Top Product:
{metrics["top_product"]}

Top Region:
{metrics["top_region"]}

Average Order Value:
{metrics["average_order_value"]}

Generate:

1. Executive Summary

2. Strengths

3. Weaknesses

4. Recommendations

5. Risks

Respond professionally.
"""