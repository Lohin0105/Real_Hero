from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

class DonorSegmenter:
    def __init__(self):
        self.model = KMeans(n_clusters=4, random_state=42, n_init=10)
        self.scaler = StandardScaler()
        self.cluster_label_map = {}  # Maps cluster_id -> human label
        self.is_trained = False

    def train_synthetic(self):
        # Features: [donation_frequency (per year), reliability_score, platform_engagement, days_since_last]
        np.random.seed(42)

        # Cluster 1: Super Heroes (High freq, High rel, Low days_since)
        c1 = np.random.normal([4, 180, 0.9, 30],  [1, 20, 0.1, 10],  (100, 4))
        # Cluster 2: Casual (Low freq, Med rel)
        c2 = np.random.normal([1, 100, 0.4, 120], [0.5, 30, 0.2, 30], (100, 4))
        # Cluster 3: Newbies (Zero freq, Default rel)
        c3 = np.random.normal([0, 100, 0.2, 10],  [0.3, 5, 0.1, 5],  (100, 4))
        # Cluster 4: At-Risk (Med freq, Low rel, High days_since)
        c4 = np.random.normal([2, 50, 0.5, 200],  [1, 10, 0.2, 30],  (100, 4))

        # Clip to realistic ranges
        c1 = np.clip(c1, [0, 0, 0, 0], [12, 200, 1, 365])
        c2 = np.clip(c2, [0, 0, 0, 0], [12, 200, 1, 365])
        c3 = np.clip(c3, [0, 0, 0, 0], [12, 200, 1, 365])
        c4 = np.clip(c4, [0, 0, 0, 0], [12, 200, 1, 365])

        X = np.vstack([c1, c2, c3, c4])

        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model.fit(X_scaled)

        # ── Dynamically assign human-readable labels to clusters ──────────────
        # Analyze cluster centroids in original feature space:
        # Feature order: [freq, reliability, engagement, days_since]
        # Higher freq + reliability = better donors
        # Higher days_since = less recent = worse
        centers_orig = self.scaler.inverse_transform(self.model.cluster_centers_)

        # Score each cluster: freq*10 + reliability*0.05 - days_since*0.1
        cluster_scores = []
        for i, center in enumerate(centers_orig):
            freq, rel, eng, days = center
            score = freq * 10 + rel * 0.05 + eng * 20 - days * 0.05
            cluster_scores.append((i, score))

        # Sort by score descending: highest → Hero, then Champion, Casual, At-Risk
        cluster_scores.sort(key=lambda x: x[1], reverse=True)
        label_names = ["Hero", "Champion", "Casual", "At-Risk"]
        self.cluster_label_map = {
            cluster_scores[i][0]: label_names[i]
            for i in range(4)
        }

        self.is_trained = True
        print("✅ Donor Segmentation Model Trained (K-Means)")
        print(f"   Cluster map: {self.cluster_label_map}")

    def segment(self, freq, reliability, engagement, days_since):
        if not self.is_trained:
            self.train_synthetic()

        features = [[freq, reliability, engagement, days_since]]
        features_scaled = self.scaler.transform(features)
        cluster_id = int(self.model.predict(features_scaled)[0])

        # Return human-readable label from the dynamically built map
        return self.cluster_label_map.get(cluster_id, f"Segment_{cluster_id}")


donor_segmenter = DonorSegmenter()
