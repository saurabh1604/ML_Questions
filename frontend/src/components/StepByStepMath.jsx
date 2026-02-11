import React from 'react';
import { Calculator, ArrowRight, GitCommit, ChevronRight, Activity, PieChart, BarChart2, TrendingUp } from 'lucide-react';

const StepByStepMath = ({ selectedNode }) => {
    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Detailed Analysis</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                    Select any node in the tree structure to reveal the mathematical logic behind the decision.
                </p>
            </div>
        );
    }

    const {
        impurity, samples, value,
        gain, threshold, feature, children,
        math
    } = selectedNode;

    // Safety check
    const safeMath = math || { probs: [], class_counts: [], terms: [] };
    const isLeaf = !children || children.length === 0;
    const criterion = safeMath.criterion || 'gini';

    const fmt = (n) => typeof n === 'number' ? n.toFixed(3) : n;

    // Detect Task
    const isRegression = value && value.length === 1;
    const totalSamples = samples || 1;

    // Classification Stats
    const counts = value || [0, 0];
    const p0 = !isRegression ? (counts[0] / totalSamples * 100) : 0;
    const p1 = !isRegression && counts.length > 1 ? (counts[1] / totalSamples * 100) : 0;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isLeaf ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {isLeaf ? <PieChart className="w-6 h-6" /> : <GitCommit className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                            {isLeaf ? 'Leaf Prediction' : 'Split Decision'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                            <span>Samples: {samples}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{criterion === 'mse' ? 'MSE' : 'Impurity'}: {fmt(impurity)}</span>
                        </div>
                    </div>
                </div>

                {!isLeaf && (
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Splitting Rule</span>
                        <div className="text-sm font-mono font-bold text-slate-700">
                            {feature === 0 ? "X" : "Y"} &le; <span className="text-indigo-600">{fmt(threshold)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">

                {/* 1. Distribution / Value */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        {isRegression ? <TrendingUp className="w-4 h-4 text-slate-400" /> : <BarChart2 className="w-4 h-4 text-slate-400" />}
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isRegression ? 'Node Value (Mean)' : 'Class Distribution'}
                        </h4>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                        {isRegression ? (
                            <div className="flex flex-col items-center justify-center py-4">
                                <span className="text-3xl font-mono font-bold text-slate-700">{fmt(value[0])}</span>
                                <span className="text-xs text-slate-400 mt-1">Mean Squared Error: {fmt(impurity)}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex h-6 w-full rounded-full overflow-hidden mb-3 ring-1 ring-slate-200">
                                    <div style={{ width: `${p0}%` }} className="bg-blue-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold">
                                        {p0 > 10 && `${Math.round(p0)}%`}
                                    </div>
                                    <div style={{ width: `${p1}%` }} className="bg-rose-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold">
                                        {p1 > 10 && `${Math.round(p1)}%`}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-slate-600 font-medium">Class 0: <span className="font-mono">{counts[0]}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                        <span className="text-slate-600 font-medium">Class 1: <span className="font-mono">{counts[1]}</span></span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* 2. Impurity Math */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="w-4 h-4 text-slate-400" />
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {criterion === 'mse' ? 'Error Calculation' : `Impurity Calculation (${criterion})`}
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                         {/* Formula Card */}
                         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="text-center py-2">
                                <span className="font-serif text-xl text-slate-700 italic">
                                    {criterion === 'gini' && <span>I = 1 - &sum; (p<sub>i</sub>)<sup>2</sup></span>}
                                    {criterion === 'entropy' && <span>H = - &sum; p<sub>i</sub> log<sub>2</sub>(p<sub>i</sub>)</span>}
                                    {criterion === 'mse' && <span>MSE = &frac12; &sum; (y - &#x0233;)<sup>2</sup></span>}
                                </span>
                            </div>

                            {!isRegression && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-mono text-slate-500 mb-2">Substitution:</p>
                                    <div className="font-mono text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-x-auto">
                                        {criterion === 'gini' ? '1 - ' : '-'} [
                                        {safeMath.terms && safeMath.terms.map((t, i) => (
                                            <span key={i}>{fmt(Math.abs(t))}{i < safeMath.terms.length - 1 ? ' + ' : ''}</span>
                                        ))}
                                        ]
                                    </div>
                                    <div className="mt-2 text-right">
                                        <span className="text-xs text-slate-400 mr-2">=</span>
                                        <span className="text-lg font-bold text-indigo-600">{fmt(impurity)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. Information Gain (Only for splits) */}
                {!isLeaf && children && (
                    <section>
                         <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {isRegression ? 'Variance Reduction' : 'Information Gain'}
                            </h4>
                        </div>

                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full opacity-50 blur-2xl pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-slate-600">Metric Improvement</span>
                                    <span className="text-2xl font-black text-indigo-600 tracking-tight">{fmt(gain)}</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs text-slate-500 font-mono">
                                        Gain = Parent - (Weighted Children)
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-mono text-slate-600 bg-white/60 p-2 rounded border border-indigo-100/50">
                                        {fmt(impurity)} - [
                                        <span className="text-emerald-600 font-bold">{fmt(children[0]?.impurity)}</span>
                                        <span className="text-slate-400 px-1">&times;</span>
                                        <span className="text-amber-600 font-bold">{children[1]?.impurity}</span>
                                        ]
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Children Preview */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                             {children.map((child, i) => (
                                <div key={i} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${i === 0 ? 'bg-indigo-400' : 'bg-rose-400'} rounded-l-xl`}></div>
                                    <div className="pl-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            {i === 0 ? 'True Branch' : 'False Branch'}
                                        </p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-lg font-bold text-slate-700">{fmt(child.impurity)}</span>
                                            <span className="text-xs text-slate-500 font-medium">{child.samples} samples</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default StepByStepMath;
