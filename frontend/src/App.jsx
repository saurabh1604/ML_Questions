import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ScatterPlot from './components/ScatterPlot';
import TreeDiagram from './components/TreeDiagram';
import MathPanel from './components/MathPanel';
import { fetchDataset, trainTree, trainForest, trainBoosting } from './api';
import * as d3 from 'd3'; // Import d3 to calculate extent

function App() {
    const [datasetType, setDatasetType] = useState('moons');
    const [noise, setNoise] = useState(0.2);
    const [algoType, setAlgoType] = useState('tree');

    // Model Params
    const [params, setParams] = useState({
        max_depth: 3,
        min_samples_split: 2,
        criterion: 'gini', // or 'mse'
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
    }, []); // Run once on mount

    const handleGenerateData = async () => {
        setLoading(true);
        try {
            const points = await fetchDataset(datasetType, 300, noise);
            setData(points);
            setModelResult(null); // Clear previous model
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
            // Adjust criterion for regression if needed
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

    // Calculate Data Domain for Tree Recursion
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
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar
                datasetType={datasetType} setDatasetType={setDatasetType}
                noise={noise} setNoise={setNoise}
                onGenerate={handleGenerateData}
                algoType={algoType} setAlgoType={setAlgoType}
                params={params} setParams={setParams}
                onTrain={handleTrain}
            />

            <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                <div className="flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {algoType === 'tree' ? 'Decision Tree' :
                         algoType === 'forest' ? 'Random Forest' : 'Gradient Boosting'}
                        Visualization
                    </h2>
                    {loading && <span className="text-blue-500 font-semibold animate-pulse">Processing...</span>}
                    {error && <span className="text-red-500 font-semibold">{error}</span>}
                </div>

                <div className="flex flex-1 gap-6 min-h-0">
                    {/* Scatter Plot - Fixed width/height or responsive? Fixed for D3 simplicity */}
                    <div className="flex-none">
                        <ScatterPlot
                            data={data}
                            boundaries={modelResult?.boundaries} // Only for tree
                            boundaryGrid={modelResult?.boundary_grid} // For forest/boosting
                            task={datasetType === 'regression' ? 'regression' : 'classification'}
                            width={500}
                            height={500}
                            selectedRegionId={null} // We pass selectedNode.region instead
                            selectedRegion={selectedNode?.region}
                        />
                        {modelResult && (
                             <div className="mt-2 text-center text-sm font-semibold text-gray-600">
                                Model Score: {modelResult.score?.toFixed(4)}
                             </div>
                        )}
                    </div>

                    {/* Tree Viz or List of Trees */}
                    <div className="flex-1 bg-white rounded shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                        {modelResult && algoType === 'tree' ? (
                            <TreeDiagram
                                structure={modelResult.structure}
                                width={800} // Make it wider? Or responsive?
                                height={500}
                                onNodeClick={setSelectedNode}
                                selectedNode={selectedNode}
                                dataDomain={dataDomain}
                            />
                        ) : modelResult && (algoType === 'forest' || algoType === 'boosting') ? (
                             <div className="p-4 overflow-auto h-full">
                                <h3 className="font-bold mb-2">Ensemble Trees (First 3)</h3>
                                <div className="flex flex-col gap-4">
                                    {modelResult.trees.map((tree, idx) => (
                                        <div key={idx} className="border p-2 rounded">
                                            <p className="font-semibold text-sm mb-1">Tree #{idx + 1}</p>
                                            <TreeDiagram
                                                structure={tree}
                                                width={600}
                                                height={300}
                                                onNodeClick={setSelectedNode}
                                                selectedNode={selectedNode}
                                                dataDomain={dataDomain}
                                            />
                                        </div>
                                    ))}
                                </div>
                             </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Train a model to see results
                            </div>
                        )}
                    </div>
                </div>

                {/* Math Panel */}
                <div className="h-64 shrink-0 bg-white p-4 rounded shadow border-t border-gray-200 overflow-hidden">
                    <MathPanel selectedNode={selectedNode} />
                </div>
            </main>
        </div>
    );
}

export default App;
