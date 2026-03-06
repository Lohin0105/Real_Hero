import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
import os

class AcceptanceModel:
    def __init__(self):
        self.model = LogisticRegression(random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.model_path = "ml_core/saved_models/acceptance_model.pkl"
        
    def train_synthetic(self):
        """Generates synthetic data and trains the cold-start model."""
        print("⚡ Training Acceptance Model on Synthetic Data...")
        
        # synthetic data: [distance, days_since_last, acceptance_rate, response_time, emergency_level]
        # Target: 1 (Accept), 0 (Reject)
        
        np.random.seed(42)
        n_samples = 500
        
        # Features
        distance = np.random.normal(5, 3, n_samples).clip(0, 20)  # avg 5km
        days_since = np.random.normal(60, 20, n_samples).clip(0, 120)
        acc_rate = np.random.beta(2, 2, n_samples)
        resp_time = np.random.normal(30, 15, n_samples).clip(1, 120) # minutes
        emergency = np.random.randint(1, 4, n_samples) # 1-3
        
        X = pd.DataFrame({
            'distance': distance,
            'days_since': days_since,
            'acc_rate': acc_rate,
            'resp_time': resp_time,
            'emergency': emergency
        })
        
        # Logic for synthetic target: High acc_rate + Low distance + High emergency = Accept
        score = (acc_rate * 3) - (distance * 0.1) + (emergency * 0.5) - (resp_time * 0.01)
        y = (score > 1.5).astype(int)
        
        self.scaler.fit(X)
        self.model.fit(self.scaler.transform(X), y)
        self.is_trained = True
        print(f"✅ Acceptance Model Trained. Accuracy: {self.model.score(self.scaler.transform(X), y):.2f}")

    def predict(self, features):
        """
        features: dict or list of dicts with keys: distance, days_since, acc_rate, resp_time, emergency
        """
        if not self.is_trained:
            self.train_synthetic()
            
        df = pd.DataFrame(features)
        scaled_X = self.scaler.transform(df)
        probs = self.model.predict_proba(scaled_X)[:, 1] # Probability of class 1 (Accept)
        return probs

acceptance_engine = AcceptanceModel()
