import pandas as pd


def generate_dashboard(df: pd.DataFrame):

    dashboard = {}

    dashboard["total_orders"] = len(df)

    dashboard["total_revenue"] = float(df["Sales"].sum())

    dashboard["total_profit"] = float(df["Profit"].sum())

    dashboard["average_order_value"] = float(df["Sales"].mean())

    dashboard["top_product"] = (
        df.groupby("Product")["Sales"]
        .sum()
        .idxmax()
    )

    dashboard["top_region"] = (
        df.groupby("Region")["Sales"]
        .sum()
        .idxmax()
    )

    dashboard["sales_by_product"] = (
        df.groupby("Product", as_index=False)["Sales"]
        .sum()
        .rename(columns={
            "Product": "name",
            "Sales": "sales"
        })
        .to_dict(orient="records")
    )

    dashboard["profit_by_product"] = (
        df.groupby("Product", as_index=False)["Profit"]
        .sum()
        .rename(columns={
            "Product": "name",
            "Profit": "profit"
        })
        .to_dict(orient="records")
    )

    dashboard["sales_by_region"] = (
        df.groupby("Region", as_index=False)["Sales"]
        .sum()
        .rename(columns={
            "Region": "name",
            "Sales": "sales"
        })
        .to_dict(orient="records")
    )

    dashboard["profit_by_region"] = (
        df.groupby("Region", as_index=False)["Profit"]
        .sum()
        .rename(columns={
            "Region": "name",
            "Profit": "profit"
        })
        .to_dict(orient="records")
    )

    return dashboard