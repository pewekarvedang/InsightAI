import pandas as pd
import numpy as np
from .data_profiler import profile_dataset

METRIC_BLACKLIST_SUBSTRINGS = [
    "id", "_id", "uuid", "guid", "code", "barcode", "ean", "upc",
    "no", "num", "number", "phone", "mobile", "contact",
    "lat", "latitude", "lon", "lng", "longitude", "coord", "deviation",
    "pincode", "pin", "zip", "postal", "serial", "sr",
    "year", "yr", "date", "time", "timestamp", "row", "index"
]

METRIC_WHITELIST_TERMS = [
    "amount", "revenue", "sales", "turnover", "profit", "margin",
    "target", "price", "discount", "spend", "cost", "fee", "val", "value"
]

GEOGRAPHIC_KEYWORDS = [
    "region", "zone", "state", "territory", "market", "area", "city",
    "country", "location", "district", "province"
]


def is_blacklisted_metric(col: str) -> bool:
    """Return True if column name represents an identifier, coordinate, or phone/code,
    unless it explicitly specifies a financial or business metric term.
    """
    col_str = str(col).lower().strip()
    col_words = set(col_str.replace("_", " ").replace("-", " ").split())

    if any(term in col_str for term in METRIC_WHITELIST_TERMS):
        return False

    for token in METRIC_BLACKLIST_SUBSTRINGS:
        if token in col_words or col_str.endswith(f"_{token}") or col_str.endswith(f" {token}"):
            return True
        if token in ["id", "no", "num", "phone", "latitude", "longitude", "coord", "deviation"] and token in col_str:
            return True

    return False


def is_id_or_hash_column(col_name: str, series: pd.Series) -> bool:
    """Return True if column appears to be a pure hash, link, or technical ID."""
    name = str(col_name).lower()
    if any(tok in name for tok in ["_id", "url", "link", "image", "img", "hash", "token"]):
        return True

    sample = series.dropna().astype(str).head(20)
    if len(sample) > 0 and all(
        len(s) > 8 and any(c.isdigit() for c in s) and any(c.isalpha() for c in s) and " " not in s
        for s in sample
    ):
        return True

    return False


def _match_column_priority(candidates, priority_groups):
    """Find the first column matching priority tiers in order."""
    for group in priority_groups:
        for kw in group:
            kw_clean = kw.lower().replace("_", "").replace(" ", "")
            for col in candidates:
                col_clean = str(col).lower().replace("_", "").replace(" ", "")
                if kw_clean in col_clean:
                    return col
    return None


