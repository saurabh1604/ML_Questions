import React from 'react';

const Sidebar = ({
    datasetType, setDatasetType,
    noise, setNoise,
    onGenerate,
    algoType, setAlgoType,
    params, setParams,
    onTrain
}) => {
    return (
        <div className="w-80 bg-gray-100 h-screen p-4 flex flex-col gap-4 border-r border-gray-200 overflow-y-auto">
            <h1 className="text-xl font-bold text-blue-600">Tree Visualizer</h1>

            <div className="bg-white p-4 rounded shadow-sm">
                <h2 className="font-semibold mb-2">1. Dataset</h2>
                <div className="flex flex-col gap-2">
                    <label className="text-sm">Type:</label>
                    <select
                        value={datasetType}
                        onChange={(e) => setDatasetType(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="moons">Moons</option>
                        <option value="circles">Circles</option>
                        <option value="blobs">Blobs</option>
                        <option value="classification">Linear</option>
                        <option value="regression">Sine Wave (Regression)</option>
                    </select>

                    <label className="text-sm">Noise: {noise}</label>
                    <input
                        type="range"
                        min="0" max="0.5" step="0.05"
                        value={noise}
                        onChange={(e) => setNoise(parseFloat(e.target.value))}
                        className="w-full"
                    />

                    <button
                        onClick={onGenerate}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                    >
                        Generate Data
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
                <h2 className="font-semibold mb-2">2. Algorithm</h2>
                <div className="flex flex-col gap-2">
                    <label className="text-sm">Model:</label>
                    <select
                        value={algoType}
                        onChange={(e) => setAlgoType(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="tree">Decision Tree</option>
                        <option value="forest">Random Forest</option>
                        <option value="boosting">Gradient Boosting</option>
                    </select>

                    <label className="text-sm">Max Depth: {params.max_depth}</label>
                    <input
                        type="range"
                        min="1" max="10"
                        value={params.max_depth}
                        onChange={(e) => setParams({...params, max_depth: parseInt(e.target.value)})}
                        className="w-full"
                    />

                    <label className="text-sm">Min Samples Split: {params.min_samples_split}</label>
                    <input
                        type="range"
                        min="2" max="20"
                        value={params.min_samples_split}
                        onChange={(e) => setParams({...params, min_samples_split: parseInt(e.target.value)})}
                        className="w-full"
                    />

                    {algoType === 'tree' && datasetType !== 'regression' && (
                        <>
                            <label className="text-sm">Criterion:</label>
                            <select
                                value={params.criterion}
                                onChange={(e) => setParams({...params, criterion: e.target.value})}
                                className="p-2 border rounded"
                            >
                                <option value="gini">Gini</option>
                                <option value="entropy">Entropy</option>
                            </select>
                        </>
                    )}

                    {datasetType === 'regression' && (
                         <>
                            <label className="text-sm">Criterion:</label>
                            <select
                                value={params.criterion}
                                onChange={(e) => setParams({...params, criterion: e.target.value})}
                                className="p-2 border rounded"
                            >
                                <option value="mse">MSE</option>
                                <option value="friedman_mse">Friedman MSE</option>
                            </select>
                        </>
                    )}

                    {(algoType === 'forest' || algoType === 'boosting') && (
                        <>
                            <label className="text-sm">N Estimators: {params.n_estimators}</label>
                            <input
                                type="range"
                                min="1" max="50"
                                value={params.n_estimators}
                                onChange={(e) => setParams({...params, n_estimators: parseInt(e.target.value)})}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-400 mt-1">Tip: Change N to see the ensemble grow!</p>
                        </>
                    )}

                    {algoType === 'boosting' && (
                        <>
                            <label className="text-sm">Learning Rate: {params.learning_rate}</label>
                            <input
                                type="range"
                                min="0.01" max="1.0" step="0.05"
                                value={params.learning_rate}
                                onChange={(e) => setParams({...params, learning_rate: parseFloat(e.target.value)})}
                                className="w-full"
                            />
                        </>
                    )}

                    <button
                        onClick={onTrain}
                        className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition mt-2"
                    >
                        Train Model
                    </button>
                </div>
            </div>

            <div className="text-xs text-gray-500 mt-auto">
                Built with React + D3 + FastAPI
            </div>
        </div>
    );
};

export default Sidebar;
