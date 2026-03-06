class ReliabilityModel:
    def __init__(self):
        # Weights learned from regression analysis (Simulated)
        self.weights = {
            'accepted': 2.5,
            'rejected': -0.5,
            'completed': 15.0,
            'cancelled': -8.0,
            'delayed_response': -0.1, # per minute
            'no_show': -25.0
        }
        self.decay_factor = 0.99 # Time decay for old reliability
        
    def update_score(self, current_score, action, delay_minutes=0):
        """
        Updates score based on weighted regression formula.
        """
        delta = self.weights.get(action, 0)
        
        if action == 'response':
            delta += (delay_minutes * self.weights['delayed_response'])
            
        new_score = (current_score * self.decay_factor) + delta
        return max(0, min(200, round(new_score, 2)))

reliability_engine = ReliabilityModel()