def detect_columns(df: pd.DataFrame, profile: dict) -> dict:
    """Intelligently detect business columns using multi-tier ranked fuzzy matching,
    preventing technical IDs and phone numbers from being misidentified.
    """
    all_columns = list(df.columns)
    raw_numeric = profile.get("numeric_columns", [])
    raw_categorical = profile.get("categorical_columns", [])
    datetime_columns = profile.get("datetime_columns", [])

    # Filter out blacklisted numeric metrics (e.g. Order No, Phone No, Lat/Lng)
    valid_numeric = [c for c in raw_numeric if not is_blacklisted_metric(c)]

    # Filter out pure ID / hash columns from categorical analysis
    valid_categorical = [c for c in raw_categorical if not is_id_or_hash_column(c, df[c])]
    # Prioritize well-populated categorical columns (>25% non-null)
    well_populated_cat = [c for c in valid_categorical if df[c].dropna().count() >= len(df) * 0.25]
    if well_populated_cat:
        valid_categorical = well_populated_cat

    # 1. Date column
    date_priority = [
        ["order_date", "transaction_date", "invoice_date", "sale_date", "bill_date"],
        ["date", "timestamp", "created_at", "day", "month", "time"]
    ]
    date_col = _match_column_priority(datetime_columns, date_priority)
    if date_col is None:
        date_col = _match_column_priority(all_columns, date_priority)

    # 2. Sales / Revenue column
    sales_priority = [
        ["total_sales", "net_sales", "sale_value", "sales_value", "net_value",
         "net_value_tax_inclusive", "gross_value", "total_amount", "total_revenue",
         "revenue", "turnover", "discounted_price", "actual_sales"],
        ["sales", "amount", "order_value", "bill_amount", "invoice_amount"],
        ["price", "unit_price", "actual_price", "mrp", "rate", "cost", "target", "spend", "value"]
    ]
    sales_col = _match_column_priority(valid_numeric, sales_priority)
    if sales_col is None and valid_numeric:
        sales_col = valid_numeric[0]

    # 3. Profit column
    profit_priority = [
        ["net_profit", "gross_profit", "profit", "net_margin", "operating_profit", "margin_amount", "earnings"],
        ["margin", "markup"]
    ]
    remaining_numeric = [c for c in valid_numeric if c != sales_col]
    profit_col = _match_column_priority(remaining_numeric, profit_priority)

    # Check synthetic profit potential
    synthetic_profit_col = None
    profit_label = "Net Profit"
    if profit_col is None:
        # Check if actual_price (MRP) and discounted_price exist
        cols_lower = {str(c).lower(): c for c in df.columns}
        if "actual_price" in cols_lower and sales_col and "discount" in str(sales_col).lower():
            synthetic_profit_col = "__synthetic_discount_savings__"
            profit_label = "Discount Savings (MRP - Price)"
        elif sales_col and any(c in cols_lower for c in ["cost", "expense", "cogs"]):
            cost_c = next(cols_lower[c] for c in ["cost", "expense", "cogs"] if c in cols_lower)
            synthetic_profit_col = f"__synthetic_profit_{cost_c}__"
            profit_label = "Gross Profit (Sales - Cost)"

    # 4. Quantity column
    quantity_priority = [
        ["quantity", "qty", "units", "units_sold", "order_quantity", "count", "volume"]
    ]
    remaining_qty = [c for c in valid_numeric if c not in (sales_col, profit_col)]
    quantity_col = _match_column_priority(remaining_qty, quantity_priority)

    # 5. Region column (Strict geographic terms)
    region_priority = [
        ["region", "zone", "state", "territory", "market"],
        ["area", "city", "country", "location", "district", "province"]
    ]
    region_col = _match_column_priority(valid_categorical, region_priority)
    if region_col is None:
        remaining_all = [c for c in all_columns if c not in (sales_col, profit_col, quantity_col, date_col)]
        region_col = _match_column_priority(remaining_all, region_priority)

    # 6. Product column
    product_priority = [
        ["product_name", "item_name", "product_title", "title", "party_ledger_name",
         "outlet_name", "retailer_name", "store_name"],
        ["description", "product", "item", "sku", "name"]
    ]
    cat_for_product = [c for c in valid_categorical if c != region_col]
    product_col = _match_column_priority(cat_for_product, product_priority)
    if product_col is None and cat_for_product:
        product_col = cat_for_product[0]
    elif product_col is None and raw_categorical:
        product_col = raw_categorical[0]

    # 7. Category column
    category_priority = [
        ["category", "sub_category", "department", "dept", "segment", "type",
         "brand_name", "brand", "group", "class", "division"]
    ]
    cat_for_cat = [c for c in valid_categorical if c not in (region_col, product_col)]
    category_col = _match_column_priority(cat_for_cat, category_priority)
    if category_col is None and cat_for_cat:
        category_col = cat_for_cat[0]

    # 8. Customer column
    customer_priority = [
        ["customer_name", "customer", "client", "buyer", "account", "user_name", "user"]
    ]
    cat_for_cust = [c for c in valid_categorical if c not in (region_col, product_col, category_col)]
    customer_col = _match_column_priority(cat_for_cust, customer_priority)

    # Determine metric mode
    metric_mode = "currency" if sales_col and df[sales_col].dropna().sum() > 0 else "volume"

    return {
        "sales": sales_col,
        "profit": profit_col,
        "synthetic_profit": synthetic_profit_col,
        "profit_label": profit_label if (profit_col or synthetic_profit_col) else None,
        "product": product_col,
        "category": category_col,
        "region": region_col,
        "quantity": quantity_col,
        "date": date_col,
        "customer": customer_col,
        "metric_mode": metric_mode,
    }


