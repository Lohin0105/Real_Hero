from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import numpy as np

class RiskModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.is_trained = False
        
    def train_synthetic(self):
        # Features: [blood_rarity (0-1), donor_density, search_radius, hour_of_day, urgency]
        # Target: 1 (Failure/High Risk), 0 (Success)
        
        np.random.seed(42)
        n = 1000
        
        rarity = np.random.beta(2, 5, n)
        density = np.random.poisson(5, n)
        radius = np.random.uniform(1, 20, n)
        hour = np.random.randint(0, 24, n)
        urgency = np.random.randint(1, 4, n)
        
        X = pd.DataFrame({
            'rarity': rarity, 'density': density, 'radius': radius,
            'hour': hour, 'urgency': urgency
        })
        
        # Complex risk logic
        risk_score = (rarity * 4) + (urgency * 0.5) - (density * 0.3)
        risk_score += np.where((hour < 6) | (hour > 22), 1.0, 0.0) # Night penalty
        
        y = (risk_score > 1.5).astype(int)
        
        self.model.fit(X, y)
        self.is_trained = True
        print("✅ Risk Prediction Model Trained (Random Forest)")

    def predict(self, rarity, density, radius, hour, urgency):
        if not self.is_trained:
            self.train_synthetic()
            
        X_new = pd.DataFrame([[rarity, density, radius, hour, urgency]], 
                             columns=['rarity', 'density', 'radius', 'hour', 'urgency'])
        
        risk_prob = self.model.predict_proba(X_new)[0][1] # Prob of class 1
        return risk_prob

risk_predictor = RiskModel()
