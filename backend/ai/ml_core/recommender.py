import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class IncentiveRecommender:
    def __init__(self):
        # Simulated "Incentive Database"
        # Features: [Gamified, Monetary_Value, Social_Recognition, Health_Related]
        self.incentives = pd.DataFrame([
            {"id": "badge_hero", "features": [1.0, 0.0, 0.8, 0.0], "name": "Hero Badge"},
            {"id": "coupon_food", "features": [0.2, 0.8, 0.0, 0.0], "name": "Food Coupon"},
            {"id": "cert_govt", "features": [0.0, 0.0, 1.0, 0.5], "name": "Govt Certificate"},
            {"id": "health_check", "features": [0.0, 0.9, 0.2, 1.0], "name": "Free Health Checkup"},
            {"id": "leaderboard", "features": [1.0, 0.0, 0.5, 0.0], "name": "Leaderboard Boost"}
        ]).set_index("id")
        
    def recommend(self, user_prefs):
        """
        user_prefs: list [Gamified_Interest, Monetary_Need, Social_Need, Health_Conscious]
        """
        user_profile = np.array(user_prefs).reshape(1, -1)
        item_profiles = np.vstack(self.incentives["features"].values)
        
        # Calculate Cosine Similarity
        scores = cosine_similarity(user_profile, item_profiles)[0]
        
        # Get top 3
        top_indices = scores.argsort()[-3:][::-1]
        recommendations = self.incentives.iloc[top_indices]
        
        return recommendations["name"].tolist()

incentive_engine = IncentiveRecommender()
