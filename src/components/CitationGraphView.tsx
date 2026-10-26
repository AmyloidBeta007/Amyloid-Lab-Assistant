import React, { useState } from 'react';
import { ResearchPaper } from '../types';
import { buildCitationNetwork } from '../utils/bioMath';
import { ArrowUpRight, GitFork, Link2, ExternalLink } from 'lucide-react';

interface CitationGraphViewProps {
  papers: ResearchPaper[];
  selectedPaperId: string;
  onSelectPaper: (paperId: string) => void;
}

export const CitationGraphView: React.FC<CitationGraphViewProps> = ({
  papers,
  selectedPaperId,
  onSelectPaper
}) => {
  const [viewMode, setViewMode] = useState<'network' | 'matrix'>('network');
  const { nodes, links, citationMap } = buildCitationNetwork(papers);

  const activePaper = papers.find(p => p.id === selectedPaperId) || papers[0];
  const activePaperCites = (citationMap[activePaper.id]?.cites || []).map(id => papers.find(p => p.id === id)).filter(Boolean) as ResearchPaper[];
  const activePaperCitedBy = (citationMap[activePaper.id]?.citedBy || []).map(id => papers.find(p => p.id === id)).filter(Boolean) as ResearchPaper[];

  // Deterministic SVG coordinates for nodes
  // Arrange in circular layout for clean scientific visualization
  const width = 640;
  const height = 380;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 130;

  const nodePositions = nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...node, x, y };
  });

  const positionMap = new Map(nodePositions.map(np => [np.id, np]));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Interconnected Citation & Reference Web
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track which papers cite which so you never lose the lineage of discoveries and methods.
          </p>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('network')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'network' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Network Graph
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reference Matrix
          </button>
        </div>
      </div>

      {viewMode === 'network' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-center">
          {/* SVG Canvas */}
          <div className="lg:col-span-8 bg-slate-50/60 rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full max-w-[640px] h-auto select-none"
              style={{ minWidth: '480px' }}
            >
              <defs>
                <marker
                  id="arrow-teal"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#0d9488" />
                </marker>
                <marker
                  id="arrow-slate"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#94a3b8" />
                </marker>
              </defs>

              {/* Background guides */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Links */}
              {links.map((link, idx) => {
                const source = positionMap.get(link.source);
                const target = positionMap.get(link.target);
                if (!source || !target) return null;

                const isConnectedToActive = link.source === activePaper.id || link.target === activePaper.id;

                return (
                  <line
                    key={`link-${idx}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isConnectedToActive ? '#0d9488' : '#cbd5e1'}
                    strokeWidth={isConnectedToActive ? 2.5 : 1.2}
                    markerEnd={isConnectedToActive ? 'url(#arrow-teal)' : 'url(#arrow-slate)'}
                    strokeDasharray={isConnectedToActive ? 'none' : '3 3'}
                  />
                );
              })}

              {/* Nodes */}
              {nodePositions.map(node => {
                const isSelected = node.id === activePaper.id;
                const isDirectCiting = citationMap[activePaper.id]?.cites.includes(node.id);
                const isDirectCitedBy = citationMap[activePaper.id]?.citedBy.includes(node.id);

                let fill = '#ffffff';
                let stroke = '#94a3b8';
                if (isSelected) {
                  fill = '#0f766e';
                  stroke = '#115e59';
                } else if (isDirectCiting) {
                  fill = '#ccfbf1';
                  stroke = '#0d9488';
                } else if (isDirectCitedBy) {
                  fill = '#fef3c7';
                  stroke = '#d97706';
                }

                // Shorten author for label
                const shortLabel = node.authors.split(',')[0].trim();

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform duration-150 hover:scale-105"
                    onClick={() => onSelectPaper(node.id)}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 20 : 16}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 3 : 2}
                      className="shadow-sm"
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#0f172a'}
                      fontSize={isSelected ? '10px' : '9px'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      '{node.year.toString().slice(-2)}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + (node.y > centerY ? 24 : -18)}
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="10px"
                      fontWeight="500"
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Connected Context Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Selected Reference Focus
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                {activePaper.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{activePaper.authors.split(',')[0]} et al.</span>
                <span aria-hidden="true">·</span>
                <span>{activePaper.year}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-teal-700">{activePaper.journal}</span>
              </div>
            </div>

            {/* Direct Lineage Lists */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-teal-600" />
                    Cites in your library ({activePaperCites.length})
                  </span>
                </div>
                {activePaperCites.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No foundational papers in library cited by this work.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activePaperCites.map(ref => (
                      <button
                        key={ref.id}
                        onClick={() => onSelectPaper(ref.id)}
                        className="w-full text-left p-2 rounded border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 transition-colors flex items-center justify-between group"
                      >
                        <div className="truncate text-xs">
                          <span className="font-semibold text-slate-900">{ref.authors.split(',')[0]} ({ref.year})</span>
                          <span className="text-slate-600 block truncate">{ref.title}</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-teal-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                    Cited By in your library ({activePaperCitedBy.length})
                  </span>
                </div>
                {activePaperCitedBy.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No downstream papers in your library cite this work yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activePaperCitedBy.map(citing => (
                      <button
                        key={citing.id}
                        onClick={() => onSelectPaper(citing.id)}
                        className="w-full text-left p-2 rounded border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition-colors flex items-center justify-between group"
                      >
                        <div className="truncate text-xs">
                          <span className="font-semibold text-slate-900">{citing.authors.split(',')[0]} ({citing.year})</span>
                          <span className="text-slate-600 block truncate">{citing.title}</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Matrix View */
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                  Source Paper (Row cites Column)
                </th>
                {papers.map(p => (
                  <th key={p.id} className="p-2.5 font-semibold text-slate-700 text-center whitespace-nowrap">
                    {p.authors.split(',')[0]} '{p.year.toString().slice(-2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {papers.map(source => (
                <tr key={source.id} className="hover:bg-slate-50/70">
                  <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200 flex items-center justify-between">
                    <span className="truncate max-w-[240px]">{source.title}</span>
                    <button
                      onClick={() => onSelectPaper(source.id)}
                      className="ml-2 text-teal-600 hover:text-teal-800 shrink-0"
                    >
                      view
                    </button>
                  </td>
                  {papers.map(target => {
                    const isSelf = source.id === target.id;
                    const doesCite = source.referencesPaperIds.includes(target.id);
                    return (
                      <td
                        key={target.id}
                        className={`p-2.5 text-center font-mono ${
                          isSelf
                            ? 'bg-slate-100 text-slate-400'
                            : doesCite
                            ? 'bg-teal-50 text-teal-800 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {isSelf ? '—' : doesCite ? 'CITES' : '·'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
