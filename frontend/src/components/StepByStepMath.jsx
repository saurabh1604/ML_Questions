import React from 'react';
import { Calculator, ArrowRight, GitCommit, ChevronRight, Hash, Activity } from 'lucide-react';

const StepByStepMath = ({ selectedNode }) => {
    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600">Select a Node</h3>
                <p className="text-sm text-slate-400 max-w-xs">Click on any node in the tree diagram above to reveal the detailed mathematical breakdown of that specific split.</p>
            </div>
        );
    }

    const {
        impurity, samples, value,
        gain, threshold, feature, children,
        math
    } = selectedNode;

    // Safety check for math object
    const safeMath = math || { probs: [], class_counts: [], terms: [] };

    const isLeaf = !children || children.length === 0;
    const criterion = safeMath.criterion || 'gini';
    const impurityName = criterion === 'mse' ? 'MSE' : criterion.charAt(0).toUpperCase() + criterion.slice(1);

    const fmt = (n) => typeof n === 'number' ? n.toFixed(4) : n;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-white shrink-0">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">
                            {isLeaf ? 'Leaf Node Prediction' : 'Split Decision Analysis'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" /> {samples} Samples
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Impurity: <span className="text-slate-700 font-mono">{fmt(impurity)}</span></span>
                        </div>
                    </div>
                </div>

                {!isLeaf && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase">Rule</span>
                        <span className="text-sm font-mono font-semibold text-slate-700">
                            {feature === 0 ? "X" : "Y"} &le; {fmt(threshold)}
                        </span>
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 custom-scrollbar">

                {/* Section 1: Impurity Calculation */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">1</div>
                        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Node Impurity Calculation</h4>
                    </div>

                    <div className="ml-9 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Left: Formula */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Formula ({impurityName})</p>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-center min-h-[80px]">
                                    <div className="text-xl font-serif text-slate-800">
                                        {criterion === 'gini' && <span>I = 1 - &sum; p<sub>i</sub><sup>2</sup></span>}
                                        {criterion === 'entropy' && <span>H = - &sum; p<sub>i</sub> log<sub>2</sub>(p<sub>i</sub>)</span>}
                                        {criterion === 'mse' && <span>MSE = &frac12; &sum; (y - &#x0233;)<sup>2</sup></span>}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Probabilities */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Probabilities (p<sub>i</sub>)</p>
                                <div className="space-y-2">
                                    {safeMath.probs && safeMath.probs.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                                <span className="text-slate-600 font-medium">Class {idx}</span>
                                            </div>
                                            <div className="font-mono text-slate-700">
                                                {safeMath.class_counts[idx]} / {samples} = <strong>{fmt(p)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                    {(!safeMath.probs || safeMath.probs.length === 0) && (
                                        <div className="text-sm text-slate-400 italic">Regression node value: {fmt(value[0])}</div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom: Substitution */}
                            {safeMath.terms && (
                                <div className="col-span-1 md:col-span-2 mt-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Substitution</p>
                                    <div className="font-mono text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-4 break-all">
                                        I = {criterion === 'gini' ? '1 - ' : '-'} (
                                        {safeMath.terms.map((t, i) => (
                                            <span key={i}>
                                                {fmt(t)}{i < safeMath.terms.length - 1 ? ' + ' : ''}
                                            </span>
                                        ))}
                                        ) = <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{fmt(impurity)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section 2: Information Gain (Splits only) */}
                {!isLeaf && children && children.length === 2 && (
                    <section>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">2</div>
                            <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Information Gain (Split Quality)</h4>
                        </div>

                        <div className="ml-9 space-y-4">
                            {/* Child Nodes Preview */}
                            <div className="grid grid-cols-2 gap-4">
                                {children.map((child, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                        <div className="ml-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">{idx === 0 ? 'Left Child (True)' : 'Right Child (False)'}</p>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-xl font-bold text-slate-700">{fmt(child.impurity)}</span>
                                                <span className="text-xs text-slate-500">{child.samples} samples</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Gain Math */}
                            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Calculation</p>
                                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">weighted avg</span>
                                </div>

                                <div className="font-mono text-sm text-slate-600 mb-4 bg-white/50 p-3 rounded border border-amber-100">
                                    Gain = <span className="text-indigo-600 font-bold">{fmt(impurity)}</span> - [
                                    (<span className="text-slate-800">{children[0].samples}</span>/{samples} &times; {fmt(children[0].impurity)}) +
                                    (<span className="text-slate-800">{children[1].samples}</span>/{samples} &times; {fmt(children[1].impurity)})
                                    ]
                                </div>

                                <div className="flex items-center gap-3 pt-2 border-t border-amber-100">
                                    <span className="text-sm font-semibold text-amber-800">Result:</span>
                                    <span className="text-2xl font-bold text-amber-600">{fmt(gain)}</span>
                                    <span className="text-xs text-amber-600 ml-auto">Impurity Reduction</span>
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
