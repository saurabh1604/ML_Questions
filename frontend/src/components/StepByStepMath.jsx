import React from 'react';
import { Calculator, Activity, PieChart, BarChart2, TrendingUp, ArrowDown } from 'lucide-react';

const StepByStepMath = ({ selectedNode }) => {
    // If no node selected, show placeholder
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

    // Safety check & Defaults
    const safeMath = math || { probs: [], class_counts: [], terms: [] };
    const isLeaf = !children || children.length === 0;
    const criterion = safeMath.criterion || 'gini';
    const isRegression = value && value.length === 1; // Or check task type from props if available

    const fmt = (n) => typeof n === 'number' ? n.toFixed(3) : n;

    // Classification Stats
    const totalSamples = samples || 1;
    const counts = value || [0, 0];
    const p0 = !isRegression && counts.length > 1 ? (counts[0] / totalSamples * 100) : 0;
    const p1 = !isRegression && counts.length > 1 ? (counts[1] / totalSamples * 100) : 0;

    // Helper Component for Bar Chart
    const DistributionBar = ({ p0, p1, label }) => (
        <div className="w-full">
            <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                <span>{label}</span>
                <span>{Math.round(p0)}% / {Math.round(p1)}%</span>
            </div>
            <div className="flex h-3 w-full rounded-full overflow-hidden ring-1 ring-slate-200 bg-slate-100">
                <div style={{ width: `${p0}%` }} className="bg-blue-500 transition-all duration-300" />
                <div style={{ width: `${p1}%` }} className="bg-rose-500 transition-all duration-300" />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isLeaf ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {isLeaf ? <PieChart className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                            {isLeaf ? 'Leaf Prediction' : 'Split Decision Analysis'}
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

                {/* 1. Visual Intuition (Flow) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-4 h-4 text-slate-400" />
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visual Intuition</h4>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 relative">
                        {/* Parent */}
                        <div className="mb-4">
                             {isRegression ? (
                                <div className="text-center font-mono font-bold text-slate-700 text-lg">Avg: {fmt(value[0])}</div>
                             ) : (
                                <DistributionBar p0={p0} p1={p1} label="Current Node (Parent)" />
                             )}
                        </div>

                        {/* Arrows */}
                        {!isLeaf && (
                            <div className="flex justify-center items-center gap-16 mb-2 text-slate-300">
                                <ArrowDown className="w-5 h-5 -rotate-45" />
                                <ArrowDown className="w-5 h-5 rotate-45" />
                            </div>
                        )}

                        {/* Children */}
                        {!isLeaf && children && (
                            <div className="grid grid-cols-2 gap-8">
                                {children.map((child, i) => {
                                    // Calculate child stats
                                    const cTotal = child.samples || 1;
                                    const cCounts = child.value || [0, 0];
                                    const cp0 = !isRegression && cCounts.length > 1 ? (cCounts[0] / cTotal * 100) : 0;
                                    const cp1 = !isRegression && cCounts.length > 1 ? (cCounts[1] / cTotal * 100) : 0;

                                    return (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">
                                                {i === 0 ? 'True Branch (Left)' : 'False Branch (Right)'}
                                            </p>
                                            {isRegression ? (
                                                <div className="text-center font-mono font-bold text-slate-700 text-sm">Avg: {fmt(child.value[0])}</div>
                                            ) : (
                                                <DistributionBar p0={cp0} p1={cp1} label="" />
                                            )}
                                            <div className="mt-2 text-center text-[10px] text-slate-400">
                                                Impurity: {fmt(child.impurity)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {isLeaf && (
                            <div className="text-center text-sm text-slate-500 italic bg-white p-3 rounded border border-slate-100">
                                This is a terminal node. No further splits.
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. Mathematical Detail */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="w-4 h-4 text-slate-400" />
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Mathematical Derivation ({criterion})
                        </h4>
                    </div>

                    <div className="space-y-4">
                         {/* Formula Card */}
                         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="text-center py-3 bg-slate-50/50 rounded-lg mb-4">
                                <span className="font-serif text-xl text-slate-800 italic">
                                    {criterion === 'gini' && <span>I = 1 - &sum; (p<sub>i</sub>)<sup>2</sup></span>}
                                    {criterion === 'entropy' && <span>H = - &sum; p<sub>i</sub> log<sub>2</sub>(p<sub>i</sub>)</span>}
                                    {criterion === 'mse' && <span>MSE = &frac12; &sum; (y - &#x0233;)<sup>2</sup></span>}
                                </span>
                            </div>

                            {!isRegression && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2">
                                        <span>Substituted Values:</span>
                                    </div>

                                    {/* Detailed Substitution */}
                                    <div className="font-mono text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 overflow-x-auto whitespace-nowrap">
                                        <span className="text-slate-400">{criterion === 'gini' ? '1 - ' : '-'} [ </span>
                                        {safeMath.probs && safeMath.probs.map((p, i) => (
                                            <span key={i}>
                                                <span className={i === 0 ? "text-blue-600" : "text-rose-600"}>
                                                    ({fmt(p)})²
                                                </span>
                                                {i < safeMath.probs.length - 1 ? <span className="text-slate-400 mx-1">+</span> : ''}
                                            </span>
                                        ))}
                                        <span className="text-slate-400"> ]</span>
                                    </div>

                                    <div className="flex justify-end items-center gap-2 mt-2">
                                        <span className="text-xs text-slate-400">Result =</span>
                                        <span className="text-xl font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                            {fmt(impurity)}
                                        </span>
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
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {isRegression ? 'Variance Reduction' : 'Information Gain'}
                            </h4>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 relative overflow-hidden shadow-sm">
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex justify-between items-end border-b border-indigo-100 pb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">Gain Calculation</p>
                                        <p className="text-sm font-bold text-slate-700">Parent Impurity - Weighted Child Impurity</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-indigo-600 tracking-tight">{fmt(gain)}</span>
                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">Improvement</p>
                                    </div>
                                </div>

                                <div className="font-mono text-xs text-slate-500 bg-white/80 p-3 rounded border border-indigo-50">
                                    {fmt(impurity)} - [
                                    (
                                    <span className="text-slate-700 font-bold">{children[0]?.samples}</span>
                                    /{samples} &times;
                                    <span className="text-emerald-600 font-bold">{fmt(children[0]?.impurity)}</span>
                                    ) + (
                                    <span className="text-slate-700 font-bold">{children[1]?.samples}</span>
                                    /{samples} &times;
                                    <span className="text-amber-600 font-bold">{fmt(children[1]?.impurity)}</span>
                                    ) ]
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default StepByStepMath;
