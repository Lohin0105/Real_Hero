import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings("ignore")

class DemandForecaster:
    def __init__(self):
        self.models = {} # Key: Region_BloodGroup
        
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
        data = pd.Series(values, index=dates)
        
        model = ExponentialSmoothing(data, trend='add', seasonal='add', seasonal_periods=7).fit()
        self.models[f"{region}_{blood_group}"] = model
        print(f"✅ Forecast Model Trained for {region} - {blood_group}")

    def forecast(self, region, blood_group, history=None, days=7):
        # Fallback to synthetic if no valid history is provided
        if not history or sum(history) == 0:
            key = f"{region}_{blood_group}"
            if key not in self.models:
                self.train_synthetic(region, blood_group)
                
            model = self.models[key]
            forecast_values = model.forecast(days).values
            # Ensure minimum of 1 so bars are always visible
            return [max(1, int(v)) for v in forecast_values]
            
        # Use real DB historical data
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # If historical variance is 0, just return the flat value (min 1)
            if np.var(history) == 0:
                flat_val = max(1, int(history[-1])) if history[-1] > 0 else 1
                return [flat_val] * days
            
            date_index = pd.date_range(end=pd.Timestamp.now(), periods=len(history))
            data = pd.Series(history, index=date_index).astype(float)
            
            try:
                # Need at least 2 full seasonal cycles (14 days for 7-day seasonality)
                if len(history) >= 14:
                    model = ExponentialSmoothing(data, trend='add', seasonal='add', seasonal_periods=7, initialization_method="estimated").fit()
                else:
                    model = ExponentialSmoothing(data, trend='add', initialization_method="estimated").fit()
            except:
                # Fallback to Simple Exponential Smoothing if trend/seasonal math breaks
                model = ExponentialSmoothing(data, initialization_method="estimated").fit()

            forecast_values = model.forecast(days).values
            # Return integers with minimum floor of 1 for visibility
            return [max(1, int(round(float(v)))) for v in forecast_values]

    def forecast_all_regions(self, blood_group="O+"):
        """Returns 7-day forecast for multiple major cities."""
        cities = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Kolkata"]
        results = {}
        
        for city in cities:
            results[city] = self.forecast(city, blood_group, None)
            
        return results

demand_forecaster = DemandForecaster()
