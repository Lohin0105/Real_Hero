import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd

class FraudDetector:
    def __init__(self):
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.is_trained = False
        
    def train_synthetic(self):
        # Synthetic User Behavior Data
        # Features: [avg_response_time, requests_per_hour, same_ip_count, profile_completeness_score]
        
        np.random.seed(42)
        n_normal = 450
        n_fraud = 50
        
        # Normal behavior
        X_normal = np.column_stack((
            np.random.normal(30, 10, n_normal), # Response time 30 mins
            np.random.poisson(1, n_normal),     # 1 request/hr
            np.random.randint(1, 3, n_normal),  # 1-2 accounts/IP
            np.random.uniform(0.8, 1.0, n_normal) # High profile completion
        ))
        
        # Fraud behavior (Fast bots, high volume)
        X_fraud = np.column_stack((
            np.random.normal(0.5, 0.2, n_fraud), # Instant response
            np.random.poisson(10, n_fraud),      # Spammed requests
            np.random.randint(5, 20, n_fraud),   # Many accounts/IP
            np.random.uniform(0.1, 0.4, n_fraud) # Low completion
        ))
        
        X = np.vstack([X_normal, X_fraud])
        
        self.model.fit(X)
        self.is_trained = True
        print("✅ Fraud Detection Model Trained (Isolation Forest)")

    def check_fraud(self, response_time, req_rate, ip_count, profile_score):
        if not self.is_trained:
            self.train_synthetic()
            
        features = [[response_time, req_rate, ip_count, profile_score]]
        pred = self.model.predict(features)[0] # 1 = Normal, -1 = Anomaly
        
        return {
            "is_fraud": bool(pred == -1),
            "anomaly_score": self.model.decision_function(features)[0]
        }

fraud_detector = FraudDetector()
