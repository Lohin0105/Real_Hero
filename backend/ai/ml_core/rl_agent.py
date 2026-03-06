import numpy as np
import random
import pickle
import os

class RLAgent:
    def __init__(self):
        # Q-Table: State -> Action
        # States: (Urgency_Level [1-3], Time_of_Day [Morning, Afternoon, Night])
        # Actions: Batches to send [3, 5, 10, 20]
        
        self.q_table = {} 
        self.actions = [3, 5, 10, 20]
        self.learning_rate = 0.1
        self.discount_factor = 0.95
        self.epsilon = 0.1 # Exploration rate
        self.file_path = "ml_core/saved_models/q_table.pkl"
        
        self.load_model()
        
    def get_state(self, urgency, hour):
        time_cat = "Night"
        if 6 <= hour < 12: time_cat = "Morning"
        elif 12 <= hour < 18: time_cat = "Afternoon"
        elif 18 <= hour < 22: time_cat = "Evening"
        
        return f"{urgency}_{time_cat}"
    
    def choose_action(self, urgency, hour):
        state = self.get_state(urgency, hour)
        
        if np.random.uniform(0, 1) < self.epsilon:
            return random.choice(self.actions) # Explore
            
        if state not in self.q_table:
            self.q_table[state] = np.zeros(len(self.actions))
            
        return self.actions[np.argmax(self.q_table[state])] # Exploit

    def learn(self, urgency, hour, action, reward):
        """
        Reward: +1 for fulfilled, -0.1 for each notification sent (cost)
        """
        state = self.get_state(urgency, hour)
        action_idx = self.actions.index(action)
        
        if state not in self.q_table:
            self.q_table[state] = np.zeros(len(self.actions))
            
        current_q = self.q_table[state][action_idx]
        max_future_q = np.max(self.q_table[state]) # Simplified next state assumption
        
        new_q = (1 - self.learning_rate) * current_q + \
                self.learning_rate * (reward + self.discount_factor * max_future_q)
        
        self.q_table[state][action_idx] = new_q
        self.save_model()

    def save_model(self):
        pass # Placeholder for actual file I/O to avoid permission blocks constantly

    def load_model(self):
        # Initialize some basic smart defaults if empty
        # High urgency -> Send more
        self.q_table["3_Night"] = np.array([0, 0, 1, 5]) 
        self.q_table["1_Morning"] = np.array([5, 2, 0, 0]) 

notification_agent = RLAgent()
