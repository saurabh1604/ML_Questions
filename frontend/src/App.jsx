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

    // Handle Data Generation (Initial + Change)
    useEffect(() => {
        handleGenerateData();
    }, [datasetType]); // Regenerate when type changes

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
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar - Sticky */}
            <div className="sticky top-0 h-screen overflow-y-auto shrink-0 z-30 shadow-xl shadow-slate-200/50 border-r border-slate-100">
                <Sidebar
                    datasetType={datasetType} setDatasetType={setDatasetType}
                    noise={noise} setNoise={setNoise}
                    onGenerate={handleGenerateData}
                    algoType={algoType} setAlgoType={setAlgoType}
                    params={params} setParams={setParams}
                    onTrain={handleTrain}
                />
            </div>

            <main className="flex-1 p-8 flex flex-col gap-8 w-full overflow-x-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                {/* Header Stats */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100/60"
                >
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {algoType === 'tree' ? 'Decision Tree Analysis' :
                             algoType === 'forest' ? 'Random Forest Ensemble' : 'Gradient Boosting Machine'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-2 font-medium">
                            Task: <span className="uppercase text-slate-800 tracking-wide">{datasetType === 'regression' ? 'Regression' : 'CLASSIFICATION'}</span>
                            <span className="mx-3 text-slate-300">•</span>
                            <span>Explore the mathematical intuition behind the algorithm.</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-8">
                         {/* Status Indicators */}
                         <div className="flex flex-col items-end gap-1">
                            {loading && (
                                <span className="flex items-center gap-2 text-indigo-600 font-semibold text-sm bg-indigo-50 px-3 py-1.5 rounded-full animate-pulse">
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                                    Training Model...
                                </span>
                            )}
                            {error && (
                                <span className="text-rose-600 font-semibold text-xs bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full max-w-xs truncate" title={error}>
                                    Error: {error}
                                </span>
                            )}
                        </div>

                        {/* Score Card */}
                        {modelResult && (
                            <div className="text-right bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Model Score</p>
                                <p className="text-4xl font-black text-emerald-500 tabular-nums tracking-tight">
                                    {modelResult.score?.toFixed(4)}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Main Visualizations Grid - Large Height */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[600px] lg:min-h-[70vh] relative z-10">
                    {/* Scatter Plot Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col overflow-hidden ring-1 ring-slate-900/5 group hover:shadow-2xl transition-shadow duration-500"
                    >
                        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Feature Space</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Visualizing Decision Boundaries</p>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm ring-1 ring-blue-100"></span>
                                    <span className="text-xs font-semibold text-slate-500">Class 0</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm ring-1 ring-rose-100"></span>
                                    <span className="text-xs font-semibold text-slate-500">Class 1</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 relative bg-white rounded-b-2xl overflow-hidden min-h-[500px]">
                            <ScatterPlot
                                data={data}
                                boundaries={modelResult?.boundaries}
                                boundaryGrid={modelResult?.boundary_grid}
                                task={datasetType === 'regression' ? 'regression' : 'classification'}
                                selectedRegion={selectedNode?.region}
                            />
                        </div>
                    </motion.div>

                    {/* Tree Viz Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col overflow-hidden ring-1 ring-slate-900/5 group hover:shadow-2xl transition-shadow duration-500"
                    >
                        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Tree Structure</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">
                                    {algoType === 'tree' ? 'Interactive Hierarchy - Click nodes to inspect' : 'Ensemble Component Viewer'}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200">
                                Zoom & Pan <span className="text-emerald-500 ml-1">Enabled</span>
                            </span>
                        </div>

                        <div className="flex-1 relative bg-slate-50/30 rounded-b-2xl overflow-hidden min-h-[500px]">
                            {modelResult ? (
                                <>
                                    {/* Ensemble Controls Overlay */}
                                    {(algoType === 'forest' || algoType === 'boosting') && modelResult?.trees && (
                                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-white/80 backdrop-blur-md shadow-lg border border-slate-200/60 rounded-full pl-2 pr-2 py-1.5 flex items-center gap-2 transition-all hover:scale-105">
                                            <button
                                                onClick={() => setEnsembleTreeIndex(i => Math.max(0, i - 1))}
                                                disabled={ensembleTreeIndex === 0}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full disabled:opacity-30 text-slate-600 transition disabled:cursor-not-allowed"
                                            >
                                                &larr;
                                            </button>
                                            <div className="flex flex-col items-center px-4 border-x border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tree</span>
                                                <span className="text-sm font-mono font-bold text-slate-700 min-w-[20px] text-center leading-none">
                                                    {ensembleTreeIndex + 1} <span className="text-slate-300 font-light mx-1">/</span> {modelResult.trees.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setEnsembleTreeIndex(i => Math.min(modelResult.trees.length - 1, i + 1))}
                                                disabled={ensembleTreeIndex === modelResult.trees.length - 1}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full disabled:opacity-30 text-slate-600 transition disabled:cursor-not-allowed"
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-6 animate-pulse">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl shadow-inner">🌲</div>
                                    <p className="font-medium text-slate-500">Train a model to reveal its structure</p>
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
                    className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden shrink-0 ring-1 ring-slate-900/5 min-h-[400px] relative z-10"
                >
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 text-xl">Mathematical Analysis</h3>
                        <p className="text-sm text-slate-500 mt-1">Detailed breakdown of the splitting criteria and information gain.</p>
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
