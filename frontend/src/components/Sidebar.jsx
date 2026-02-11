import React from 'react';
import { Settings, Database, Cpu, Activity, Info, BarChart, HelpCircle } from 'lucide-react';

const Sidebar = ({
    datasetType, setDatasetType,
    noise, setNoise,
    onGenerate,
    algoType, setAlgoType,
    params, setParams,
    onTrain
}) => {
    return (
        <div className="w-80 bg-white h-screen p-5 flex flex-col gap-6 border-r border-slate-200 overflow-y-auto shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <Activity className="text-indigo-600 w-8 h-8" />
                <div>
                    <h1 className="text-xl font-bold text-slate-800">TreeViz</h1>
                    <p className="text-xs text-slate-500">Interactive ML Explorer</p>
                </div>
            </div>

            {/* Dataset Section */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4" /> Data Config
                </h2>

                <div className="space-y-1 group relative">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        Dataset Type
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" />
                    </label>
                    <select
                        value={datasetType}
                        onChange={(e) => setDatasetType(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="moons">🌙 Moons (Non-linear)</option>
                        <option value="circles">⭕ Circles (Concentric)</option>
                        <option value="blobs">🔵 Blobs (Clusters)</option>
                        <option value="classification">📏 Linear</option>
                        <option value="regression">📈 Sine Wave (Regression)</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <label className="font-medium text-slate-700">Noise Level</label>
                        <span className="text-slate-500">{noise}</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="0.5" step="0.05"
                        value={noise}
                        onChange={(e) => setNoise(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Adds randomness to data points to simulate real-world errors.</p>
                </div>

                <button
                    onClick={onGenerate}
                    className="w-full py-2 px-4 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Activity className="w-4 h-4" /> Generate New Data
                </button>
            </div>

            {/* Algorithm Section */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Model Config
                </h2>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Algorithm</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                        {['tree', 'forest', 'boosting'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setAlgoType(type)}
                                className={`text-xs py-1.5 rounded-md capitalize transition-all ${
                                    algoType === type
                                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-sm items-center">
                        <label className="font-medium text-slate-700">Max Depth</label>
                        <span className="text-slate-500">{params.max_depth}</span>
                    </div>
                    <input
                        type="range"
                        min="1" max="10"
                        value={params.max_depth}
                        onChange={(e) => setParams({...params, max_depth: parseInt(e.target.value)})}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Limits tree height to prevent overfitting.</p>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-sm items-center">
                        <label className="font-medium text-slate-700">Min Samples Split</label>
                        <span className="text-slate-500">{params.min_samples_split}</span>
                    </div>
                    <input
                        type="range"
                        min="2" max="20"
                        value={params.min_samples_split}
                        onChange={(e) => setParams({...params, min_samples_split: parseInt(e.target.value)})}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Minimum points required to create a new split.</p>
                </div>

                {algoType === 'tree' && datasetType !== 'regression' && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Criterion</label>
                        <select
                            value={params.criterion}
                            onChange={(e) => setParams({...params, criterion: e.target.value})}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        >
                            <option value="gini">Gini Impurity</option>
                            <option value="entropy">Entropy</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-0.5">Method to measure split quality.</p>
                    </div>
                )}

                {(algoType === 'forest' || algoType === 'boosting') && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <label className="font-medium text-slate-700">N Estimators</label>
                            <span className="text-slate-500">{params.n_estimators}</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="50"
                            value={params.n_estimators}
                            onChange={(e) => setParams({...params, n_estimators: parseInt(e.target.value)})}
                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Number of trees in the ensemble.</p>
                    </div>
                )}

                <button
                    onClick={onTrain}
                    className="w-full py-2.5 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-2"
                >
                    <BarChart className="w-4 h-4" /> Train Model
                </button>
            </div>

            <div className="mt-auto p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 flex gap-2 items-start">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                    {algoType === 'tree' && "Decision Trees split data recursively to optimize purity."}
                    {algoType === 'forest' && "Random Forests average many trees to reduce variance (Bagging)."}
                    {algoType === 'boosting' && "Boosting builds trees sequentially to correct errors (Residuals)."}
                </p>
            </div>
        </div>
    );
};

export default Sidebar;
