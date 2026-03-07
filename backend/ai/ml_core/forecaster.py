import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings("ignore")

class DemandForecaster:
    def __init__(self):
        self.models = {}  # Key: Region_BloodGroup

    def train_synthetic(self, region="Chennai", blood_group="O+"):
        """Trains a time-series model on synthetic usage data."""
        # Generate 60 days of data
        dates = pd.date_range(end=pd.Timestamp.now(), periods=60)

        # Trend + Seasonality (Higher on weekends simulated)
        base = 20
        trend = np.linspace(0, 5, 60)
        seasonality = np.sin(np.linspace(0, 3.14 * 4, 60)) * 5
        noise = np.random.normal(0, 2, 60)

        values = base + trend + seasonality + noise
        values = np.clip(values, 1, None)  # Ensure all values are positive
        data = pd.Series(values, index=dates)

        try:
            model = ExponentialSmoothing(
                data, trend='add', seasonal='add', seasonal_periods=7,
                initialization_method="estimated"
            ).fit(optimized=True)
        except Exception:
            try:
                model = ExponentialSmoothing(data, trend='add', initialization_method="estimated").fit()
            except Exception:
                model = ExponentialSmoothing(data, initialization_method="estimated").fit()

        self.models[f"{region}_{blood_group}"] = model
        print(f"✅ Forecast Model Trained for {region} - {blood_group}")

    def _safe_forecast_values(self, model, days):
        """Runs model.forecast(days) and sanitizes NaN/inf values safely."""
        try:
            raw = model.forecast(days).values
        except Exception:
            return [3] * days  # Safe constant fallback

        result = []
        for v in raw:
            try:
                fv = float(v)
                if np.isnan(fv) or np.isinf(fv) or fv < 0:
                    result.append(3)
                else:
                    result.append(max(1, int(round(fv))))
            except Exception:
                result.append(3)
        return result

    def forecast(self, region, blood_group, history=None, days=7):
        # Fallback to synthetic if no valid history is provided
        if not history or len(history) == 0 or sum(history) == 0:
            key = f"{region}_{blood_group}"
            if key not in self.models:
                self.train_synthetic(region, blood_group)
            model = self.models[key]
            return self._safe_forecast_values(model, days)

        # Use real DB historical data
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")

            # If historical variance is 0, just return the flat value (min 1)
            hist_arr = np.array(history, dtype=float)
            if np.var(hist_arr) == 0:
                flat_val = max(1, int(hist_arr[-1])) if hist_arr[-1] > 0 else 2
                return [flat_val] * days

            # Replace NaN/inf in history itself before fitting
            hist_arr = np.where(np.isfinite(hist_arr), hist_arr, 0.0)
            hist_arr = np.clip(hist_arr, 0, None)

            # Need at least a floor value so the series is never all-zero after clipping
            if hist_arr.sum() == 0:
                return [2] * days

            date_index = pd.date_range(end=pd.Timestamp.now(), periods=len(hist_arr))
            data = pd.Series(hist_arr, index=date_index)

            model = None
            try:
                # Need at least 2 full seasonal cycles (14 days for 7-day seasonality)
                if len(history) >= 14:
                    model = ExponentialSmoothing(
                        data, trend='add', seasonal='add', seasonal_periods=7,
                        initialization_method="estimated"
                    ).fit(optimized=True)
                else:
                    model = ExponentialSmoothing(
                        data, trend='add', initialization_method="estimated"
                    ).fit(optimized=True)
            except Exception:
                try:
                    # Fallback to Simple Exponential Smoothing if trend/seasonal math breaks
                    model = ExponentialSmoothing(data, initialization_method="estimated").fit()
                except Exception:
                    pass

            if model is None:
                # Ultimate fallback: use moving average of last 7 days
                last7 = hist_arr[-7:]
                avg = max(1, int(round(float(np.mean(last7)))))
                return [avg] * days

            return self._safe_forecast_values(model, days)

    def forecast_all_regions(self, blood_group="O+"):
        """Returns 7-day forecast for multiple major cities."""
        cities = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Kolkata"]
        results = {}

        for city in cities:
            results[city] = self.forecast(city, blood_group, None)

        return results


demand_forecaster = DemandForecaster()
