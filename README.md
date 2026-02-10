# Interactive Decision Tree Visualizer

An interactive educational tool to visualize and understand Decision Trees, Random Forests, and Gradient Boosting algorithms.

## Features

- **Synthetic Datasets**: Generate 2D classification (Moons, Circles, Blobs) and regression datasets.
- **Interactive Tree Construction**: Train Decision Trees with adjustable parameters (max depth, min samples split).
- **Visualization**:
    - **Feature Space**: See decision boundaries update in real-time.
    - **Tree Structure**: Explore the tree nodes and splits.
    - **Math Panel**: Click on nodes to see detailed impurity (Gini/Entropy/MSE) and Information Gain calculations.
- **Ensemble Methods**: Visualize the decision boundaries of Random Forests and Gradient Boosting models.

## Prerequisites

- **Python 3.8+**
- **Node.js 16+** & **npm**

## Setup & Run

### 1. Backend (FastAPI)

The backend handles data generation and model training.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend (React + Vite)

The frontend provides the interactive visualization.

```bash
cd frontend
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

## Usage

1.  **Generate Data**: Select a dataset type (e.g., Moons) and click "Generate Data".
2.  **Train Model**: Choose an algorithm (Decision Tree, Forest, Boosting) and adjust hyperparameters. Click "Train Model".
3.  **Explore**:
    - View the decision boundary in the scatter plot.
    - If using a single Decision Tree, explore the tree structure on the right.
    - Click any node to see the mathematical details in the bottom panel.

## Technology Stack

- **Backend**: Python, FastAPI, Scikit-Learn, Pandas, NumPy.
- **Frontend**: React, D3.js, Tailwind CSS, Vite.
