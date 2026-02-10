import numpy as np
from sklearn.tree import _tree

def tree_to_json(clf, feature_names=None):
    """
    Converts a sklearn Decision Tree to a JSON-serializable dictionary.
    Includes node details: impurity, threshold, samples, value, etc.
    """
    tree_ = clf.tree_
    feature_names = feature_names or [f"Feature {i}" for i in range(tree_.n_features)]

    def recurse(node):
        impurity = float(tree_.impurity[node])
        n_samples = int(tree_.n_node_samples[node])
        value = tree_.value[node][0].tolist() # value is shape (n_nodes, 1, n_classes) for classifier

        # Check if leaf
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            feature_idx = int(tree_.feature[node])
            name = feature_names[feature_idx]
            threshold = float(tree_.threshold[node])

            left_child = tree_.children_left[node]
            right_child = tree_.children_right[node]

            left_data = recurse(left_child)
            right_data = recurse(right_child)

            # Calculate Information Gain (or decrease in impurity)
            # Gain = Impurity(Parent) - ( (N_left/N_parent)*Impurity(Left) + (N_right/N_parent)*Impurity(Right) )
            n_left = left_data['samples']
            n_right = right_data['samples']
            imp_left = left_data['impurity']
            imp_right = right_data['impurity']

            gain = impurity - ((n_left / n_samples) * imp_left + (n_right / n_samples) * imp_right)

            return {
                "name": name,
                "feature": feature_idx,
                "threshold": threshold,
                "impurity": impurity,
                "samples": n_samples,
                "value": value,
                "gain": float(gain),
                "type": "split",
                "children": [left_data, right_data]
                # using 'children' list for d3-hierarchy compatibility usually,
                # but 'left'/'right' is more explicit for binary trees.
                # Let's use 'children' [left, right] to make D3 happy by default,
                # but I'll also keep 'left'/'right' keys if needed or just rely on index 0/1.
            }
        else:
            return {
                "name": "Leaf",
                "impurity": impurity,
                "samples": n_samples,
                "value": value,
                "type": "leaf"
            }

    return recurse(0)

def get_decision_boundaries(clf, x_min, x_max, y_min, y_max, step=0.05):
    """
    Generates a grid of predictions for visualizing decision boundaries.
    Returns a list of polygons or just the grid?
    Grid is easier for heatmap-style background.
    Polygons (rectangles) are better for 'recursive partitioning' visualization.

    Let's extract rectangles!
    We can traverse the tree and define the bounds for each leaf.
    """
    tree_ = clf.tree_
    rectangles = []

    def recurse(node, x_range, y_range):
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            feature_idx = tree_.feature[node]
            threshold = tree_.threshold[node]

            # Split the range
            if feature_idx == 0: # X axis
                left_x_range = (x_range[0], min(x_range[1], threshold))
                right_x_range = (max(x_range[0], threshold), x_range[1])
                left_y_range = y_range
                right_y_range = y_range
            else: # Y axis
                left_y_range = (y_range[0], min(y_range[1], threshold))
                right_y_range = (max(y_range[0], threshold), y_range[1])
                left_x_range = x_range
                right_x_range = x_range

            recurse(tree_.children_left[node], left_x_range, left_y_range)
            recurse(tree_.children_right[node], right_x_range, right_y_range)
        else:
            # Leaf
            value = tree_.value[node][0]
            # Predict class or value
            if len(value) > 1:
                # Classification: Argmax of counts
                cls = int(np.argmax(value))
                pred_val = cls
            else:
                # Regression: The value itself
                pred_val = float(value[0])

            rectangles.append({
                "x": float(x_range[0]),
                "y": float(y_range[0]),
                "width": float(x_range[1] - x_range[0]),
                "height": float(y_range[1] - y_range[0]),
                "class": pred_val, # Use 'class' field for both, frontend interprets it based on task
                "impurity": float(tree_.impurity[node])
            })

    recurse(0, (x_min, x_max), (y_min, y_max))
    return rectangles
