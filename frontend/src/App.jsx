import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ScatterPlot from './components/ScatterPlot';
import TreeDiagram from './components/TreeDiagram';
import StepByStepMath from './components/StepByStepMath';
import { fetchDataset, trainTree, trainForest, trainBoosting } from './api';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [datasetType, setDatasetType] = useState('moons');
    const [noise, setNoise] = useState(0.2);
    const [algoType, setAlgoType] = useState('tree');

    // Model Params
    const [params, setParams] = useState({
        max_depth: 3,
        min_samples_split: 2,
        criterion: 'gini',
        n_estimators: 10,
        learning_rate: 0.1
    });

    const [data, setData] = useState([]);
    const [modelResult, setModelResult] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ensembleTreeIndex, setEnsembleTreeIndex] = useState(0);

    // Initial load
    useEffect(() => {
        handleGenerateData();
    }, []);

    // Reset Model & Selection on Algo/Dataset change
    useEffect(() => {
        setModelResult(null);
        setSelectedNode(null);
        setError(null);
        setEnsembleTreeIndex(0);
    }, [datasetType, algoType]);

    const handleGenerateData = async () => {
        setLoading(true);
        try {
            const points = await fetchDataset(datasetType, 300, noise);
            setData(points);
            setModelResult(null);
            setSelectedNode(null);
        } catch (err) {
            setError("Failed to fetch data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTrain = async () => {
        if (!data || data.length === 0) return;
        setLoading(true);
        setError(null);
        setSelectedNode(null);
        setEnsembleTreeIndex(0);

        try {
            let result;
            const task = datasetType === 'regression' ? 'regression' : 'classification';
            let currentParams = { ...params, task };

            if (algoType === 'tree') {
                result = await trainTree(data, currentParams);
            } else if (algoType === 'forest') {
                result = await trainForest(data, currentParams);
            } else if (algoType === 'boosting') {
                result = await trainBoosting(data, currentParams);
            }
            setModelResult(result);
        } catch (err) {
            setError("Training failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getDataDomain = () => {
        if (!data || data.length === 0) return null;
        const xExtent = d3.extent(data, d => d.x);
        const yExtent = d3.extent(data, d => d.y);
        return {
            xMin: xExtent[0] - 0.5,
            xMax: xExtent[1] + 0.5,
            yMin: yExtent[0] - 0.5,
            yMax: yExtent[1] + 0.5
        };
    };

    const dataDomain = getDataDomain();

    // Determine what to show in Tree View
    const getTreeStructure = () => {
        if (!modelResult) return null;
        if (algoType === 'tree') return modelResult.structure;
        if (modelResult.trees && modelResult.trees.length > 0) {
            return modelResult.trees[ensembleTreeIndex];
        }
        return null;
    };

    const currentTreeStructure = getTreeStructure();

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar - Sticky */}
            <div className="sticky top-0 h-screen overflow-y-auto shrink-0 z-20">
                <Sidebar
                    datasetType={datasetType} setDatasetType={setDatasetType}
                    noise={noise} setNoise={setNoise}
                    onGenerate={handleGenerateData}
                    algoType={algoType} setAlgoType={setAlgoType}
                    params={params} setParams={setParams}
                    onTrain={handleTrain}
                />
            </div>

            <main className="flex-1 p-8 flex flex-col gap-8 w-full overflow-x-hidden">
                {/* Header Stats */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-100 shrink-0"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {algoType === 'tree' ? 'Decision Tree Analysis' :
                             algoType === 'forest' ? 'Random Forest Ensemble' : 'Gradient Boosting Machine'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Task: <span className="font-semibold uppercase text-slate-700">{datasetType === 'regression' ? 'Regression' : 'Classification'}</span>
                            <span className="mx-2">•</span>
                            <span>Explore the mathematical intuition behind the algorithm.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        {loading && <span className="text-indigo-600 font-medium animate-pulse flex items-center gap-2"><span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span> Training...</span>}
                        {error && <span className="text-rose-500 font-semibold text-sm bg-rose-50 px-3 py-1 rounded-full">{error}</span>}
                        {modelResult && (
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Model Score</p>
                                <p className="text-3xl font-bold text-emerald-600 tabular-nums">{modelResult.score?.toFixed(4)}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Main Visualizations Grid - Large Height */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[600px] lg:min-h-[70vh]">
                    {/* Scatter Plot */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-1 rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden ring-1 ring-slate-900/5"
                    >
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center shrink-0 bg-slate-50/30">
                            <div>
                                <h3 className="font-bold text-slate-700 text-lg">Feature Space</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Visualizing Decision Boundaries</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500 block" title="Class 0"></span>
                                <span className="w-3 h-3 rounded-full bg-red-500 block" title="Class 1"></span>
                            </div>
                        </div>
                        <div className="flex-1 relative bg-white rounded-b-xl overflow-hidden min-h-[500px]">
                             {/* Container for ScatterPlot. Pass key to force re-render if needed. */}
                            <ScatterPlot
                                data={data}
                                boundaries={modelResult?.boundaries}
                                boundaryGrid={modelResult?.boundary_grid}
                                task={datasetType === 'regression' ? 'regression' : 'classification'}
                                selectedRegion={selectedNode?.region}
                            />
                        </div>
                    </motion.div>

                    {/* Tree Viz */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-1 rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden ring-1 ring-slate-900/5"
                    >
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center shrink-0 bg-slate-50/30">
                            <div>
                                <h3 className="font-bold text-slate-700 text-lg">Tree Structure</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {algoType === 'tree' ? 'Interactive Hierarchy - Click nodes to inspect' : 'Ensemble Component Viewer'}
                                </p>
                            </div>
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">Zoom & Pan Enabled</span>
                        </div>

                        <div className="flex-1 relative bg-slate-50/50 rounded-b-xl overflow-hidden min-h-[500px]">
                            {modelResult ? (
                                <>
                                    {/* Ensemble Controls Overlay */}
                                    {(algoType === 'forest' || algoType === 'boosting') && modelResult?.trees && (
                                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-full px-4 py-2 flex items-center gap-3">
                                            <button
                                                onClick={() => setEnsembleTreeIndex(i => Math.max(0, i - 1))}
                                                disabled={ensembleTreeIndex === 0}
                                                className="p-1.5 hover:bg-slate-100 rounded-full disabled:opacity-30 text-slate-600 transition"
                                            >
                                                &larr;
                                            </button>
                                            <span className="text-sm font-mono font-bold text-slate-700 min-w-[100px] text-center">
                                                Tree {ensembleTreeIndex + 1} / {modelResult.trees.length}
                                            </span>
                                            <button
                                                onClick={() => setEnsembleTreeIndex(i => Math.min(modelResult.trees.length - 1, i + 1))}
                                                disabled={ensembleTreeIndex === modelResult.trees.length - 1}
                                                className="p-1.5 hover:bg-slate-100 rounded-full disabled:opacity-30 text-slate-600 transition"
                                            >
                                                &rarr;
                                            </button>
                                        </div>
                                    )}

                                    {/* Tree Diagram */}
                                    <TreeDiagram
                                        structure={currentTreeStructure}
                                        task={datasetType === 'regression' ? 'regression' : 'classification'}
                                        onNodeClick={setSelectedNode}
                                        selectedNode={selectedNode}
                                        dataDomain={dataDomain}
                                    />
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">🌲</div>
                                    <p className="font-medium">Train a model to see its structure</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Step-by-Step Math Panel - Detailed Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden shrink-0 ring-1 ring-slate-900/5 min-h-[400px]"
                >
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="font-bold text-slate-800 text-lg">Mathematical Analysis</h3>
                        <p className="text-sm text-slate-500">Detailed breakdown of the splitting criteria and information gain.</p>
                    </div>
                    <div className="p-0">
                        <StepByStepMath selectedNode={selectedNode} />
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

export default App;
