import numpy as np
import pandas as pd
from datetime import timedelta


def generate_forecast(time_series: list, days_forward: int = 30) -> dict:
    """Generate statistical forward projections with confidence bounds
    from historical time-series data.
    Uses Holt-Winters linear exponential smoothing with damping and confidence bands.
    """
    if not time_series or len(time_series) < 3:
        return {
            "available": False,
            "reason": "At least 3 chronological time periods are required to compute a statistical forecast.",
            "forecast_points": [],
            "metrics": {
                "growth_rate_pct": 0.0,
                "trend": "insufficient_data",
                "projected_total": 0.0,
            }
        }

    # Extract historical sales series
    periods = [str(item["period"]) for item in time_series]
    values = np.array([float(item.get("sales", 0.0)) for item in time_series], dtype=float)

    n = len(values)
    x = np.arange(n)

    # 1. Linear & Quadratic trend fitting
    poly_deg = 2 if n >= 6 else 1
    poly_coeffs = np.polyfit(x, values, deg=poly_deg)
    trend_fit = np.polyval(poly_coeffs, x)

    # Residual standard deviation for confidence intervals
    residuals = values - trend_fit
    residual_std = float(np.std(residuals)) if len(residuals) > 1 else float(np.mean(values) * 0.1)
    if residual_std == 0:
        residual_std = max(float(np.mean(values) * 0.05), 1.0)

    # 2. Holt-Winters linear exponential smoothing
    alpha = 0.4
    beta = 0.2
    level = values[0]
    trend = values[1] - values[0] if n > 1 else 0.0

    for i in range(1, n):
        prev_level = level
        level = alpha * values[i] + (1 - alpha) * (prev_level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend

    # 3. Forecast future horizons (step count proportional to forward days)
    # Determine frequency (monthly vs daily)
    is_monthly = any("-" in p and len(p) == 7 for p in periods) or len(periods[0]) == 7

    if is_monthly:
        steps = max(3, int(days_forward / 30))
    else:
        steps = min(days_forward, 60)

    # Parse last period to increment
    last_p = periods[-1]
    forecast_points = []
    projected_sum = 0.0

    try:
        if is_monthly:
            # Format: YYYY-MM
            parts = last_p.split("-")
            curr_y, curr_m = int(parts[0]), int(parts[1])
            for step in range(1, steps + 1):
                curr_m += 1
                if curr_m > 12:
                    curr_m = 1
                    curr_y += 1
                period_str = f"{curr_y:04d}-{curr_m:02d}"

                # Damped projection blending trend & polynomial
                damp = 0.95 ** step
                proj_val = max(0.0, level + (trend * step * damp))
                poly_val = max(0.0, np.polyval(poly_coeffs, n + step - 1))
                blended = round(float(0.6 * proj_val + 0.4 * poly_val), 2)

                # Expanding confidence bands
                uncertainty = residual_std * np.sqrt(step) * 1.28  # ~80% CI
                upper = round(blended + uncertainty, 2)
                lower = round(max(0.0, blended - uncertainty), 2)

                forecast_points.append({
                    "period": period_str,
                    "forecast": blended,
                    "upper_bound": upper,
                    "lower_bound": lower,
                    "is_forecast": True,
                })
                projected_sum += blended
        else:
            # Daily format: YYYY-MM-DD
            last_dt = pd.to_datetime(last_p, errors="coerce")
            if pd.isna(last_dt):
                last_dt = pd.Timestamp.now()

            for step in range(1, steps + 1):
                next_dt = last_dt + timedelta(days=step)
                period_str = next_dt.strftime("%Y-%m-%d")

                damp = 0.96 ** step
                proj_val = max(0.0, level + (trend * step * damp))
                poly_val = max(0.0, np.polyval(poly_coeffs, n + step - 1))
                blended = round(float(0.6 * proj_val + 0.4 * poly_val), 2)

                uncertainty = residual_std * np.sqrt(step) * 1.28
                upper = round(blended + uncertainty, 2)
                lower = round(max(0.0, blended - uncertainty), 2)

                forecast_points.append({
                    "period": period_str,
                    "forecast": blended,
                    "upper_bound": upper,
                    "lower_bound": lower,
                    "is_forecast": True,
                })
                projected_sum += blended
    except Exception:
        forecast_points = []

    # Historical average vs projected average to compute expected growth
    hist_avg = float(np.mean(values)) if len(values) > 0 else 1.0
    proj_avg = projected_sum / max(steps, 1)
    growth_rate = round(((proj_avg - hist_avg) / max(hist_avg, 1.0)) * 100, 2)

    trend_category = "Bullish Growth" if growth_rate >= 5.0 else "Stable / Steady" if growth_rate >= -5.0 else "Bearish Contraction"

    return {
        "available": True,
        "days_forward": days_forward,
        "steps": steps,
        "forecast_points": forecast_points,
        "metrics": {
            "historical_mean": round(hist_avg, 2),
            "projected_mean": round(proj_avg, 2),
            "projected_total": round(projected_sum, 2),
            "growth_rate_pct": growth_rate,
            "trend": trend_category,
            "volatility_index": round(float(residual_std / max(hist_avg, 1.0) * 100), 1),
        }
    }
