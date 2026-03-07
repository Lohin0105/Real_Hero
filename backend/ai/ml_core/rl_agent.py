import numpy as np
import random

class RLAgent:
    def __init__(self):
        # Q-Table: State -> Action
        # States: (Urgency_Level [1-3], Time_of_Day [Morning, Afternoon, Evening, Night])
        # Actions: Batches to send [3, 5, 10, 20]

        self.q_table = {}
        self.actions = [3, 5, 10, 20]
        self.learning_rate = 0.1
        self.discount_factor = 0.95
        self.epsilon = 0.1  # Exploration rate

        self._initialize_q_table()

    def _initialize_q_table(self):
        """
        Pre-initialize all 12 state combinations with intelligent defaults.
        Higher urgency -> prefer sending more donors.
        Urgency 3 (Critical) + Night -> send max batch.
        Urgency 1 (Low) + Morning -> send small batch.
        """
        time_periods = ["Morning", "Afternoon", "Evening", "Night"]

        # Q-value templates per urgency level [q(3), q(5), q(10), q(20)]
        urgency_defaults = {
            1: np.array([5.0, 3.0, 1.0, 0.0]),   # Low urgency  → prefer 3 donors
            2: np.array([1.0, 4.0, 5.0, 2.0]),   # Medium       → prefer 10 donors
            3: np.array([0.0, 1.0, 3.0, 8.0]),   # High urgency → prefer 20 donors
        }

        for urgency in [1, 2, 3]:
            for time in time_periods:
                state = f"{urgency}_{time}"
                base = urgency_defaults[urgency].copy()
                # Add small noise to prevent deterministic ties
                noise = np.random.uniform(-0.1, 0.1, len(self.actions))
                self.q_table[state] = base + noise

        print("✅ RL Agent Q-Table initialized for all 12 states")

    def get_state(self, urgency, hour):
        # Clamp urgency to valid range
        urgency = max(1, min(3, int(urgency)))
        time_cat = "Night"
        if 6 <= hour < 12:
            time_cat = "Morning"
        elif 12 <= hour < 17:
            time_cat = "Afternoon"
        elif 17 <= hour < 22:
            time_cat = "Evening"
        return f"{urgency}_{time_cat}"

    def choose_action(self, urgency, hour):
        state = self.get_state(urgency, hour)

        # Epsilon-greedy: explore with probability epsilon
        if np.random.uniform(0, 1) < self.epsilon:
            return random.choice(self.actions)  # Explore

        # Ensure state always exists (safety net)
        if state not in self.q_table:
            self.q_table[state] = np.zeros(len(self.actions))

        return self.actions[int(np.argmax(self.q_table[state]))]  # Exploit

    def learn(self, urgency, hour, action, reward):
        """
        Reward: +1 for fulfilled, -0.1 for each notification sent (cost)
        Q-learning update rule: Q(s,a) = (1-α)Q(s,a) + α(r + γ*max_Q(s'))
        """
        state = self.get_state(urgency, hour)

        if action not in self.actions:
            return  # Ignore unknown actions

        action_idx = self.actions.index(action)

        if state not in self.q_table:
            self.q_table[state] = np.zeros(len(self.actions))

        current_q = self.q_table[state][action_idx]
        max_future_q = float(np.max(self.q_table[state]))

        new_q = (1 - self.learning_rate) * current_q + \
                self.learning_rate * (reward + self.discount_factor * max_future_q)

        self.q_table[state][action_idx] = new_q

    def save_model(self):
        pass  # In-memory only; persist to file if needed

    def load_model(self):
        pass  # Q-table initialized in __init__ via _initialize_q_table


notification_agent = RLAgent()
