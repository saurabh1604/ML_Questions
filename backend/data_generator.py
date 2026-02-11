import numpy as np
from sklearn.datasets import make_moons, make_circles, make_blobs, make_classification

def generate_data(dataset_type: str, n_samples: int = 300, noise: float = 0.2):
    """
    Generates synthetic 2D datasets.

    Args:
        dataset_type: 'moons', 'circles', 'blobs', 'classification', 'regression'
        n_samples: Number of samples
        noise: Noise level (0.0 to 1.0)

    Returns:
        List of dicts: [{'x': float, 'y': float, 'label': float}]
    """
    if dataset_type == 'moons':
        X, y = make_moons(n_samples=n_samples, noise=noise, random_state=42)
    elif dataset_type == 'circles':
        X, y = make_circles(n_samples=n_samples, noise=noise, factor=0.5, random_state=42)
    elif dataset_type == 'blobs':
        X, y = make_blobs(n_samples=n_samples, centers=3, n_features=2, cluster_std=1.0 + (noise * 2), random_state=42)
    elif dataset_type == 'classification':
        X, y = make_classification(n_samples=n_samples, n_features=2, n_redundant=0,
                                   n_informative=2, n_clusters_per_class=1,
                                   flip_y=noise, class_sep=1.5, random_state=42)
    elif dataset_type == 'regression':
        # 2D Regression: Target Z = f(X, Y)
        # Let's generate random points in [-3, 3]
        X = np.random.uniform(-3, 3, size=(n_samples, 2))
        # Function: Z = sin(x) + cos(y)
        y = np.sin(X[:, 0]) + np.cos(X[:, 1])
        # Add noise
        y += np.random.normal(0, noise, n_samples)
    else:
        raise ValueError(f"Unknown dataset type: {dataset_type}")

    data = []
    for i in range(len(y)):
        data.append({
            "x": float(X[i][0]),
            "y": float(X[i][1]),
            "label": float(y[i])
        })

    return data
