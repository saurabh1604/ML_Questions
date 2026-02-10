import numpy as np
from sklearn.tree import _tree

def tree_to_json(clf, feature_names=None):
    """
    Converts a sklearn Decision Tree to a JSON-serializable dictionary.
    Includes node details: impurity, threshold, samples, value, etc.
    """
    tree_ = clf.tree_
    feature_names = feature_names or [f"Feature {i}" for i in range(tree_.n_features)]

    # Determine criterion to provide correct math context
    criterion = getattr(clf, "criterion", "gini") # Default to gini if not found
    if criterion == "squared_error":
        criterion = "mse"

    def recurse(node):
        impurity = float(tree_.impurity[node])
        n_samples = int(tree_.n_node_samples[node])
        # value is shape (n_nodes, 1, n_classes) for classifier, (n_nodes, 1, 1) for regressor
        value = tree_.value[node][0]
        value_list = value.tolist()

        # Calculate step-by-step math details
        math_details = {
            "criterion": criterion,
            "impurity": impurity,
            "n_samples": n_samples,
            "value": value_list
        }

        if len(value) > 1: # Classification
            # Calculate probabilities robustly (value might be counts or normalized)
            # value sum should be n_samples (if unweighted) or 1.0 (if normalized)
            # Safe way: value / sum(value)
            val_sum = np.sum(value)
            if val_sum > 0:
                probs_array = value / val_sum
            else:
                probs_array = np.zeros_like(value)

            probs = probs_array.tolist()
            math_details["probs"] = probs
            # Estimate counts based on n_samples (since value might be normalized)
            # Rounding to nearest integer for display clarity if close
            counts = (probs_array * n_samples).tolist()
            math_details["class_counts"] = counts

            if criterion == "gini":
                # Gini = 1 - sum(p^2)
                terms = [(p**2) for p in probs]
                math_details["terms"] = terms
                math_details["formula"] = "1 - sum(p^2)"
            elif criterion == "entropy" or criterion == "log_loss":
                # Entropy = -sum(p * log2(p))
                # Avoid log(0)
                terms = [-p * np.log2(p) if p > 0 else 0.0 for p in probs]
                math_details["terms"] = terms
                math_details["formula"] = "-sum(p * log2(p))"
        else: # Regression
            # Value is mean (or sum, but usually mean in predict)
            # Actually tree_.value for regression is the sum of targets in the node?
            # No, for DecisionTreeRegressor, it's the mean * n_samples (sum) if it's weighted?
            # Let's check sklearn docs or experiment.
            # Usually tree_.value[node] contains the stored value. For standard MSE, it is the mean.
            # Wait, let's verify.
            # In sklearn implementation, for MSE, value stored is indeed the mean prediction for the node.
            pass

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

            weighted_imp_left = (n_left / n_samples) * imp_left
            weighted_imp_right = (n_right / n_samples) * imp_right
            gain = impurity - (weighted_imp_left + weighted_imp_right)

            return {
                "name": name,
                "feature": feature_idx,
                "threshold": threshold,
                "impurity": impurity,
                "samples": n_samples,
                "value": value_list,
                "gain": float(gain),
                "type": "split",
                "math": math_details,
                "children": [left_data, right_data]
            }
        else:
            return {
                "name": "Leaf",
                "impurity": impurity,
                "samples": n_samples,
                "value": value_list,
                "type": "leaf",
                "math": math_details
            }

    return recurse(0)

def get_decision_boundaries(clf, x_min, x_max, y_min, y_max, step=0.05):
    """
    Generates a list of rectangular regions defining the decision boundaries.
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
