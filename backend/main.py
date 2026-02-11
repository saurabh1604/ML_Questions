from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from data_generator import generate_data
from tree_utils import tree_to_json, get_decision_boundaries

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataPoint(BaseModel):
    x: float
    y: float
    label: int

class DatasetRequest(BaseModel):
    type: str
    noise: float = 0.2
    n_samples: int = 300

class TrainTreeRequest(BaseModel):
    data: List[DataPoint]
    max_depth: int = 5
    min_samples_split: int = 2
    criterion: str = "gini"
    task: str = "classification" # classification or regression

class TrainForestRequest(BaseModel):
    data: List[DataPoint]
    n_estimators: int = 10
    max_depth: int = 5
    min_samples_split: int = 2
    criterion: str = "gini"
    task: str = "classification"

class TrainBoostingRequest(BaseModel):
    data: List[DataPoint]
    n_estimators: int = 10
    learning_rate: float = 0.1
    max_depth: int = 3
    task: str = "classification"

@app.get("/")
def read_root():
    return {"message": "Decision Tree Visualizer API"}

@app.post("/api/data")
def get_data(req: DatasetRequest):
    try:
        data = generate_data(req.type, req.n_samples, req.noise)
        return {"data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/train/tree")
def train_tree(req: TrainTreeRequest):
    # Convert data to numpy
    df = pd.DataFrame([d.model_dump() for d in req.data])
    X = df[['x', 'y']].values
    y = df['label'].values

    if req.task == "regression":
        # Check criterion
        crit = "squared_error" if req.criterion == "mse" else req.criterion
        # Default for regression is 'squared_error', classification is 'gini'
        if crit not in ["squared_error", "friedman_mse", "absolute_error", "poisson"]:
             crit = "squared_error" # Fallback

        clf = DecisionTreeRegressor(
            max_depth=req.max_depth,
            min_samples_split=req.min_samples_split,
            criterion=crit,
            random_state=42
        )
    else:
        clf = DecisionTreeClassifier(
            max_depth=req.max_depth,
            min_samples_split=req.min_samples_split,
            criterion=req.criterion,
            random_state=42
        )

    clf.fit(X, y)

    # Get tree structure
    structure = tree_to_json(clf, feature_names=["x", "y"])

    # Get decision boundaries (rectangles)
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5

    # Boundaries logic is same for visualization (rectangles in 2D space),
    # but the 'class' in the rectangle will be the predicted value (float).
    boundaries = get_decision_boundaries(clf, x_min, x_max, y_min, y_max)

    return {
        "structure": structure,
        "boundaries": boundaries,
        "score": float(clf.score(X, y)) # R2 for regression, Accuracy for classification
    }

@app.post("/api/train/forest")
def train_forest(req: TrainForestRequest):
    from sklearn.ensemble import RandomForestRegressor
    df = pd.DataFrame([d.model_dump() for d in req.data])
    X = df[['x', 'y']].values
    y = df['label'].values

    if req.task == "regression":
        clf = RandomForestRegressor(
            n_estimators=req.n_estimators,
            max_depth=req.max_depth,
            min_samples_split=req.min_samples_split,
            random_state=42
        )
    else:
        clf = RandomForestClassifier(
            n_estimators=req.n_estimators,
            max_depth=req.max_depth,
            min_samples_split=req.min_samples_split,
            criterion=req.criterion,
            random_state=42
        )
    clf.fit(X, y)

    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.1),
                         np.arange(y_min, y_max, 0.1))

    Z = clf.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    grid_data = []
    for i in range(xx.shape[0]):
        for j in range(xx.shape[1]):
            val = float(Z[i, j])
            grid_data.append({
                "x": float(xx[i, j]),
                "y": float(yy[i, j]),
                "label": val if req.task == "regression" else int(val)
            })

    # Return all trees (up to a safe limit to avoid huge payloads, e.g., 50)
    limit = min(req.n_estimators, 50)
    return {
        "score": float(clf.score(X, y)),
        "boundary_grid": grid_data,
        "trees": [tree_to_json(estimator, feature_names=["x", "y"]) for estimator in clf.estimators_[:limit]]
    }

@app.post("/api/train/boosting")
def train_boosting(req: TrainBoostingRequest):
    from sklearn.ensemble import GradientBoostingRegressor
    # Similar to forest, but we might want to show iterations.
    df = pd.DataFrame([d.model_dump() for d in req.data])
    X = df[['x', 'y']].values
    y = df['label'].values

    if req.task == "regression":
        clf = GradientBoostingRegressor(
            n_estimators=req.n_estimators,
            learning_rate=req.learning_rate,
            max_depth=req.max_depth,
            random_state=42
        )
    else:
        clf = GradientBoostingClassifier(
            n_estimators=req.n_estimators,
            learning_rate=req.learning_rate,
            max_depth=req.max_depth,
            random_state=42
        )
    clf.fit(X, y)

    trees = []
    limit = min(req.n_estimators, 50)
    for i, estimator_array in enumerate(clf.estimators_):
        # Estimator is a DecisionTreeRegressor (predicting residuals)
        # For GBRegressor, estimator_array is shape (1,) -> array([tree])
        # For GBClassifier binary, shape (1,)
        # For GBClassifier multiclass, shape (n_classes,)
        tree = estimator_array[0] # Take the first one (class 0 or only one)
        trees.append(tree_to_json(tree, feature_names=["x", "y"]))
        if i >= limit - 1: break # Limit

    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.1),
                         np.arange(y_min, y_max, 0.1))

    Z = clf.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    grid_data = []
    for i in range(xx.shape[0]):
        for j in range(xx.shape[1]):
            val = float(Z[i, j])
            grid_data.append({
                "x": float(xx[i, j]),
                "y": float(yy[i, j]),
                "label": val if req.task == "regression" else int(val)
            })

    return {
        "score": float(clf.score(X, y)),
        "boundary_grid": grid_data,
        "trees": trees
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
