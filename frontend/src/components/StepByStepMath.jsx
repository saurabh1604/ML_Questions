import React from 'react';
import { Calculator, ArrowRight, GitCommit, ChevronRight, Hash } from 'lucide-react';

const StepByStepMath = ({ selectedNode }) => {
    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                <Calculator className="w-12 h-12 mb-3 opacity-20" />
                <h3 className="text-lg font-medium text-slate-600">No Node Selected</h3>
                <p className="text-sm">Click on a node in the tree diagram to see the mathematical breakdown of the split.</p>
            </div>
        );
    }

    const {
        impurity, samples, value,
        gain, threshold, feature, children,
        math
    } = selectedNode;

    const isLeaf = !children || children.length === 0;
    const criterion = math?.criterion || 'gini';
    const impurityName = criterion === 'mse' ? 'MSE' : criterion.charAt(0).toUpperCase() + criterion.slice(1);

    // Helper to format numbers
    const fmt = (n) => typeof n === 'number' ? n.toFixed(4) : n;

    // Helper to render formula
    const renderImpurityFormula = () => {
        if (criterion === 'gini') return <span>1 - &Sigma; p<sub>i</sub><sup>2</sup></span>;
        if (criterion === 'entropy') return <span>- &Sigma; p<sub>i</sub> log<sub>2</sub>(p<sub>i</sub>)</span>;
        if (criterion === 'mse') return <span>&frac{1}{N} &Sigma; (y<sub>i</sub> - &#x0233;)<sup>2</sup></span>;
        return <span>Impurity</span>;
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isLeaf ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        <GitCommit className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                            {isLeaf ? 'Leaf Node Analysis' : 'Split Decision Analysis'}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                            Samples: {samples} &bull; Impurity: {fmt(impurity)}
                        </p>
                    </div>
                </div>
                {!isLeaf && (
                    <div className="text-xs bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm font-mono text-slate-600">
                        Feature {feature === 0 ? "X" : "Y"} &le; {fmt(threshold)}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Step 1: Parent Impurity */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">1</div>
                        <h4 className="font-semibold text-slate-700">Node Impurity Calculation</h4>
                    </div>

                    <div className="ml-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Formula ({impurityName})</p>
                                <div className="text-lg font-serif text-slate-800 bg-white p-3 rounded-lg border border-slate-200 shadow-sm inline-block">
                                    I = {renderImpurityFormula()}
                                </div>
                            </div>

                            {math?.probs && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Probabilities (p<sub>i</sub>)</p>
                                    <div className="space-y-1">
                                        {math.probs.map((p, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1 last:border-0">
                                                <span className="text-slate-600">Class {idx}</span>
                                                <span className="font-mono font-medium">{math.class_counts[idx]} / {samples} = {fmt(p)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {math?.terms && (
                                <div className="col-span-1 md:col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Substitution</p>
                                    <div className="font-mono text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                                        I = {criterion === 'gini' ? '1 - ' : '-'} (
                                        {math.terms.map(t => fmt(t)).join(' + ')}
                                        ) = <span className="font-bold text-indigo-600">{fmt(impurity)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Step 2: Information Gain (Only for splits) */}
                {!isLeaf && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">2</div>
                            <h4 className="font-semibold text-slate-700">Information Gain (Split Quality)</h4>
                        </div>

                        <div className="ml-8 space-y-4">
                            {/* Children Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                {children.map((child, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${idx === 0 ? 'bg-blue-400' : 'bg-orange-400'}`}></div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">{idx === 0 ? 'Left' : 'Right'} Child</p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-2xl font-bold text-slate-800">{fmt(child.impurity)}</p>
                                                <p className="text-xs text-slate-500">Impurity</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-medium text-slate-700">{child.samples}</p>
                                                <p className="text-xs text-slate-500">Samples</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs bg-slate-50 p-1 rounded text-slate-600 text-center">
                                            Weight: {child.samples}/{samples} = {fmt(child.samples/samples)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Gain Calculation */}
                            <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2">Gain Formula</p>
                                <div className="font-mono text-sm text-slate-700 mb-3">
                                    Gain = I<sub>parent</sub> - [ (N<sub>L</sub>/N)*I<sub>L</sub> + (N<sub>R</sub>/N)*I<sub>R</sub> ]
                                </div>
                                <div className="font-mono text-sm bg-white p-3 rounded-lg border border-yellow-200 text-slate-600">
                                    Gain = {fmt(impurity)} - [
                                    ({children[0].samples}/{samples} &times; {fmt(children[0].impurity)}) +
                                    ({children[1].samples}/{samples} &times; {fmt(children[1].impurity)})
                                    ]
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <ArrowRight className="text-yellow-400" />
                                    <span className="text-2xl font-bold text-yellow-700">{fmt(gain)}</span>
                                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Impurity Reduction</span>
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
