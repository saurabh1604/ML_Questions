import React from 'react';

const MathPanel = ({ selectedNode }) => {
    if (!selectedNode) {
        return (
            <div className="bg-white p-6 rounded shadow-lg border border-gray-200 h-full flex items-center justify-center text-gray-400">
                Click a node in the tree to see the math behind the split.
            </div>
        );
    }

    const { impurity, samples, value, gain, threshold, feature, children } = selectedNode;
    const isLeaf = !children || children.length === 0;

    return (
        <div className="bg-white p-6 rounded shadow-lg border border-gray-200 h-full overflow-auto text-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center justify-between">
                {isLeaf ? "Leaf Node Details" : "Split Calculation Details"}
                <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Node ID: {feature !== undefined ? 'Split' : 'Leaf'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Impurity</p>
                    <p className="text-lg font-mono font-bold text-gray-800">{impurity.toFixed(4)}</p>
                    <p className="text-xs text-gray-400 mt-1">Measures 'mixedness' (0 = pure)</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Samples</p>
                    <p className="text-lg font-mono font-bold text-gray-800">{samples}</p>
                    <p className="text-xs text-gray-400 mt-1">Points in this region</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100 col-span-2">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Prediction / Value</p>
                    <p className="text-base font-mono font-bold text-gray-800 break-words">{JSON.stringify(value)}</p>
                    <p className="text-xs text-gray-400 mt-1">Class counts or Mean value</p>
                </div>
            </div>

            {!isLeaf && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Split Decision</h4>
                    <div className="bg-blue-50 p-2 rounded border border-blue-100 mb-3 font-mono text-center text-blue-800">
                        Feature <b>{feature === 0 ? "X" : "Y"}</b> &le; <b>{threshold.toFixed(4)}</b>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-10">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                        </div>
                        <p className="font-bold text-yellow-800 mb-1 text-xs uppercase tracking-wide">Information Gain</p>
                        <p className="font-mono text-xs text-yellow-900 mb-2 italic">
                            Gain = Impurity(Parent) - [ Weighted Avg Impurity(Children) ]
                        </p>
                        <p className="font-mono text-2xl font-bold text-yellow-700 text-center my-2">
                            {gain.toFixed(5)}
                        </p>
                        <p className="text-xs text-yellow-800 opacity-80">
                            This split reduces impurity by {gain.toFixed(5)}. Higher is better!
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="border p-2 rounded">
                            <p className="font-bold text-gray-600">Left Child</p>
                            <p>Samples: {children[0].samples}</p>
                            <p>Impurity: {children[0].impurity.toFixed(4)}</p>
                        </div>
                        <div className="border p-2 rounded">
                            <p className="font-bold text-gray-600">Right Child</p>
                            <p>Samples: {children[1].samples}</p>
                            <p>Impurity: {children[1].impurity.toFixed(4)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MathPanel;
