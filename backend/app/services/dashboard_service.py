import pandas as pd

from .data_profiler import profile_dataset


def generate_dashboard(df: pd.DataFrame):

    profile = profile_dataset(df)

    dashboard = {}

    dashboard["summary"] = profile

    dashboard["numeric_summary"] = {}

    for column in profile["numeric_columns"]:

        dashboard["numeric_summary"][column] = {

            "sum": float(df[column].sum()),

            "mean": float(df[column].mean()),

            "min": float(df[column].min()),

            "max": float(df[column].max())
        }

    dashboard["top_categories"] = {}

    for column in profile["categorical_columns"]:

        dashboard["top_categories"][column] = (

            df[column]

            .value_counts()

            .head(10)

            .reset_index()

            .rename(columns={
                "index": "name",
                column: "value"
            })

            .to_dict(orient="records")

        )

    return dashboard