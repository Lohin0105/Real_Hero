from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

class DonorSegmenter:
    def __init__(self):
        self.model = KMeans(n_clusters=4, random_state=42)
        self.scaler = StandardScaler()
        self.labels_map = {0: "Hero", 1: "Casual", 2: "Newbie", 3: "At-Risk"}
        self.is_trained = False
        
    def train_synthetic(self):
        # Features: [donation_frequency (per year), reliability_score, platform_engagement, days_since_last]
        
        np.random.seed(42)
        
        # Cluster 1: Super Heroes (High freq, High rel)
        c1 = np.random.normal([4, 180, 0.9, 30], [1, 20, 0.1, 10], (100, 4))
        
        # Cluster 2: Casual (Low freq, Med rel)
        c2 = np.random.normal([1, 100, 0.4, 120], [0.5, 30, 0.2, 30], (100, 4))
        
        # Cluster 3: Newbies (Zero freq, Default rel)
        c3 = np.random.normal([0, 100, 0.2, 10], [0, 5, 0.1, 5], (100, 4))
        
        # Cluster 4: Flaky/At-Risk (Med freq, Low rel)
        c4 = np.random.normal([2, 50, 0.5, 60], [1, 10, 0.2, 20], (100, 4))
        
        X = np.vstack([c1, c2, c3, c4])
        
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model.fit(X_scaled)
        
        # Dynamically map clusters to names based on centroids
        centers = self.scaler.inverse_transform(self.model.cluster_centers_)
        # Sort by Reliability Score (index 1) to name them loosely
        # This is a simplification; production code would analyze centroids deeper
        
        self.is_trained = True
        print("✅ Donor Segmentation Model Trained (K-Means)")

    def segment(self, freq, reliability, engagement, days_since):
        if not self.is_trained:
            self.train_synthetic()
            
        features = [[freq, reliability, engagement, days_since]]
        features_scaled = self.scaler.transform(features)
        cluster_id = self.model.predict(features_scaled)[0]
        
        # Hardcoding mapping for the synthetic generation logic above:
        # Centroids analysis would show:
        # High Rel -> Hero
        # Low Rel -> At-Risk
        # etc.
        # For now, returning raw Cluster ID + Logical Name guess
        
        return f"Segment_{cluster_id}"

donor_segmenter = DonorSegmenter()
