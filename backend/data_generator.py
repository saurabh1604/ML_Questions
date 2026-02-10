import numpy as np
from sklearn.datasets import make_moons, make_circles, make_blobs, make_classification

def generate_data(dataset_type: str, n_samples: int = 300, noise: float = 0.2):
    """
    Generates synthetic 2D datasets.

    Args:
        dataset_type: 'moons', 'circles', 'blobs', 'classification'
        n_samples: Number of samples
        noise: Noise level (0.0 to 1.0)

    Returns:
        List of dicts: [{'x': float, 'y': float, 'label': int}]
    """
    if dataset_type == 'moons':
        X, y = make_moons(n_samples=n_samples, noise=noise, random_state=42)
    elif dataset_type == 'circles':
        X, y = make_circles(n_samples=n_samples, noise=noise, factor=0.5, random_state=42)
    elif dataset_type == 'blobs':
        X, y = make_blobs(n_samples=n_samples, centers=3, n_features=2, cluster_std=1.0 + (noise * 2), random_state=42)
    elif dataset_type == 'classification':
        # Linear-ish classification problem
        X, y = make_classification(n_samples=n_samples, n_features=2, n_redundant=0,
                                   n_informative=2, n_clusters_per_class=1,
                                   flip_y=noise, class_sep=1.5, random_state=42)
    elif dataset_type == 'regression':
        # Sine wave
        X = np.sort(5 * np.random.rand(n_samples, 1), axis=0)
        y = np.sin(X).ravel()
        y[::5] += 3 * (0.5 - np.random.rand(n_samples // 5)) # Add outliers/noise
        # Normalize/Scale X to be 2D for consistency?
        # Our system expects 2D X (x, y coordinates) for visualization.
        # But for regression 1D X -> 1D Y is easier to visualize (line plot).
        # If we stick to 2D features for regression, it's a surface plot (heatmap).
        # Let's stick to 1D regression for visualization clarity?
        # But the frontend expects "x" and "y" as features for the scatter plot.
        # If we do 1D regression, X is feature, Y is target.
        # In our DataPoint model: x, y, label.
        # For classification: x, y are features, label is class.
        # For regression: x is feature, y is target?
        # Or x, y are features, label is target (Z)?

        # PROMPT: "visualize 'recursive partitioning of feature space', 2D datasets are best (2 features, X and Y axes)."
        # This implies 2 features for classification.
        # For regression with 2 features, the target is a 3rd dimension (color/height).
        # "Decision Tree: ... and maybe Regression (MSE)?"

        # Let's support 2D regression. X, Y are features. Label is the continuous target.
        X_reg = np.random.rand(n_samples, 2) * 10 - 5 # range -5 to 5
        # Z = sin(x) + cos(y)
        y_reg = np.sin(X_reg[:, 0]) + np.cos(X_reg[:, 1]) + np.random.normal(0, noise, n_samples)

        X = X_reg
        y = y_reg

    else:
        raise ValueError(f"Unknown dataset type: {dataset_type}")

    # Normalize data to roughly [-1, 1] or similar range for easier plotting?
    # Actually, raw values are fine, D3 can handle scaling.
    # But for consistency, let's keep them as is.

    data = []
    for i in range(len(y)):
        data.append({
            "x": float(X[i][0]),
            "y": float(X[i][1]),
            "label": int(y[i])
        })

    return data
