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
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            <Sidebar
                datasetType={datasetType} setDatasetType={setDatasetType}
                noise={noise} setNoise={setNoise}
                onGenerate={handleGenerateData}
                algoType={algoType} setAlgoType={setAlgoType}
                params={params} setParams={setParams}
                onTrain={handleTrain}
            />

            <main className="flex-1 p-6 flex flex-col gap-6 h-full min-h-0 relative">
                {/* Header Stats */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center bg-white/80 backdrop-blur p-4 rounded-xl shadow-sm border border-slate-100 shrink-0 z-10"
                >
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {algoType === 'tree' ? 'Decision Tree' :
                             algoType === 'forest' ? 'Random Forest' : 'Gradient Boosting'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            Task: <span className="font-semibold uppercase text-slate-700">{datasetType === 'regression' ? 'Regression' : 'Classification'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {loading && <span className="text-indigo-600 font-medium animate-pulse flex items-center gap-2"><span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span> Training...</span>}
                        {error && <span className="text-rose-500 font-semibold text-sm bg-rose-50 px-3 py-1 rounded-full">{error}</span>}
                        {modelResult && (
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Model Score</p>
                                <p className="text-2xl font-bold text-emerald-600">{modelResult.score?.toFixed(4)}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Visualizations Grid - Flex-1 to fill available height, min-h-0 allows shrinking */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    {/* Scatter Plot */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="font-semibold text-slate-700">Feature Space</h3>
                            <span className="text-xs text-slate-400">Interactive Visualization</span>
                        </div>
                        <div className="flex-1 relative min-h-0 bg-slate-50 rounded-b-xl overflow-hidden">
                             {/* Container for ScatterPlot. We pass a key to force re-render if needed, but resizing is better. */}
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="font-semibold text-slate-700">Model Structure</h3>
                            <span className="text-xs text-slate-400">
                                {algoType === 'tree' ? 'Zoom & Pan to Explore' : 'Ensemble Trees Viewer'}
                            </span>
                        </div>

                        <div className="flex-1 relative bg-slate-50 rounded-b-xl overflow-hidden min-h-0">
                            {modelResult ? (
                                <>
                                    {/* Ensemble Controls Overlay */}
                                    {(algoType === 'forest' || algoType === 'boosting') && modelResult?.trees && (
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-full px-2 py-1 flex items-center gap-2">
                                            <button
                                                onClick={() => setEnsembleTreeIndex(i => Math.max(0, i - 1))}
                                                disabled={ensembleTreeIndex === 0}
                                                className="p-1.5 hover:bg-slate-100 rounded-full disabled:opacity-30 text-slate-600 transition"
                                            >
                                                &larr;
                                            </button>
                                            <span className="text-xs font-mono font-bold text-slate-700 min-w-[80px] text-center">
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <span className="text-4xl opacity-50">🌲</span>
                                    <p>Train a model to see its structure</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Step-by-Step Math Panel - Fixed height at bottom, flex-shrink-0 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0 h-[300px] relative z-20"
                >
                    <StepByStepMath selectedNode={selectedNode} />
                </motion.div>
            </main>
        </div>
    );
}

export default App;
