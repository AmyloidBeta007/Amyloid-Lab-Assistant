import React, { useState } from 'react';
import {
  ResearchPaper, HighlightColor, KeyFinding, PaperHighlight,
  PaperImageAttachment, DiscardedItem, DiscardType, DiscardItemCategory
} from '../types';
import { CitationGraphView } from './CitationGraphView';
import { ImageAnnotatorModal } from './ImageAnnotatorModal';
import { DiscardButton } from './DiscardButton';
import { DiscardActionModal } from './DiscardActionModal';
import { searchPapers, SearchScope } from '../utils/bioMath';
import {
  Search, Plus, Highlighter, BookOpen, Trash2,
  BookmarkCheck, ExternalLink, Sparkles, Filter, ChevronRight,
  Camera, Image as ImageIcon, X, Download, Archive, Droplets
} from 'lucide-react';

interface PaperSynthesizerProps {
  papers: ResearchPaper[];
  selectedPaperId: string;
  onSelectPaper: (paperId: string) => void;
  onUpdatePaper: (updated: ResearchPaper) => void;
  onAddPaper: (newPaper: ResearchPaper) => void;
  onDeletePaper: (paperId: string) => void;
  onDiscardItem?: (discardedItem: DiscardedItem) => void;
}

export const PaperSynthesizer: React.FC<PaperSynthesizerProps> = ({
  papers,
  selectedPaperId,
  onSelectPaper,
  onUpdatePaper,
  onAddPaper,
  onDeletePaper,
  onDiscardItem
}) => {
  const [discardModalState, setDiscardModalState] = useState<{
    type: DiscardType;
    category: DiscardItemCategory;
    itemId: string;
    itemTitle: string;
    itemPreviewText?: string;
    itemImageUrl?: string;
    parentTitle?: string;
    onConfirmCallback: () => void;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnnotatorModal, setShowAnnotatorModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<PaperImageAttachment | null>(null);
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor>('yellow');
  const [highlightInputText, setHighlightInputText] = useState('');
  const [highlightInputNote, setHighlightInputNote] = useState('');
  const [newFindingText, setNewFindingText] = useState('');
  const [newFindingImportance, setNewFindingImportance] = useState<'critical' | 'supporting' | 'methodological'>('critical');
  const [newShortcomingText, setNewShortcomingText] = useState('');

  const currentPaper = papers.find(p => p.id === selectedPaperId) || papers[0];

  // Search and Filter logic using decoupled searchPapers
  const searchResults = searchPapers(papers, searchQuery, searchScope);
  const filteredResults = searchResults.filter(({ paper }) => {
    const matchesTag = selectedTag === 'All' || paper.fieldTag === selectedTag;
    const matchesStatus = selectedStatus === 'All' || paper.readingStatus === selectedStatus;
    return matchesTag && matchesStatus;
  });

  const allTags = ['All', ...Array.from(new Set(papers.map(p => p.fieldTag)))];

  // Handlers for active paper
  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!highlightInputText.trim() || !currentPaper) return;
    const newHl: PaperHighlight = {
      id: `hl-${Date.now()}`,
      text: highlightInputText.trim(),
      color: activeHighlightColor,
      note: highlightInputNote.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };
    onUpdatePaper({
      ...currentPaper,
      highlights: [newHl, ...currentPaper.highlights]
    });
    setHighlightInputText('');
    setHighlightInputNote('');
  };

  const handleDeleteHighlight = (id: string) => {
    if (!currentPaper) return;
    onUpdatePaper({
      ...currentPaper,
      highlights: currentPaper.highlights.filter(h => h.id !== id)
    });
  };

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFindingText.trim() || !currentPaper) return;
    const finding: KeyFinding = {
      id: `kf-${Date.now()}`,
      text: newFindingText.trim(),
      importance: newFindingImportance,
      tags: [currentPaper.fieldTag]
    };
    onUpdatePaper({
      ...currentPaper,
      keyFindings: [...currentPaper.keyFindings, finding]
    });
    setNewFindingText('');
  };

  const handleDeleteFinding = (id: string) => {
    if (!currentPaper) return;
    onUpdatePaper({
      ...currentPaper,
      keyFindings: currentPaper.keyFindings.filter(f => f.id !== id)
    });
  };

  const handleAddShortcoming = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcomingText.trim() || !currentPaper) return;
    onUpdatePaper({
      ...currentPaper,
      shortcomings: [...currentPaper.shortcomings, newShortcomingText.trim()]
    });
    setNewShortcomingText('');
  };

  const handleDeleteShortcoming = (idx: number) => {
    if (!currentPaper) return;
    onUpdatePaper({
      ...currentPaper,
      shortcomings: currentPaper.shortcomings.filter((_, i) => i !== idx)
    });
  };

  const handleToggleReference = (refId: string) => {
    if (!currentPaper) return;
    const exists = currentPaper.referencesPaperIds.includes(refId);
    const updatedRefs = exists
      ? currentPaper.referencesPaperIds.filter(id => id !== refId)
      : [...currentPaper.referencesPaperIds, refId];
    onUpdatePaper({
      ...currentPaper,
      referencesPaperIds: updatedRefs
    });
  };

  const handleSaveAttachment = (newAttachment: PaperImageAttachment) => {
    if (!currentPaper) return;
    const currentAttachments = currentPaper.attachedImages || [];
    onUpdatePaper({
      ...currentPaper,
      attachedImages: [newAttachment, ...currentAttachments]
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!currentPaper) return;
    const updated = (currentPaper.attachedImages || []).filter(a => a.id !== attachmentId);
    onUpdatePaper({
      ...currentPaper,
      attachedImages: updated
    });
  };

  const colorStyles: Record<HighlightColor, { bg: string; border: string; text: string; swatch: string }> = {
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', swatch: 'bg-amber-400' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', swatch: 'bg-emerald-400' },
    pink: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', swatch: 'bg-rose-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', swatch: 'bg-purple-400' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', swatch: 'bg-cyan-400' }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Image strip */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white p-6 sm:p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/src/assets/images/rna_seq_flow_visual_1792938142351.jpg"
            alt="Bioinformatics and Literature Flow"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-300 mb-2">
            <span>RESEARCH SYNTHESIZER</span>
            <span aria-hidden="true">·</span>
            <span>MEMORY COCKPIT FOR BIOLOGY MAJORS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Never Forget What You Just Read or Which Paper Refers to Which
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Quickly distill target hypotheses, empirical outcomes, and critical shortcomings. Cross-link citations dynamically into a living reference web.
          </p>
        </div>
      </div>

      {/* Citation Web Graph Explorer */}
      <CitationGraphView
        papers={papers}
        selectedPaperId={currentPaper ? currentPaper.id : ''}
        onSelectPaper={onSelectPaper}
      />

      {/* Main Split Layout: Library List (Left 4 cols) & Synthesizer Dossier (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filterable Paper List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Library ({filteredResults.length})</span>
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paper</span>
            </button>
          </div>

          {/* Search Box with Clear Button */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search by ${searchScope === 'all' ? 'title, author, or key finding...' : searchScope}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5"
                  title="Clear search query"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scope Selector (Title, Authors, Key Findings) */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-md text-[11px] font-medium">
              {(['all', 'title', 'authors', 'findings'] as const).map(sc => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setSearchScope(sc)}
                  className={`flex-1 py-1 rounded transition-colors capitalize ${
                    searchScope === sc ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sc === 'findings' ? 'Findings' : sc}
                </button>
              ))}
            </div>

            {searchQuery && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                <span>
                  Found <strong>{filteredResults.length}</strong> matching "{searchQuery}" in <strong>{searchScope}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchScope('all');
                  }}
                  className="text-teal-700 hover:underline"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Tag Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap text-[11px] font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Paper List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50/60 rounded-lg p-4 border border-dashed border-slate-200">
                <p className="font-semibold text-slate-600">No matching research papers found.</p>
                <p className="mt-1 text-[11px]">Try switching scope to "All" or clearing the query.</p>
              </div>
            ) : (
              filteredResults.map(({ paper, matchedField, snippet }) => {
                const isSelected = currentPaper && currentPaper.id === paper.id;
                const imagesCount = paper.attachedImages?.length || 0;

                return (
                  <button
                    key={paper.id}
                    onClick={() => onSelectPaper(paper.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-medium text-slate-500">
                        {paper.fieldTag}
                      </span>
                      <div className="flex items-center gap-1">
                        {imagesCount > 0 && (
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded flex items-center gap-0.5" title={`${imagesCount} figure annotations attached`}>
                            <Camera className="w-2.5 h-2.5" />
                            <span>{imagesCount}</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          paper.readingStatus === 'Synthesized'
                            ? 'bg-emerald-100 text-emerald-800'
                            : paper.readingStatus === 'Reading'
                            ? 'bg-teal-100 text-teal-800'
                            : paper.readingStatus === 'Must Read'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {paper.readingStatus}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                      {paper.title}
                    </h3>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span>{paper.authors.split(',')[0]} et al.</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{paper.year}</span>
                      <span aria-hidden="true">·</span>
                      <span>{paper.journal}</span>
                    </div>

                    {/* Matched Field Snippet Highlighter */}
                    {matchedField !== 'none' && searchQuery && (
                      <div className="mt-1 p-1.5 rounded bg-teal-100/60 border border-teal-200 text-[10.5px] text-teal-950 font-mono leading-tight">
                        <span className="font-bold uppercase text-[9px] text-teal-800 block">
                          Matched in {matchedField}:
                        </span>
                        <span className="line-clamp-2">
                          "{snippet}"
                        </span>
                      </div>
                    )}

                    {paper.referencesPaperIds.length > 0 && (
                      <div className="text-[10px] text-teal-700 font-mono flex items-center gap-1 mt-0.5">
                        <ChevronRight className="w-3 h-3" />
                        <span>Cites {paper.referencesPaperIds.length} papers in library</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Paper Dossier */}
        {currentPaper ? (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            {/* Header / Citation Details */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-teal-700">{currentPaper.fieldTag}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentPaper.journal} ({currentPaper.year})</span>
                  {currentPaper.doi && (
                    <>
                      <span aria-hidden="true">·</span>
                      <a
                        href={`https://doi.org/${currentPaper.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-teal-600 hover:underline flex items-center gap-0.5"
                      >
                        DOI: {currentPaper.doi}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAnnotatorModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                    title="Photograph gel / figure or upload and draw annotations"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    <span>Capture / Annotate Figure</span>
                  </button>

                  <select
                    value={currentPaper.readingStatus}
                    onChange={e => onUpdatePaper({ ...currentPaper, readingStatus: e.target.value as ResearchPaper['readingStatus'] })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium"
                    aria-label="Reading Status"
                  >
                    <option value="Must Read">Must Read</option>
                    <option value="Reading">Reading</option>
                    <option value="Synthesized">Synthesized</option>
                    <option value="To Re-verify">To Re-verify</option>
                  </select>

                  <DiscardButton
                    onDiscard={type => {
                      setDiscardModalState({
                        type,
                        category: 'paper',
                        itemId: currentPaper.id,
                        itemTitle: currentPaper.title,
                        itemPreviewText: `${currentPaper.authors} (${currentPaper.year}). ${currentPaper.abstract.slice(0, 100)}...`,
                        parentTitle: currentPaper.journal,
                        onConfirmCallback: () => onDeletePaper(currentPaper.id)
                      });
                    }}
                    size="sm"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {currentPaper.title}
              </h2>

              <p className="text-xs text-slate-600 font-medium">
                Authors: {currentPaper.authors}
              </p>
            </div>

            {/* Target & Research Question */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Target / Central Question They Wanted to Answer
                </span>
              </div>
              <textarea
                value={currentPaper.targetQuestion}
                onChange={e => onUpdatePaper({ ...currentPaper, targetQuestion: e.target.value })}
                rows={2}
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded p-2.5 leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="What precise biological hypothesis or pipeline challenge were the authors testing?"
              />
            </div>

            {/* Relevance to My Thesis / Project */}
            <div className="bg-teal-50/40 border border-teal-200/80 rounded-lg p-4">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wide block mb-1">
                Relevance to My Thesis & Lab Experiments
              </span>
              <textarea
                value={currentPaper.relevanceToMyResearch}
                onChange={e => onUpdatePaper({ ...currentPaper, relevanceToMyResearch: e.target.value })}
                rows={2}
                className="w-full text-xs text-slate-800 bg-white border border-teal-200 rounded p-2.5 leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Why does this paper matter to your thesis or bench experiments?"
              />
            </div>

            {/* Attached Lab Figures & Image Annotations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>Attached Lab Figures & Annotations ({(currentPaper.attachedImages || []).length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAnnotatorModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Photo / Add Figure</span>
                </button>
              </div>

              {(currentPaper.attachedImages && currentPaper.attachedImages.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentPaper.attachedImages.map(img => (
                    <div
                      key={img.id}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col group"
                    >
                      <div
                        className="h-36 bg-slate-950 overflow-hidden relative cursor-pointer flex items-center justify-center"
                        onClick={() => setPreviewAttachment(img)}
                        title="Click to view full-size"
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                          {img.annotationsCount ? `${img.annotationsCount} annotations` : 'Annotated'}
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-semibold text-slate-900 text-xs truncate" title={img.title}>
                              {img.title}
                            </h4>
                            <DiscardButton
                              onDiscard={type => {
                                setDiscardModalState({
                                  type,
                                  category: 'figure',
                                  itemId: img.id,
                                  itemTitle: img.title,
                                  itemPreviewText: img.notes,
                                  itemImageUrl: img.imageUrl,
                                  parentTitle: currentPaper.title,
                                  onConfirmCallback: () => handleDeleteAttachment(img.id)
                                });
                              }}
                              size="sm"
                            />
                          </div>
                          {img.notes && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {img.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                          <span>{img.createdAt}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(img)}
                            className="text-teal-700 hover:underline font-sans font-medium"
                          >
                            View Full
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => setShowAnnotatorModal(true)}
                  className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition-all space-y-1.5"
                >
                  <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No figures attached to this paper yet</p>
                  <p className="text-[11px] text-slate-500">
                    Snap a photo of an agarose gel / microscope slide with live camera, or upload an image and draw annotations.
                  </p>
                </div>
              )}
            </div>

            {/* Key Findings List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-teal-600" />
                  <span>Important Findings & Proof Points ({currentPaper.keyFindings.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {currentPaper.keyFindings.map(finding => (
                  <div
                    key={finding.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                          finding.importance === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : finding.importance === 'methodological'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {finding.importance}
                        </span>
                        {finding.tags.map(t => (
                          <span key={t} className="text-[10px] text-slate-500 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-800 leading-relaxed">{finding.text}</p>
                    </div>

                    <DiscardButton
                      onDiscard={type => {
                        setDiscardModalState({
                          type,
                          category: 'finding',
                          itemId: finding.id,
                          itemTitle: finding.text,
                          parentTitle: currentPaper.title,
                          onConfirmCallback: () => handleDeleteFinding(finding.id)
                        });
                      }}
                      size="sm"
                    />
                  </div>
                ))}

                {/* Add finding form */}
                <form onSubmit={handleAddFinding} className="flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="text"
                    value={newFindingText}
                    onChange={e => setNewFindingText(e.target.value)}
                    placeholder="Add an essential finding you must remember..."
                    className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <select
                    value={newFindingImportance}
                    onChange={e => setNewFindingImportance(e.target.value as KeyFinding['importance'])}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    <option value="critical">Critical Finding</option>
                    <option value="methodological">Methodology</option>
                    <option value="supporting">Supporting</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors shrink-0"
                  >
                    Add Finding
                  </button>
                </form>
              </div>
            </div>

            {/* Shortcomings & Limitations (Vital for biology majors) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-rose-600 font-mono text-base">⚠</span>
                <span>Shortcomings, Limitations & Pitfalls ({currentPaper.shortcomings.length})</span>
              </h3>

              <div className="space-y-2">
                {currentPaper.shortcomings.map((shortcoming, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <p className="text-slate-800 leading-relaxed">
                      <span className="font-semibold text-amber-900 mr-1.5">#{idx + 1}</span>
                      {shortcoming}
                    </p>
                    <button
                      onClick={() => handleDeleteShortcoming(idx)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0"
                      aria-label="Delete shortcoming"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <form onSubmit={handleAddShortcoming} className="flex gap-2">
                  <input
                    type="text"
                    value={newShortcomingText}
                    onChange={e => setNewShortcomingText(e.target.value)}
                    placeholder="Log a pitfall or shortcoming (e.g. In vitro only, high off-target, low cell viability)..."
                    className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                  >
                    Add Shortcoming
                  </button>
                </form>
              </div>
            </div>

            {/* Color-Coded Highlighter & Snippet Vault */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Highlighter className="w-4 h-4 text-amber-500" />
                  <span>Color Highlighting & Quote Vault ({currentPaper.highlights.length})</span>
                </h3>

                {/* Color Palette Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  {(['yellow', 'emerald', 'pink', 'purple', 'cyan'] as HighlightColor[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveHighlightColor(c)}
                      className={`w-5 h-5 rounded-full ${colorStyles[c].swatch} transition-transform ${
                        activeHighlightColor === c ? 'scale-125 ring-2 ring-slate-800' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Select ${c} highlight`}
                      aria-label={`Highlight color ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Add Highlight Form */}
              <form onSubmit={handleAddHighlight} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <textarea
                  value={highlightInputText}
                  onChange={e => setHighlightInputText(e.target.value)}
                  placeholder="Paste or type an important quote from the paper..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={highlightInputNote}
                    onChange={e => setHighlightInputNote(e.target.value)}
                    placeholder="Your lab takeaway note (optional)..."
                    className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors shrink-0"
                  >
                    Save Highlight
                  </button>
                </div>
              </form>

              {/* Highlights List */}
              <div className="space-y-2">
                {currentPaper.highlights.map(hl => {
                  const style = colorStyles[hl.color];
                  return (
                    <div
                      key={hl.id}
                      className={`p-3 rounded-lg border ${style.border} ${style.bg} relative group text-xs`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${style.text} leading-relaxed`}>
                          "{hl.text}"
                        </p>
                        <button
                          onClick={() => handleDeleteHighlight(hl.id)}
                          className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shrink-0"
                          aria-label="Delete highlight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {hl.note && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>Note: {hl.note}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bi-Directional Citation Cross-Linker */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Manage Citation Links for this Paper
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Check off any papers in your library that this paper cites or draws direct methods from:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {papers
                  .filter(p => p.id !== currentPaper.id)
                  .map(otherPaper => {
                    const isChecked = currentPaper.referencesPaperIds.includes(otherPaper.id);
                    return (
                      <label
                        key={otherPaper.id}
                        className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-50 border-teal-300 font-semibold' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleReference(otherPaper.id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="truncate">{otherPaper.authors.split(',')[0]} ({otherPaper.year}) - {otherPaper.title}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add Paper Modal */}
      {showAddModal && (
        <AddPaperModal
          onClose={() => setShowAddModal(false)}
          onAdd={newP => {
            onAddPaper(newP);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Image Capture & Annotation Studio Modal */}
      {showAnnotatorModal && currentPaper && (
        <ImageAnnotatorModal
          paperTitle={currentPaper.title}
          onClose={() => setShowAnnotatorModal(false)}
          onSaveAttachment={handleSaveAttachment}
        />
      )}

      {/* Discard Action Modal (Wet vs Dry Discard) */}
      {discardModalState && (
        <DiscardActionModal
          type={discardModalState.type}
          category={discardModalState.category}
          itemId={discardModalState.itemId}
          itemTitle={discardModalState.itemTitle}
          itemPreviewText={discardModalState.itemPreviewText}
          itemImageUrl={discardModalState.itemImageUrl}
          parentTitle={discardModalState.parentTitle}
          onClose={() => setDiscardModalState(null)}
          onConfirmDiscard={discardedItem => {
            if (onDiscardItem) {
              onDiscardItem(discardedItem);
            }
            discardModalState.onConfirmCallback();
            setDiscardModalState(null);
          }}
        />
      )}

      {/* Full-Size Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-4xl w-full p-4 space-y-3 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">{previewAttachment.title}</h3>
                {previewAttachment.notes && (
                  <p className="text-xs text-slate-400">{previewAttachment.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.imageUrl}
                  download={`${previewAttachment.title}.png`}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="text-slate-400 hover:text-white text-xl leading-none px-2"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-auto p-2">
              <img
                src={previewAttachment.imageUrl}
                alt={previewAttachment.title}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AddPaperModalProps {
  onClose: () => void;
  onAdd: (paper: ResearchPaper) => void;
}

const AddPaperModal: React.FC<AddPaperModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState(2026);
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [fieldTag, setFieldTag] = useState<ResearchPaper['fieldTag']>('Molecular Genetics');
  const [targetQuestion, setTargetQuestion] = useState('');
  const [relevance, setRelevance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPaper: ResearchPaper = {
      id: `paper-${Date.now()}`,
      title: title.trim(),
      authors: authors.trim() || 'Primary Lab Authors',
      year: Number(year) || 2026,
      journal: journal.trim() || 'Nature Methods',
      doi: doi.trim() || undefined,
      fieldTag,
      targetQuestion: targetQuestion.trim() || 'Understand mechanisms and evaluate target efficiency.',
      keyFindings: [],
      shortcomings: [],
      relevanceToMyResearch: relevance.trim() || 'Literature background for thesis chapter.',
      readingStatus: 'Reading',
      abstract: 'Abstract under analysis.',
      notesMarkdown: '',
      highlights: [],
      referencesPaperIds: [],
      dateAdded: new Date().toISOString().split('T')[0]
    };

    onAdd(newPaper);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Add Research Paper Dossier</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Paper Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Structure-guided design of synthetic transcription factors..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authors</label>
              <input
                type="text"
                value={authors}
                onChange={e => setAuthors(e.target.value)}
                placeholder="e.g. Smith J, Davis K, et al."
                className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Journal / Conference</label>
              <input
                type="text"
                value={journal}
                onChange={e => setJournal(e.target.value)}
                placeholder="e.g. Nature Biotechnology"
                className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Field Tag</label>
              <select
                value={fieldTag}
                onChange={e => setFieldTag(e.target.value as ResearchPaper['fieldTag'])}
                className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="CRISPR & Gene Editing">CRISPR & Gene Editing</option>
                <option value="Bioinformatics">Bioinformatics</option>
                <option value="RNA Biology">RNA Biology</option>
                <option value="Molecular Genetics">Molecular Genetics</option>
                <option value="Structural Biology">Structural Biology</option>
                <option value="Cell & Developmental">Cell & Developmental</option>
                <option value="Microbiology">Microbiology</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target / Central Question</label>
            <textarea
              value={targetQuestion}
              onChange={e => setTargetQuestion(e.target.value)}
              placeholder="What core problem or hypothesis did they investigate?"
              rows={2}
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Relevance to Your Project</label>
            <input
              type="text"
              value={relevance}
              onChange={e => setRelevance(e.target.value)}
              placeholder="Why this paper matters for your thesis / lab assays..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Create Paper Dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
