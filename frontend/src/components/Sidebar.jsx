import React from 'react';
import { Database, Cpu, Activity, Play, Settings, Info, Layers, Zap, GitBranch } from 'lucide-react';

const Sidebar = ({
    datasetType, setDatasetType,
    noise, setNoise,
    onGenerate,
    algoType, setAlgoType,
    params, setParams,
    onTrain
}) => {

    const updateParam = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-80 h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Activity className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">TreeViz</h1>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Interactive ML</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* Dataset Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Database className="w-3 h-3" /> Data Configuration
                    </div>

                    {/* Dataset Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block">Dataset Shape</label>
                        <div className="relative group">
                            <select
                                value={datasetType}
                                onChange={(e) => setDatasetType(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:bg-white"
                            >
                                <option value="moons">🌙 Moons (Non-linear)</option>
                                <option value="circles">⭕ Circles (Concentric)</option>
                                <option value="blobs">🔵 Blobs (Clusters)</option>
                                <option value="classification">📏 Linear Separation</option>
                                <option value="regression">📈 Sine Wave (Regression)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>

                    {/* Noise Slider */}
                    <div className="space-y-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-600">Noise Level</label>
                            <span className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">{noise}</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="0.5" step="0.05"
                            value={noise}
                            onChange={(e) => setNoise(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                        />
                        <button
                            onClick={onGenerate}
                            className="w-full py-2 bg-white border border-slate-200 text-indigo-600 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        >
                            Regenerate Samples
                        </button>
                    </div>
                </section>

                {/* Model Section */}
                <section className="space-y-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Cpu className="w-3 h-3" /> Model Architecture
                    </div>

                    {/* Algo Selector */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl">
                        {[
                            { id: 'tree', icon: GitBranch, label: 'Tree' },
                            { id: 'forest', icon: Layers, label: 'Forest' },
                            { id: 'boosting', icon: Zap, label: 'Boost' }
                        ].map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => setAlgoType(id)}
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                                    algoType === id
                                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Hyperparameters */}
                    <div className="space-y-4">
                        {/* Max Depth */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-700">Max Depth</label>
                                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{params.max_depth}</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="15"
                                value={params.max_depth}
                                onChange={(e) => updateParam('max_depth', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                            />
                            <p className="text-[10px] text-slate-400 leading-tight">Controls model complexity and overfitting risk.</p>
                        </div>

                        {/* Min Samples Split */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-700">Min Samples Split</label>
                                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{params.min_samples_split}</span>
                            </div>
                            <input
                                type="range"
                                min="2" max="20"
                                value={params.min_samples_split}
                                onChange={(e) => updateParam('min_samples_split', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                            />
                        </div>

                        {/* Criterion (Tree Only) */}
                        {algoType === 'tree' && datasetType !== 'regression' && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Split Criterion</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['gini', 'entropy'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => updateParam('criterion', c)}
                                            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
                                                params.criterion === c
                                                ? 'bg-white text-emerald-600 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* N Estimators (Forest/Boosting) */}
                        {(algoType === 'forest' || algoType === 'boosting') && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">N Estimators</label>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{params.n_estimators}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="50"
                                    value={params.n_estimators}
                                    onChange={(e) => updateParam('n_estimators', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400"
                                />
                                <p className="text-[10px] text-slate-400 leading-tight">
                                    {algoType === 'forest' ? 'Number of trees in the forest.' : 'Number of boosting stages.'}
                                </p>
                            </div>
                        )}

                        {/* Learning Rate (Boosting) */}
                         {algoType === 'boosting' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Learning Rate</label>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{params.learning_rate}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.01" max="1.0" step="0.01"
                                    value={params.learning_rate || 0.1}
                                    onChange={(e) => updateParam('learning_rate', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={onTrain}
                    className="w-full group relative py-3 px-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2">
                        <Play className="w-4 h-4 fill-current" />
                        Train Model
                    </span>
                </button>

                <div className="mt-4 flex gap-3 text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <Info className="w-4 h-4 shrink-0 text-slate-300" />
                    <p className="leading-relaxed">
                        {algoType === 'tree' && "Split data recursively to maximize information gain."}
                        {algoType === 'forest' && "Ensemble of decorrelated trees to reduce variance."}
                        {algoType === 'boosting' && "Sequential trees correcting previous errors."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
