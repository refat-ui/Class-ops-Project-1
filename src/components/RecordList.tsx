import React, { useState } from "react";
import { ContentRecord } from "../types";
import { 
  Calendar, 
  Clock,
  BookOpen, 
  Bookmark, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Columns,
  Grid,
  Search,
  Check,
  AlertCircle
} from "lucide-react";

interface RecordListProps {
  records: ContentRecord[];
  isLoading: boolean;
  isCompact?: boolean;
}

export default function RecordList({ records, isLoading, isCompact = false }: RecordListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">(isCompact ? "grid" : "grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Pagination calculations
  const totalItems = records.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = records.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Focus columns keys mapping for reference
  const focusColumns = [
    { key: "studio", label: "Studio", description: "Production location" },
    { key: "coordinator", label: "Studio Coordinator Stakeholder", description: "Responsible manager" },
    { key: "lectureSlide", label: "Lecture Slide", description: "Slide content upload" },
    { key: "title", label: "Title", description: "Content/Topic title" },
    { key: "caption", label: "Caption", description: "Visual sub-captions" },
    { key: "sourcePlatform", label: "Source Platform", description: "Hosting platform" }
  ];

  if (isLoading) {
    return (
      <div className="bg-slate-900/30 backdrop-blur-xs rounded-2xl border border-slate-800 p-12 text-center shadow-2xl" id="records-loading-container">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Fetching and processing operations compliance data...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-slate-900/30 backdrop-blur-xs rounded-2xl border border-slate-800 p-12 text-center shadow-2xl" id="records-empty-container">
        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">No matching operations records found</p>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Try clearing your search query or adjusting active filters to view records.
        </p>
      </div>
    );
  }

  return (
    <div className={isCompact ? "space-y-3" : "space-y-4"} id="records-explorer-root">
      {/* List Subheader controls */}
      <div className={`flex ${isCompact ? "flex-row justify-between items-center p-2.5 rounded-xl gap-2" : "flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl"} bg-slate-900/30 backdrop-blur-xs border border-slate-800 shadow-xl`}>
        <div className="flex items-center gap-1.5">
          <span className={`${isCompact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1"} font-semibold text-slate-200 bg-slate-800 rounded-md`} id="records-count-badge">
            {totalItems} Items
          </span>
          <span className={isCompact ? "text-[10px] text-slate-400" : "text-xs text-slate-400"}>
            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid vs Table view toggle */}
          <div className="bg-slate-950/50 p-0.5 rounded-lg flex gap-0.5 border border-slate-800/80">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md transition-all ${isCompact ? "p-1" : "p-1.5"} ${
                viewMode === "grid"
                  ? "bg-indigo-600/90 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Detailed Cards (Bento)"
            >
              <Grid className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-md transition-all ${isCompact ? "p-1" : "p-1.5"} ${
                viewMode === "table"
                  ? "bg-indigo-600/90 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Compact Spreadsheet View"
            >
              <Columns className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
            </button>
          </div>
        </div>
      </div>

      {/* RENDER MODE: GRID CARDS (Two-Panel Concept per Record) */}
      {viewMode === "grid" ? (
        <div className={`grid grid-cols-1 ${isCompact ? "gap-3" : "gap-6"}`} id="records-grid-view">
          {currentRecords.map((record) => (
            <div
              key={record.id}
              className={`group flex flex-col ${isCompact ? "" : "md:flex-row"} bg-slate-900/40 rounded-2xl border transition-all duration-300 hover:shadow-2xl ${
                record.completeness.isComplete
                  ? "border-slate-850 hover:border-slate-700"
                  : "border-rose-900/40 shadow-2xl shadow-rose-950/10 hover:border-rose-800/55"
              }`}
            >
              {/* Left-Side Identification Panel (Prominent context) */}
              <div className={`${isCompact ? "p-3 space-y-2.5" : "md:w-1/3 p-4 sm:p-6 space-y-4 md:rounded-t-none md:rounded-l-2xl border-b md:border-b-0 md:border-r"} bg-slate-950/40 rounded-t-2xl border-slate-850 flex flex-col justify-between`}>
                <div className={isCompact ? "space-y-2.5" : "space-y-4"}>
                  {/* Subject, Course headers */}
                  <div>
                    <div className={`flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wider mb-0.5 ${isCompact ? "text-[9px]" : "text-xs"}`}>
                      <BookOpen className={`${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} text-slate-500`} />
                      Subject & Course
                    </div>
                    <div className={`text-slate-100 font-bold leading-tight ${isCompact ? "text-xs" : "text-sm"}`}>
                      {record.subject}
                    </div>
                    <div className={`text-slate-400 font-medium ${isCompact ? "text-[10px] mt-0.5" : "text-xs mt-0.5"}`}>
                      {record.course}
                    </div>
                  </div>

                  {/* Topic descriptor */}
                  <div>
                    <div className={`flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wider mb-0.5 ${isCompact ? "text-[9px]" : "text-xs"}`}>
                      <Bookmark className={`${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} text-slate-500`} />
                      Topic Descriptor
                    </div>
                    <p className={`text-slate-200 font-medium leading-normal ${isCompact ? "text-xs" : "text-sm leading-relaxed"}`}>
                      {record.topic}
                    </p>
                  </div>
                </div>

                {/* Footer of Left Panel: Timestamp & Overall completion badge */}
                <div className={`border-t border-slate-850 flex items-center justify-between gap-1.5 ${isCompact ? "pt-2 mt-2" : "pt-4"}`}>
                  <div className={`text-slate-400 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 ${isCompact ? "text-[9px]" : "text-xs"}`}>
                    <span className="flex items-center gap-1">
                      <Calendar className={`${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} text-slate-500`} />
                      {record.dateTime}
                    </span>
                    {record.classTime && (
                      <span className="flex items-center gap-1 text-indigo-400 font-bold">
                        <Clock className={`${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} text-indigo-500`} />
                        {record.classTime}
                      </span>
                    )}
                  </div>

                  {/* Quick completeness progress */}
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-slate-400 ${isCompact ? "text-[9px]" : "text-[10px]"}`}>
                      {record.completeness.score}/6 Filled
                    </span>
                    <div className={`${isCompact ? "w-8" : "w-12"} h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          record.completeness.isComplete ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${(record.completeness.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right-Side Operational Focus Columns */}
              <div className={`${isCompact ? "p-3 pt-0" : "md:w-2/3 p-4 sm:p-6"} flex flex-col justify-between`}>
                <div>
                  <div className={`flex items-center justify-between ${isCompact ? "mb-2 pb-1.5 border-t border-slate-850/40 pt-2.5" : "mb-4"}`}>
                    <span className={`font-semibold text-slate-400 uppercase tracking-wider ${isCompact ? "text-[9px]" : "text-xs"}`}>
                      Operational Columns Checklist
                    </span>
                    {record.completeness.isComplete ? (
                      <span className={`inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 ${isCompact ? "text-[9px]" : "text-[11px]"}`}>
                        ✅Ready to Go
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-blink-red ${isCompact ? "text-[9px]" : "text-[11px]"}`}>
                        🔴 Action Needed
                      </span>
                    )}
                  </div>

                  {/* Focus columns status boxes (Conditional Formatting) */}
                  <div className={`grid ${isCompact ? "grid-cols-2 gap-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"}`}>
                    {focusColumns.map((col) => {
                      const value = (record as any)[col.key];
                      const isFilled = record.completeness[col.key as keyof typeof record.completeness];

                      return (
                        <div
                          key={col.key}
                          className={`rounded-xl border flex flex-col justify-between transition-colors ${
                            isCompact ? "p-2 min-h-[50px] bg-slate-950/20" : "p-3 min-h-[90px]"
                          } ${
                            isFilled
                              ? "bg-emerald-500/5 border-emerald-555 hover:bg-emerald-500/10"
                              : "bg-rose-500/5 border-rose-555 hover:bg-rose-500/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className={`font-bold text-slate-400 leading-tight uppercase tracking-wide truncate ${isCompact ? "text-[8px] max-w-[70px]" : "text-[10px]"}`}>
                              {col.label === "Studio Coordinator Stakeholder" ? "Coordinator" : col.label}
                            </span>
                            {isFilled ? (
                              <CheckCircle2 className={`${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} text-emerald-400 shrink-0`} />
                            ) : (
                              <XCircle className={`${isCompact ? "w-3 h-3 animate-pulse" : "w-3.5 h-3.5"} text-rose-400 shrink-0`} />
                            )}
                          </div>

                          <div className="mt-auto">
                            {["title", "lectureSlide", "caption", "sourcePlatform"].includes(col.key) ? (
                              isFilled ? (
                                <p className={`font-semibold text-emerald-400 flex items-center gap-1 font-sans ${isCompact ? "text-[9px]" : "text-xs"}`}>
                                  <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                                  Filled
                                </p>
                              ) : (
                                <p className={`font-medium text-rose-400/90 italic flex items-center gap-1 ${isCompact ? "text-[8px]" : "text-[11px]"}`}>
                                  <span className="w-1 h-1 rounded-full bg-rose-400 inline-block animate-pulse" />
                                  Missing
                                </p>
                              )
                            ) : isFilled ? (
                              <p className={`font-semibold text-slate-100 line-clamp-1 break-all font-sans ${isCompact ? "text-[9px]" : "text-xs line-clamp-2"}`} title={value}>
                                {value}
                              </p>
                            ) : (
                              <p className={`font-medium text-rose-400/90 italic flex items-center gap-1 ${isCompact ? "text-[8px]" : "text-[11px]"}`}>
                                Missing
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Raw Row index viewer */}
                <div className={`border-t border-slate-850 flex items-center justify-between text-slate-500 ${isCompact ? "mt-2 pt-1.5 text-[9px]" : "mt-5 pt-4 text-[11px]"}`}>
                  <span>Row ID: <code className="font-mono text-slate-400">{record.id.split("-")[1]}</code></span>
                  {record.lectureSlide && record.lectureSlide.startsWith("http") && (
                    <a
                      href={record.lectureSlide}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      Slide <ExternalLink className={isCompact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* RENDER MODE: COMPACT SPREADSHEET TABLE (Pinning left side, scrollable focus columns) */
        <div className="bg-slate-900/30 backdrop-blur-xs rounded-2xl border border-slate-800 overflow-hidden shadow-2xl" id="records-table-view">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full min-w-[1100px] text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  {/* Identification Panel Headers (Pinned left-ish style) */}
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[100px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[120px] sm:min-w-[180px]"} font-bold text-slate-300 uppercase tracking-wider bg-slate-900 sticky left-0 z-30 border-r border-slate-800`}>
                    Left ID Panel (Date & Course)
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[100px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[110px] sm:min-w-[180px]"} font-bold text-slate-300 uppercase tracking-wider border-r border-slate-800`}>
                    Subject & Topic
                  </th>
                  {/* Focus columns */}
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[70px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[90px] sm:min-w-[120px]"} font-bold text-slate-300 uppercase tracking-wider`}>
                    Studio
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[80px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[110px] sm:min-w-[150px]"} font-bold text-slate-300 uppercase tracking-wider`}>
                    Coordinator
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[70px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[90px] sm:min-w-[120px]"} font-bold text-slate-300 uppercase tracking-wider`}>
                    Lecture Slide
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[70px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[90px] sm:min-w-[130px]"} font-bold text-slate-300 uppercase tracking-wider`}>
                    Title
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[70px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[90px] sm:min-w-[150px]"} font-bold text-slate-300 uppercase tracking-wider`}>
                    Caption
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[85px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[95px] sm:min-w-[120px]"} font-bold text-slate-300 uppercase tracking-wider`}>
                    Source Platform
                  </th>
                  <th className={`${isCompact ? "px-2 py-1.5 text-[8.5px] min-w-[95px]" : "p-2 sm:p-3.5 text-[10px] sm:text-xs min-w-[100px] sm:min-w-[190px]"} font-bold text-slate-300 uppercase tracking-wider text-center`}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-200">
                {currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/20 transition-colors">
                    {/* ID Column */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[100px]" : "p-1.5 sm:p-3 min-w-[120px] sm:min-w-[180px]"} bg-slate-950 sticky left-0 z-20 border-r border-slate-850`}>
                      <div className={`text-slate-100 font-semibold leading-tight ${isCompact ? "text-[9px]" : "text-[10px] sm:text-xs"}`}>
                        {record.course}
                      </div>
                      <div className={`${isCompact ? "text-[8.5px]" : "text-[9.5px] sm:text-[11px]"} text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-1 sm:gap-x-1.5 gap-y-0.5`}>
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Calendar className={`${isCompact ? "w-2.5 h-2.5" : "w-2.5 h-2.5 sm:w-3 sm:h-3"} text-slate-555`} />
                          {record.dateTime}
                        </span>
                        {record.classTime && (
                          <span className={`flex items-center gap-0.5 text-indigo-400 font-bold shrink-0 ${isCompact ? "text-[9.5px]" : "text-[10.5px] sm:text-[12.5px]"}`}>
                            <Clock className={`${isCompact ? "w-2.5 h-2.5" : "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5"} text-indigo-500`} />
                            {record.classTime}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Subject/Topic */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[100px]" : "p-1.5 sm:p-3 min-w-[110px] sm:min-w-[180px]"} border-r border-slate-850`}>
                      <div className={`text-slate-100 font-bold leading-tight ${isCompact ? "text-[9px]" : "text-[10px] sm:text-xs"}`}>
                        {record.subject}
                      </div>
                      <div className={`text-slate-400 mt-0.5 line-clamp-1 ${isCompact ? "text-[8px]" : "text-[10px] sm:text-xs"}`}>
                        {record.topic}
                      </div>
                    </td>

                    {/* Studio (Focus M) */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[70px]" : "p-1.5 sm:p-3 min-w-[90px] sm:min-w-[140px]"} border-r border-slate-850`}>
                      {record.completeness.studio ? (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs transition-all text-left w-max max-w-full ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <CheckCircle2 className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-emerald-400 shrink-0`} />
                          <span className="line-clamp-1">{record.studio}</span>
                        </button>
                      ) : (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <XCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-rose-400 shrink-0`} />
                          <span>Missing</span>
                        </button>
                      )}
                    </td>

                    {/* Coordinator (Focus N) */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[80px]" : "p-1.5 sm:p-3 min-w-[100px] sm:min-w-[140px]"} border-r border-slate-850`}>
                      {record.completeness.coordinator ? (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs transition-all text-left w-max max-w-full ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <CheckCircle2 className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-emerald-400 shrink-0`} />
                          <span className="line-clamp-1">{record.coordinator}</span>
                        </button>
                      ) : (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <XCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-rose-400 shrink-0`} />
                          <span>Missing</span>
                        </button>
                      )}
                    </td>

                    {/* Slide (Focus P) */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[70px]" : "p-1.5 sm:p-3 min-w-[90px] sm:min-w-[150px]"} border-r border-slate-850`}>
                      {record.completeness.lectureSlide ? (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <CheckCircle2 className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-emerald-400 shrink-0`} />
                          <span>Filled</span>
                        </button>
                      ) : (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <XCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-rose-400 shrink-0`} />
                          <span>Missing</span>
                        </button>
                      )}
                    </td>

                    {/* Title (Focus Q) */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[70px]" : "p-1.5 sm:p-3 min-w-[90px] sm:min-w-[130px]"} border-r border-slate-850`}>
                      {record.completeness.title ? (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <CheckCircle2 className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-emerald-400 shrink-0`} />
                          <span>Filled</span>
                        </button>
                      ) : (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <XCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-rose-400 shrink-0`} />
                          <span>Missing</span>
                        </button>
                      )}
                    </td>

                    {/* Caption (Focus R) */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[70px]" : "p-1.5 sm:p-3 min-w-[90px] sm:min-w-[150px]"} border-r border-slate-850`}>
                      {record.completeness.caption ? (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <CheckCircle2 className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-emerald-400 shrink-0`} />
                          <span>Filled</span>
                        </button>
                      ) : (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <XCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-rose-400 shrink-0`} />
                          <span>Missing</span>
                        </button>
                      )}
                    </td>

                    {/* Platform (Focus T) */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[85px]" : "p-1.5 sm:p-3 min-w-[95px] sm:min-w-[140px]"} border-r border-slate-850`}>
                      {record.completeness.sourcePlatform ? (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <CheckCircle2 className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-emerald-400 shrink-0`} />
                          <span>Filled</span>
                        </button>
                      ) : (
                        <button className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-xs transition-all w-max ${isCompact ? "text-[8px]" : "text-[9.5px] sm:text-[11px]"}`}>
                          <XCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 sm:w-3.5 h-3 sm:h-3.5"} text-rose-400 shrink-0`} />
                          <span>Missing</span>
                        </button>
                      )}
                    </td>

                    {/* Overall Status */}
                    <td className={`${isCompact ? "px-2 py-1 min-w-[95px]" : "p-1.5 sm:p-3 min-w-[100px]"} text-center`}>
                      {record.completeness.isComplete ? (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap ${isCompact ? "text-[8px]" : "text-[10px] sm:text-[11px]"}`}>
                          {isCompact ? "✅ Ready" : "✅ Ready"}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap animate-blink-red ${isCompact ? "text-[8px]" : "text-[10px] sm:text-[11px]"}`}>
                          {isCompact ? "🔴 Incomplete" : "🔴 Not Ready"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className={`flex ${isCompact ? "flex-row justify-between items-center p-2 rounded-lg gap-2" : "flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-xl"} bg-slate-900/30 backdrop-blur-xs border border-slate-800 shadow-xl`} id="pagination-controls">
          <p className={`${isCompact ? "text-[10px]" : "text-xs"} text-slate-400 font-medium`}>
            Page <strong className="font-semibold text-white">{currentPage}</strong> of <strong className="font-semibold text-white">{totalPages}</strong>
          </p>

          <div className={`flex items-center ${isCompact ? "gap-1" : "gap-1.5"}`}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${isCompact ? "p-1" : "p-1.5"}`}
            >
              <ChevronLeft className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </button>

            {/* Render a limited subset of page numbers */}
            {Array.from({ length: Math.min(isCompact ? 3 : 5, totalPages) }, (_, i) => {
              // Sliding window of active page items
              const maxButtons = isCompact ? 3 : 5;
              let pageNum = i + 1;
              if (currentPage > Math.ceil(maxButtons / 2) && totalPages > maxButtons) {
                if (currentPage + Math.floor(maxButtons / 2) <= totalPages) {
                  pageNum = currentPage - Math.floor(maxButtons / 2) + i;
                } else {
                  pageNum = totalPages - maxButtons + 1 + i;
                }
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`font-medium transition-all ${isCompact ? "px-2 py-0.5 text-[10px] rounded-md" : "px-3 py-1 text-xs rounded-lg"} ${
                    currentPage === pageNum
                      ? "bg-indigo-600 text-white shadow-md"
                      : "border border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${isCompact ? "p-1" : "p-1.5"}`}
            >
              <ChevronRight className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
