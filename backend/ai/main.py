from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import os
import warnings
from dotenv import load_dotenv

# ── Suppress Windows 11 wmic deprecation error from joblib ────────────────────
# wmic is removed from modern Windows 11 builds; patch joblib before it's imported
try:
    import joblib.externals.loky.backend.context as _loky_ctx
    def _patched_cpu_count():
        return 1  # safe fallback
    _loky_ctx._count_physical_cores = lambda: (1, None)
except Exception:
    pass

# Import ML Core Models
from ml_core.acceptance_model import acceptance_engine
from ml_core.forecaster import demand_forecaster
from ml_core.rl_agent import notification_agent
from ml_core.fraud_detector import fraud_detector
from ml_core.segmentation import donor_segmenter
from ml_core.risk_model import risk_predictor
from ml_core.recommender import incentive_engine
from ml_core.reliability import reliability_engine

load_dotenv()

app = FastAPI(title="Real-Hero AI Intelligence Core")

# --- Models (Pydantic) ---

class DonorFeatures(BaseModel):
    donor_id: str
    distance: float
    last_donation_days: int
    historic_acceptance_rate: float
    response_delay_avg: float
    emergency_level: int # 1-3

class PredictionResponse(BaseModel):
    donor_id: str
    probability: float
    priority_tier: str

class RiskFeatures(BaseModel):
    blood_group: str
    region: str
    urgency: int
    hour_of_day: int
    donor_density: int
    radius: float = 10.0

class SegmentationFeatures(BaseModel):
    donor_id: str
    donations_count: int
    reliability_score: int
    avg_response_time: float
    last_active_days: int

class FraudFeatures(BaseModel):
    user_id: str
    avg_response_time: float
    requests_per_hour: int
    same_ip_count: int
    profile_completeness: float

# --- Endpoints ---

@app.get("/")
async def root():
    return {"status": "online", "message": "Real-Hero AI Core [ML-POWERED] is operational"}

# 1. Donor Acceptance Prediction
@app.post("/predict-acceptance", response_model=List[PredictionResponse])
async def predict_acceptance(donors: List[DonorFeatures]):
    """
    Uses Logistic Regression to predict acceptance probability.
    """
    results = []
    
    # Prepare data for batch prediction
    features_list = []
    for d in donors:
        features_list.append({
            'distance': d.distance,
            'days_since': d.last_donation_days,
            'acc_rate': d.historic_acceptance_rate,
            'resp_time': d.response_delay_avg,
            'emergency': d.emergency_level
        })
        
    probs = acceptance_engine.predict(features_list)
    
    for i, prob in enumerate(probs):
        tier = "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low"
        results.append(PredictionResponse(
            donor_id=donors[i].donor_id,
            probability=round(float(prob), 4),
            priority_tier=tier
        ))
    
    return results

class ForecastRequest(BaseModel):
    blood_group: str
    region: str
    history: List[float] = []

# 2. Demand Forecasting
@app.post("/forecast-demand")
async def forecast_demand(req: ForecastRequest):
    """
    Uses Exponential Smoothing (Holt-Winters) for demand forecasting based on DB history.
    """
    forecast = demand_forecaster.forecast(req.region, req.blood_group, req.history)
    return {
        "blood_group": req.blood_group,
        "region": req.region,
        "forecast_7_days": forecast,
        "total_predicted_demand": sum(forecast),
        "trend": "Increasing" if forecast[-1] > forecast[0] else "Decreasing"
    }

@app.get("/forecast-all-cities")
async def forecast_all_cities(blood_group: str = "O+"):
    """
    Returns demand forecast for all major cities.
    """
    forecasts = demand_forecaster.forecast_all_regions(blood_group)
    return forecasts

# 3. RL Notification Agent
@app.post("/optimize-notifications")
async def optimize_notifications(urgency: int, hour: int):
    """
    Uses Q-Learning to decide how many donors to notify.
    """
    action = notification_agent.choose_action(urgency, hour)
    return {
        "recommended_batch_size": int(action),
        "strategy": "Reinforcement Learning (Exploration/Exploitation)"
    }

@app.post("/train-rl-agent")
async def train_rl(urgency: int, hour: int, action: int, reward: float):
    """
    Feedback loop to train the RL agent.
    """
    notification_agent.learn(urgency, hour, action, reward)
    return {"status": "Weights Updated"}

# 4. Fraud Detection
@app.post("/detect-fraud")
async def detect_fraud(features: FraudFeatures):
    """
    Uses Isolation Forest to detect anomalies.
    """
    result = fraud_detector.check_fraud(
        features.avg_response_time,
        features.requests_per_hour,
        features.same_ip_count,
        features.profile_completeness
    )
    return result

# 5. Donor Segmentation
@app.post("/segment-donors")
async def segment_donors(donors: List[SegmentationFeatures]):
    """
    Uses K-Means Clustering to group donors.
    """
    results = {}
    for d in donors:
        segment = donor_segmenter.segment(
            d.donations_count,
            d.reliability_score,
            0.5, # Placeholder for engagement if missing
            d.last_active_days
        )
        results[d.donor_id] = segment
    
    return {"segments": results}

# 6. Risk Prediction
@app.post("/predict-risk")
async def predict_risk(features: RiskFeatures):
    """
    Uses Random Forest to predict failure risk.
    """
    # Rarity map approximation
    rarity_map = {"O-": 0.9, "AB-": 0.8, "A-": 0.6, "B-": 0.6, "O+": 0.3, "AB+": 0.2, "A+": 0.2, "B+": 0.2}
    rarity = rarity_map.get(features.blood_group, 0.5)
    
    # If there are 0 active requests (urgency=1), it implies a stable condition despite potential 0 donors
    if features.urgency == 1:
        return {
            "risk_score": 0.12 if features.donor_density == 0 else 0.02,
            "risk_category": "Low",
            "action": "Stable Supply"
        }
        
    prob = risk_predictor.predict(
        rarity,
        features.donor_density,
        features.radius,
        features.hour_of_day,
        features.urgency
    )
    
    return {
        "risk_score": round(float(prob), 2),
        "risk_category": "Critical" if prob > 0.7 else "High" if prob > 0.4 else "Low",
        "action": "Escalate Immediately" if prob > 0.7 else "Standard Protocol"
    }

# 7. Incentive Recommendation
@app.post("/recommend-incentives")
async def recommend_incentives(prefs: List[float]):
    """
    Uses Collaborative/Content Filtering.
    prefs: [Gamified, Monetary, Social, Health] weights (0-1)
    """
    recs = incentive_engine.recommend(prefs)
    return {"recommendations": recs}

# 8. Reliability Update
@app.post("/update-reliability")
async def update_reliability(current_score: float, action: str, delay: int = 0):
    """
    Uses Adaptive Regression weights.
    """
    new_score = reliability_engine.update_score(current_score, action, delay)
    return {"old_score": current_score, "new_score": new_score}


if __name__ == "__main__":
    # Pre-train models on startup if needed
    print("🚀 Initializing AI Core...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