def _clean_category_name(val: str) -> str:
    """Format category strings (e.g. taking top-level category from pipes and camel-cases)."""
    val_str = str(val).strip()
    if "|" in val_str:
        val_str = val_str.split("|")[0].strip()
    return val_str[:30]


def _clean_product_name(val: str) -> str:
    """Truncate excessively long product descriptions for readable chart axes."""
    val_str = str(val).strip()
    if len(val_str) > 42:
        return val_str[:39] + "..."
    return val_str


def generate_dashboard(df: pd.DataFrame):
    """Generate high-fidelity business intelligence metrics, multi-dimensional breakdowns,
    trend series, and strategic SWOT analysis from any dataset.
    """
    profile = profile_dataset(df)
    column_mapping = detect_columns(df, profile)

    sales_col = column_mapping["sales"]
    profit_col = column_mapping["profit"]
    synthetic_profit_col = column_mapping.get("synthetic_profit")
    profit_label = column_mapping.get("profit_label") or "Net Profit"
    product_col = column_mapping["product"]
    category_col = column_mapping["category"]
    region_col = column_mapping["region"]
    quantity_col = column_mapping["quantity"]
    date_col = column_mapping["date"]
    metric_mode = column_mapping["metric_mode"]

    total_orders = int(len(df))

    # =========================================================================
    # A. NUMERIC FINANCIAL MODE (Currency / Revenue)
    # =========================================================================
    if metric_mode == "currency" and total_orders > 0 and sales_col:
        sales_numeric = pd.to_numeric(df[sales_col], errors="coerce").fillna(0)
        total_revenue = float(round(sales_numeric.sum(), 2))
        average_order_value = float(round(sales_numeric.mean(), 2))

        # Profit computation (Actual or Synthetic)
        if profit_col:
            profit_numeric = pd.to_numeric(df[profit_col], errors="coerce").fillna(0)
            total_profit = float(round(profit_numeric.sum(), 2))
            profit_margin_pct = float(round((total_profit / total_revenue) * 100, 2)) if total_revenue > 0 else 0.0
        elif synthetic_profit_col == "__synthetic_discount_savings__":
            # MRP - Price
            cols_lower = {str(c).lower(): c for c in df.columns}
            actual_price_col = cols_lower.get("actual_price")
            actual_numeric = pd.to_numeric(df[actual_price_col], errors="coerce").fillna(sales_numeric)
            profit_numeric = (actual_numeric - sales_numeric).clip(lower=0)
            total_profit = float(round(profit_numeric.sum(), 2))
            profit_margin_pct = float(round((total_profit / total_revenue) * 100, 2)) if total_revenue > 0 else 0.0
        else:
            profit_numeric = None
            total_profit = None
            profit_margin_pct = None

        # Quantity computation
        if quantity_col:
            qty_numeric = pd.to_numeric(df[quantity_col], errors="coerce").fillna(0)
            total_quantity = int(qty_numeric.sum())
            avg_items_per_order = float(round(qty_numeric.mean(), 1))
        else:
            total_quantity = total_orders
            avg_items_per_order = 1.0

        # 1. Product Breakdown
        sales_by_product = []
        profit_by_product = []
        loss_making_products = []

        if product_col:
            temp_prod = pd.DataFrame({
                "name": df[product_col].astype(str).apply(_clean_product_name),
                "sales": sales_numeric,
            })
            if profit_numeric is not None:
                temp_prod["profit"] = profit_numeric

            if profit_numeric is not None:
                prod_grouped = (
                    temp_prod.groupby("name", as_index=False)[["sales", "profit"]]
                    .sum()
                    .sort_values(by="sales", ascending=False)
                )
            else:
                prod_grouped = (
                    temp_prod.groupby("name", as_index=False)[["sales"]]
                    .sum()
                    .sort_values(by="sales", ascending=False)
                )

            for _, row in prod_grouped.head(10).iterrows():
                p_sales = round(float(row["sales"]), 2)
                p_profit = round(float(row["profit"]), 2) if profit_numeric is not None else 0.0
                p_margin = round((p_profit / p_sales * 100), 1) if p_sales > 0 and profit_numeric is not None else 0.0
                sales_by_product.append({
                    "name": str(row["name"]),
                    "sales": p_sales,
                    "profit": p_profit,
                    "margin_pct": p_margin
                })

            if profit_numeric is not None:
                prof_sorted = prod_grouped.sort_values(by="profit", ascending=False)
                for _, row in prof_sorted.head(10).iterrows():
                    profit_by_product.append({
                        "name": str(row["name"]),
                        "profit": round(float(row["profit"]), 2)
                    })

                loss_rows = prod_grouped[prod_grouped["profit"] < 0].sort_values(by="profit", ascending=True)
                for _, row in loss_rows.head(5).iterrows():
                    loss_making_products.append({
                        "name": str(row["name"]),
                        "loss": round(float(row["profit"]), 2),
                        "sales": round(float(row["sales"]), 2)
                    })

        # 2. Regional Breakdown
        sales_by_region = []
        profit_by_region = []
        if region_col:
            temp_reg = pd.DataFrame({
                "name": df[region_col].astype(str).str.strip(),
                "sales": sales_numeric,
            })
            if profit_numeric is not None:
                temp_reg["profit"] = profit_numeric

            if profit_numeric is not None:
                reg_grouped = (
                    temp_reg.groupby("name", as_index=False)[["sales", "profit"]]
                    .sum()
                    .sort_values(by="sales", ascending=False)
                )
            else:
                reg_grouped = (
                    temp_reg.groupby("name", as_index=False)[["sales"]]
                    .sum()
                    .sort_values(by="sales", ascending=False)
                )

            for _, row in reg_grouped.head(10).iterrows():
                r_sales = round(float(row["sales"]), 2)
                r_profit = round(float(row["profit"]), 2) if profit_numeric is not None else 0.0
                r_margin = round((r_profit / r_sales * 100), 1) if r_sales > 0 and profit_numeric is not None else 0.0
                sales_by_region.append({
                    "name": str(row["name"]),
                    "sales": r_sales,
                    "profit": r_profit,
                    "margin_pct": r_margin
                })
                if profit_numeric is not None:
                    profit_by_region.append({
                        "name": str(row["name"]),
                        "profit": r_profit
                    })

        # 3. Category Breakdown (Cleaned & Grouped)
        sales_by_category = []
        if category_col:
            temp_cat = pd.DataFrame({
                "name": df[category_col].astype(str).apply(_clean_category_name),
                "sales": sales_numeric,
            })
            if profit_numeric is not None:
                temp_cat["profit"] = profit_numeric

            if profit_numeric is not None:
                cat_grouped = (
                    temp_cat.groupby("name", as_index=False)[["sales", "profit"]]
                    .sum()
                    .sort_values(by="sales", ascending=False)
                )
            else:
                cat_grouped = (
                    temp_cat.groupby("name", as_index=False)[["sales"]]
                    .sum()
                    .sort_values(by="sales", ascending=False)
                )

            for _, row in cat_grouped.iterrows():
                cat_name = str(row["name"]).strip()
                if not cat_name or cat_name.lower() in ["nan", "none", "-", "null"]:
                    continue
                c_sales = round(float(row["sales"]), 2)
                c_profit = round(float(row["profit"]), 2) if profit_numeric is not None else 0.0
                c_pct = round((c_sales / total_revenue * 100), 1) if total_revenue > 0 else 0.0
                sales_by_category.append({
                    "name": cat_name,
                    "value": c_sales,
                    "profit": c_profit,
                    "percentage": c_pct,
                })
                if len(sales_by_category) >= 8:
                    break

        # 4. Time Series Trend
        time_series = []
        if date_col:
            try:
                temp_date = pd.DataFrame({
                    "date_raw": pd.to_datetime(df[date_col], errors="coerce"),
                    "sales": sales_numeric,
                })
                if profit_numeric is not None:
                    temp_date["profit"] = profit_numeric
                temp_date = temp_date.dropna(subset=["date_raw"])

                if not temp_date.empty:
                    min_date = temp_date["date_raw"].min()
                    max_date = temp_date["date_raw"].max()
                    days_diff = (max_date - min_date).days

                    if days_diff > 45:
                        temp_date["period"] = temp_date["date_raw"].dt.strftime("%Y-%m")
                    else:
                        temp_date["period"] = temp_date["date_raw"].dt.strftime("%Y-%m-%d")

                    agg_cols = ["sales", "profit"] if profit_numeric is not None else ["sales"]
                    ts_grouped = temp_date.groupby("period", as_index=False)[agg_cols].sum().sort_values("period")
                    for _, row in ts_grouped.iterrows():
                        time_series.append({
                            "period": str(row["period"]),
                            "sales": round(float(row["sales"]), 2),
                            "profit": round(float(row["profit"]), 2) if profit_numeric is not None else 0.0,
                        })
            except Exception:
                time_series = []

        # 5. Pareto (80/20) Analysis
        pareto_data = {"top_20_pct_products_share": 0.0, "insight": ""}
        if sales_by_product and len(sales_by_product) > 1:
            top_20_count = max(1, int(len(sales_by_product) * 0.2))
            top_20_sales = sum(p["sales"] for p in sales_by_product[:top_20_count])
            pct_share = round((top_20_sales / total_revenue * 100), 1) if total_revenue > 0 else 0.0
            pareto_data = {
                "top_products_count": top_20_count,
                "total_products_count": len(sales_by_product),
                "share_percentage": pct_share,
                "insight": f"Top {top_20_count} product(s) drive {pct_share}% of overall business revenue."
            }

        # 6. Outliers & Anomalies
        anomalies = []
        if profit_numeric is not None:
            neg_profit_count = int((profit_numeric < 0).sum())
            if neg_profit_count > 0:
                total_neg_profit = float(round(profit_numeric[profit_numeric < 0].sum(), 2))
                anomalies.append({
                    "type": "negative_profit",
                    "severity": "high",
                    "title": "Unprofitable Transactions Detected",
                    "description": f"{neg_profit_count} order(s) generated negative profit totaling ₹{abs(total_neg_profit):,.2f}."
                })

        if average_order_value > 0:
            outliers = sales_numeric[sales_numeric > (average_order_value * 3.5)]
            if len(outliers) > 0:
                anomalies.append({
                    "type": "revenue_spike",
                    "severity": "medium",
                    "title": "High-Value Transaction Outliers",
                    "description": f"{len(outliers)} order(s) exceeded ₹{(average_order_value * 3.5):,.2f} (3.5x normal AOV)."
                })

        top_product = sales_by_product[0]["name"] if sales_by_product else "N/A"
        top_region = sales_by_region[0]["name"] if sales_by_region else "N/A"
        top_category = sales_by_category[0]["name"] if sales_by_category else "N/A"

        # 7. Strategic SWOT Analysis
        strengths = [
            f"Top product '{top_product}' anchors revenue at ₹{(sales_by_product[0]['sales'] if sales_by_product else 0):,.2f}.",
            f"Leading market '{top_region}' generates highest customer sales traction." if region_col else f"Leading category '{top_category}' drives primary catalog demand.",
        ]
        if profit_margin_pct is not None and profit_margin_pct >= 15:
            strengths.append(f"Healthy overall profit margin of {profit_margin_pct}%.")

        weaknesses = []
        if loss_making_products:
            weaknesses.append(f"Unprofitable product(s) identified: {', '.join(p['name'] for p in loss_making_products[:3])}.")
        if profit_margin_pct is not None and profit_margin_pct < 10:
            weaknesses.append(f"Compressed overall profit margin ({profit_margin_pct}%). Operational costs or discounting pressure.")
        if len(sales_by_product) > 0 and (sales_by_product[0]["sales"] / max(total_revenue, 1)) > 0.45:
            weaknesses.append(f"High revenue concentration risk: '{top_product}' alone accounts for >45% of total sales.")

        opportunities = [
            f"Scale marketing and distribution in secondary regions to reduce single-market reliance." if region_col else "Expand catalog depth in fast-growing segments.",
            f"Bundle high-margin accessories with volume leaders like '{top_product}'.",
        ]
        if category_col:
            opportunities.append(f"Expand inventory depth in leading category '{top_category}'.")

        threats = [
            f"Vulnerability to regional demand shocks in '{top_region}'." if region_col else "Concentration vulnerability in lead product portfolio.",
            "Supply chain or margin erosion if top sellers face price competition."
        ]

    # =========================================================================
    # B. VOLUME / MASTER DATA / RECORD DISTRIBUTION MODE
    # =========================================================================
    else:
        metric_mode = "volume"
        total_revenue = float(total_orders)
        total_profit = None
        profit_margin_pct = None
        average_order_value = 1.0
        total_quantity = total_orders
        avg_items_per_order = 1.0
        profit_label = None

        # 1. Product / Entity Distribution (Frequency counts)
        sales_by_product = []
        profit_by_product = []
        loss_making_products = []

        if product_col and total_orders > 0:
            prod_counts = df[product_col].astype(str).apply(_clean_product_name).value_counts().head(10)
            for name, cnt in prod_counts.items():
                sales_by_product.append({
                    "name": str(name),
                    "sales": int(cnt),
                    "profit": 0.0,
                    "margin_pct": 0.0
                })

        # 2. Regional Distribution
        sales_by_region = []
        profit_by_region = []
        if region_col and total_orders > 0:
            reg_counts = df[region_col].astype(str).str.strip().value_counts().head(10)
            for name, cnt in reg_counts.items():
                sales_by_region.append({
                    "name": str(name),
                    "sales": int(cnt),
                    "profit": 0.0,
                    "margin_pct": 0.0
                })

        # 3. Category Distribution
        sales_by_category = []
        if category_col and total_orders > 0:
            cat_counts = df[category_col].astype(str).apply(_clean_category_name).value_counts()
            for name, cnt in cat_counts.items():
                cat_name = str(name).strip()
                if not cat_name or cat_name.lower() in ["nan", "none", "-", "null"]:
                    continue
                c_pct = round((cnt / total_orders * 100), 1) if total_orders > 0 else 0.0
                sales_by_category.append({
                    "name": cat_name,
                    "value": int(cnt),
                    "profit": 0.0,
                    "percentage": c_pct,
                })
                if len(sales_by_category) >= 8:
                    break

        # 4. Time Series Trend (Record creation velocity)
        time_series = []
        if date_col and total_orders > 0:
            try:
                temp_date = pd.DataFrame({
                    "date_raw": pd.to_datetime(df[date_col], errors="coerce")
                }).dropna(subset=["date_raw"])
                if not temp_date.empty:
                    temp_date["period"] = temp_date["date_raw"].dt.strftime("%Y-%m")
                    ts_grouped = temp_date.groupby("period", as_index=False).size().sort_values("period")
                    for _, row in ts_grouped.iterrows():
                        time_series.append({
                            "period": str(row["period"]),
                            "sales": int(row["size"]),
                            "profit": 0.0,
                        })
            except Exception:
                time_series = []

        top_product = sales_by_product[0]["name"] if sales_by_product else "N/A"
        top_region = sales_by_region[0]["name"] if sales_by_region else "N/A"
        top_category = sales_by_category[0]["name"] if sales_by_category else "N/A"

        # Pareto on record counts
        pareto_data = {"top_20_pct_products_share": 0.0, "insight": ""}
        if sales_by_product and len(sales_by_product) > 1:
            top_20_count = max(1, int(len(sales_by_product) * 0.2))
            top_20_records = sum(p["sales"] for p in sales_by_product[:top_20_count])
            pct_share = round((top_20_records / total_orders * 100), 1) if total_orders > 0 else 0.0
            pareto_data = {
                "top_products_count": top_20_count,
                "total_products_count": len(sales_by_product),
                "share_percentage": pct_share,
                "insight": f"Top {top_20_count} master entities represent {pct_share}% of all {total_orders} dataset records."
            }

        anomalies = []
        if sales_by_product and (sales_by_product[0]["sales"] / max(total_orders, 1)) > 0.40:
            anomalies.append({
                "type": "distribution_skew",
                "severity": "medium",
                "title": "High Record Concentration",
                "description": f"Dominant entity '{top_product}' alone accounts for {sales_by_product[0]['sales']} records ({round(sales_by_product[0]['sales'] / total_orders * 100, 1)}% of dataset)."
            })

        strengths = [
            f"Catalog comprises {total_orders} verified master entities.",
            f"Lead entity anchor '{top_product}' comprises {sales_by_product[0]['sales']} records." if sales_by_product else "Well-distributed record spread.",
        ]
        if region_col:
            strengths.append(f"Geographic coverage extends across {len(sales_by_region)} operational zones.")

        weaknesses = []
        if len(sales_by_product) > 0 and (sales_by_product[0]["sales"] / max(total_orders, 1)) > 0.40:
            weaknesses.append(f"High portfolio skew: '{top_product}' commands disproportionate share of entries.")

        opportunities = [
            "Enrich dataset with monetary transaction values to unlock bottom-line profitability modeling.",
            "Standardize category tagging across underrepresented records."
        ]

        threats = [
            "Operational reliance on top entities without secondary pipeline diversification."
        ]

    swot_analysis = {
        "strengths": strengths,
        "weaknesses": weaknesses if weaknesses else ["Balanced entity and classification distribution across records."],
        "opportunities": opportunities,
        "threats": threats,
    }

    # Numeric summary
    numeric_summary = {}
    for column in profile.get("numeric_columns", []):
        col_series = pd.to_numeric(df[column], errors="coerce")
        numeric_summary[column] = {
            "sum": float(round(col_series.sum(), 2)) if pd.notna(col_series.sum()) else 0.0,
            "mean": float(round(col_series.mean(), 2)) if pd.notna(col_series.mean()) else 0.0,
            "min": float(round(col_series.min(), 2)) if pd.notna(col_series.min()) else 0.0,
            "max": float(round(col_series.max(), 2)) if pd.notna(col_series.max()) else 0.0,
        }

    # Top categories
    top_categories = {}
    for column in profile.get("categorical_columns", []):
        top_counts = df[column].value_counts().head(10)
        top_categories[column] = [
            {"name": str(cat), "value": int(cnt)}
            for cat, cnt in top_counts.items()
        ]

    return {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "profit_margin_pct": profit_margin_pct,
        "total_orders": total_orders,
        "average_order_value": average_order_value,
        "total_quantity": total_quantity,
        "avg_items_per_order": avg_items_per_order,
        "top_product": top_product,
        "top_region": top_region,
        "top_category": top_category,
        "sales_by_product": sales_by_product,
        "profit_by_product": profit_by_product,
        "sales_by_region": sales_by_region,
        "profit_by_region": profit_by_region,
        "sales_by_category": sales_by_category,
        "time_series": time_series,
        "loss_making_products": loss_making_products,
        "pareto_analysis": pareto_data,
        "anomalies": anomalies,
        "swot_analysis": swot_analysis,
        "summary": profile,
        "numeric_summary": numeric_summary,
        "top_categories": top_categories,
        "column_mapping": column_mapping,
        "metric_mode": metric_mode,
        "profit_label": profit_label,
    }
