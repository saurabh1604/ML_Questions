import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ScatterPlot from './components/ScatterPlot';
import TreeDiagram from './components/TreeDiagram';
import StepByStepMath from './components/StepByStepMath';
import { fetchDataset, trainTree, trainForest, trainBoosting } from './api';
import * as d3 from 'd3';

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

    // Initial load
    useEffect(() => {
        handleGenerateData();
    }, []);

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

            <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto h-full scroll-smooth">
                {/* Header Stats */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 shrink-0">
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
                        {loading && <span className="text-indigo-600 font-medium animate-pulse">Running...</span>}
                        {error && <span className="text-rose-500 font-semibold text-sm bg-rose-50 px-3 py-1 rounded-full">{error}</span>}
                        {modelResult && (
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Model Score</p>
                                <p className="text-2xl font-bold text-emerald-600">{modelResult.score?.toFixed(4)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Visualizations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                    {/* Scatter Plot */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">Feature Space</h3>
                            <span className="text-xs text-slate-400">Interactive Visualization</span>
                        </div>
                        <div className="flex-1 relative min-h-[400px] flex items-center justify-center bg-slate-50 rounded-b-xl overflow-hidden">
                             {/* Container for ScatterPlot. We pass a key to force re-render if needed, but resizing is better. */}
                            <ScatterPlot
                                data={data}
                                boundaries={modelResult?.boundaries}
                                boundaryGrid={modelResult?.boundary_grid}
                                task={datasetType === 'regression' ? 'regression' : 'classification'}
                                width={500} // Temporary fixed
                                height={400} // Temporary fixed
                                selectedRegion={selectedNode?.region}
                            />
                        </div>
                    </div>

                    {/* Tree Viz */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">Model Structure</h3>
                            <span className="text-xs text-slate-400">
                                {algoType === 'tree' ? 'Click nodes to inspect' : 'Ensemble Preview'}
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-50 rounded-b-xl min-h-[400px] flex items-center justify-center">
                            {modelResult && algoType === 'tree' ? (
                                <TreeDiagram
                                    structure={modelResult.structure}
                                    task={datasetType === 'regression' ? 'regression' : 'classification'}
                                    onNodeClick={setSelectedNode}
                                    selectedNode={selectedNode}
                                    dataDomain={dataDomain}
                                />
                            ) : modelResult && (algoType === 'forest' || algoType === 'boosting') ? (
                                 <div className="p-6 grid gap-6 w-full">
                                    {modelResult.trees.map((tree, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                            <p className="font-bold text-xs text-slate-400 mb-2 uppercase">Estimator #{idx + 1}</p>
                                            <div className="overflow-auto flex justify-center min-h-[300px]">
                                                <TreeDiagram
                                                    structure={tree}
                                                    task={datasetType === 'regression' ? 'regression' : 'classification'}
                                                    onNodeClick={setSelectedNode}
                                                    selectedNode={selectedNode}
                                                    dataDomain={dataDomain}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <span className="text-4xl">🌲</span>
                                    <p>Train a model to see its structure</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step-by-Step Math Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0 h-[400px]">
                    <StepByStepMath selectedNode={selectedNode} />
                </div>
            </main>
        </div>
    );
}

export default App;
