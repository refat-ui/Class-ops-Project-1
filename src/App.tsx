import React, { useState, useEffect, useMemo } from "react";
import { 
  RefreshCw, 
  AlertCircle, 
  Search, 
  Database, 
  Filter, 
  CheckCircle,
  Clock,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Monitor,
  Smartphone,
  Wifi,
  Signal,
  Battery,
  LayoutDashboard,
  BarChart3,
  SlidersHorizontal,
  ListChecks
} from "lucide-react";
import { parseSheetData, calculateDashboardStats, normalizeDate } from "./utils";
import { ContentRecord, DashboardStats } from "./types";
import StatsOverview from "./components/StatsOverview";
import MetricCharts from "./components/MetricCharts";
import RecordList from "./components/RecordList";
import DatePicker from "./components/DatePicker";

export default function App() {
  const [rawData, setRawData] = useState<{ headers: string[]; rows: string[][]; sheetName: string } | null>(null);
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestions, setErrorSuggestions] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Layout mode & Native mobile tab states
  const [layoutMode, setLayoutMode] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"summary" | "charts" | "filters" | "records">("summary");
  const [isUserOverride, setIsUserOverride] = useState(false);

  // Auto-detect screen width to default to mobile view on small screens
  useEffect(() => {
    const handleResize = () => {
      if (!isUserOverride) {
        if (window.innerWidth < 1024) {
          setLayoutMode("mobile");
        } else {
          setLayoutMode("desktop");
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isUserOverride]);

  const toggleLayoutMode = (mode: "desktop" | "mobile") => {
    setLayoutMode(mode);
    setIsUserOverride(true);
  };

  // Logo States (Uploadable and Customisable)
  const [brandLogo, setBrandLogo] = useState<string>(() => {
    return localStorage.getItem("brand_logo") || "https://upload.wikimedia.org/wikipedia/commons/3/3a/10_Minute_School_Logo.png";
  });
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState("");

  // Filter States
  const [bdTime, setBdTime] = useState<string>("");

  useEffect(() => {
    const updateBdClock = () => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        setBdTime(formatter.format(new Date()));
      } catch (e) {
        setBdTime(new Date().toLocaleTimeString());
      }
    };

    updateBdClock();
    const interval = setInterval(updateBdClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCoordinator, setSelectedCoordinator] = useState("");
  const [complianceFilter, setComplianceFilter] = useState<"all" | "complete" | "incomplete">("all");

  // Fetch data function
  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = `/api/data${forceRefresh ? "?refresh=true" : ""}`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.success) {
        setRawData({
          headers: json.headers,
          rows: json.rows,
          sheetName: json.sheetName
        });
        const parsed = parseSheetData(json.headers, json.rows);
        setRecords(parsed);
        setLastSynced(new Date(json.fetchedAt || Date.now()));
      } else {
        setError(json.error || "Failed to retrieve Google Sheet data.");
        setErrorSuggestions(json.suggestions || []);
      }
    } catch (err: any) {
      setError(err.message || "A network error occurred while connecting to the backend service.");
      setErrorSuggestions([
        "Verify that your dev server is running and accessible.",
        "Check that you have correct SPREADSHEET_ID and service account credentials configured in your .env file."
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats on overall parsed records
  const overallStats = useMemo(() => {
    return calculateDashboardStats(records);
  }, [records]);

  // Handle Multi-Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // 1. Search Query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          record.title.toLowerCase().includes(query) ||
          record.topic.toLowerCase().includes(query) ||
          record.course.toLowerCase().includes(query) ||
          record.subject.toLowerCase().includes(query) ||
          record.coordinator.toLowerCase().includes(query) ||
          record.studio.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // 2. Date Filter
      if (selectedDate) {
        const itemDateNormalized = normalizeDate(record.dateTime);
        if (itemDateNormalized !== selectedDate) return false;
      }

      // 3. Course Filter
      if (selectedCourse && record.course !== selectedCourse) return false;

      // 4. Subject Filter
      if (selectedSubject && record.subject !== selectedSubject) return false;

      // 5. Coordinator Filter
      if (selectedCoordinator && record.coordinator !== selectedCoordinator) return false;

      // 6. Compliance Filter
      if (complianceFilter === "complete" && !record.completeness.isComplete) return false;
      if (complianceFilter === "incomplete" && record.completeness.isComplete) return false;

      return true;
    });
  }, [records, searchQuery, selectedDate, selectedCourse, selectedSubject, selectedCoordinator, complianceFilter]);

  // Filtered stats for local metrics display
  const filteredStats = useMemo(() => {
    return calculateDashboardStats(filteredRecords);
  }, [filteredRecords]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDate("");
    setSelectedCourse("");
    setSelectedSubject("");
    setSelectedCoordinator("");
    setComplianceFilter("all");
  };

  // Download filtered records as CSV
  const handleDownloadCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "ID",
      "Date Time",
      "Course",
      "Subject",
      "Topic",
      "Studio",
      "Coordinator",
      "Lecture Slide",
      "Title",
      "Caption",
      "Source Platform",
      "Completeness Score",
      "Status"
    ];

    const rows = filteredRecords.map(record => [
      record.id,
      record.dateTime,
      record.course,
      record.subject,
      record.topic,
      record.studio,
      record.coordinator,
      record.lectureSlide,
      record.title,
      record.caption,
      record.sourcePlatform,
      `${record.completeness.score}/6`,
      record.completeness.isComplete ? "Fully Compliant" : "Incomplete"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row
          .map(val => {
            const strVal = val ? String(val) : "";
            const escaped = strVal.replace(/"/g, '""');
            if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n") || escaped.includes("\r")) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateSuffix = selectedDate ? `_${selectedDate}` : "";
    const filename = `operational_compliance_report${dateSuffix}.csv`;
    link.setAttribute("download", filename);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBrandLogo(base64String);
        localStorage.setItem("brand_logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (logoInputUrl.trim()) {
      setBrandLogo(logoInputUrl.trim());
      localStorage.setItem("brand_logo", logoInputUrl.trim());
      setShowLogoModal(false);
    }
  };

  const handleLogoReset = () => {
    const defaultLogo = "https://upload.wikimedia.org/wikipedia/commons/3/3a/10_Minute_School_Logo.png";
    setBrandLogo(defaultLogo);
    localStorage.removeItem("brand_logo");
    setLogoInputUrl("");
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased" id="dashboard-app-root">
      
      {/* 1. Header Banner */}
      <header className="bg-black text-white border-b border-slate-800 sticky top-0 z-50 shadow-2xl" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogoModal(true)}
              className="group flex items-center justify-center shrink-0 cursor-pointer relative hover:scale-105 active:scale-95 transition-all duration-200 p-1 rounded-xl"
              title="Click to change or replace brand logo"
              id="brand-logo-container"
            >
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt="10MS Brand Logo"
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-12 px-2">
                  <span className="text-sm font-black text-indigo-400 tracking-wider leading-none">10MS</span>
                  <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">OPS</span>
                </div>
              )}
              {/* Subtle dynamic overlay badge on hover */}
              <div className="absolute inset-x-0 -bottom-1 bg-indigo-600 text-[8px] font-bold text-white uppercase tracking-wider scale-0 group-hover:scale-100 transition-transform duration-150 rounded-md py-0.5 px-1 shadow-md">
                Change
              </div>
            </button>

            <div>
              <h1 className="text-md sm:text-lg font-bold tracking-tight text-white">
                Content Operations
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] sm:text-xs text-indigo-400 font-bold italic">
                  Live Class Monitoring Dashboard
                </p>
                <button
                  className="inline-flex items-center gap-1 bg-rose-950/30 border border-rose-500/30 px-1.5 py-0.5 rounded-full hover:bg-rose-900/30 transition-all duration-150 active:scale-95 text-[8px] sm:text-[9px] font-black text-rose-400 tracking-wider shadow-inner cursor-pointer"
                  id="live-indicator-button"
                  title="Dashboard Live Stream Monitoring Active"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                  </span>
                  <span>LIVE</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* View Mode Toggle Segmented Control (Interactive Portal) */}
            <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner" id="layout-view-toggle">
              <button
                onClick={() => toggleLayoutMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  layoutMode === "desktop"
                    ? "bg-indigo-600 text-white shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-slate-850/60"
                }`}
                title="Desktop View Mode"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Portal</span>
              </button>
              <button
                onClick={() => toggleLayoutMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  layoutMode === "mobile"
                    ? "bg-indigo-600 text-white shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-slate-850/60"
                }`}
                title="Simulated Mobile App View Mode"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile App</span>
              </button>
            </div>

            {/* Real-time Bangladesh Clock */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-indigo-300 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner w-full sm:w-auto" id="realtime-bd-clock">
              <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="font-semibold">Time: {bdTime || "..."}</span>
            </div>

            {lastSynced && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Synced: {lastSynced.toLocaleTimeString()}</span>
              </div>
            )}

            <button
              onClick={() => fetchData(true)}
              disabled={isLoading || isRefreshing}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold shadow-md transition-all duration-200 active:scale-95 w-full sm:w-auto cursor-pointer"
              id="sync-now-button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Live Sheet"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Stage */}
      {layoutMode === "desktop" ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200" id="dashboard-main-stage">
          
          {/* Error Notification Block */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-start" id="error-banner">
              <div className="p-3 bg-rose-950/50 rounded-xl border border-rose-800/40 text-rose-400 shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-rose-200">Spreadsheet Integration Inoperable</h3>
                <p className="text-xs text-rose-300/80 leading-relaxed max-w-3xl">
                  {error}
                </p>
                {errorSuggestions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      Actionable Troubleshooting Checklist:
                    </span>
                    <ul className="list-decimal list-inside text-xs text-rose-300/70 space-y-1 ml-1">
                      {errorSuggestions.map((s, idx) => (
                        <li key={idx} className="font-medium">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Dashboard KPI metrics row */}
          {!isLoading && !error && <StatsOverview stats={overallStats} />}

          {/* 4. Charts visualizations row */}
          {!isLoading && !error && <MetricCharts stats={overallStats} />}

          {/* 5. Filter Matrix & Record list (The operational search center) */}
          {!error && (
            <div className="space-y-6">
              <div className="bg-slate-900/30 backdrop-blur-xs rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 relative z-30" id="filters-card">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-850">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-400" />
                      Multi-Dimensional Filter & Search Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Refine records by day, course, subject, coordinator or completeness state
                    </p>
                  </div>
                  
                  {/* Reset button if any filter is active */}
                  {(searchQuery || selectedDate || selectedCourse || selectedSubject || selectedCoordinator || complianceFilter !== "all") && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 bg-rose-950/30 hover:bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-900/40 transition-all duration-150"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear Active Filters
                    </button>
                  )}
                </div>

                {/* Filters inputs grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  
                  {/* Search Text box */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Title, topic, course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-slate-900/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Day-wise Date Selector (Calendar Popup) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Date</label>
                    <DatePicker
                      selectedDate={selectedDate}
                      onChange={setSelectedDate}
                      allDates={overallStats.allDates}
                    />
                  </div>

                  {/* Course Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Channel</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full text-xs bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-slate-900"
                    >
                      <option value="" className="bg-slate-900">All Courses</option>
                      {overallStats.allCourses.map((c, idx) => (
                        <option key={idx} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Area</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full text-xs bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-slate-900"
                    >
                      <option value="" className="bg-slate-900">All Subjects</option>
                      {overallStats.allSubjects.map((s, idx) => (
                        <option key={idx} value={s} className="bg-slate-900">{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Coordinator Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordinator Stakeholder</label>
                    <select
                      value={selectedCoordinator}
                      onChange={(e) => setSelectedCoordinator(e.target.value)}
                      className="w-full text-xs bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-slate-900"
                    >
                      <option value="" className="bg-slate-900">All Coordinators</option>
                      {overallStats.allCoordinators.map((c, idx) => (
                        <option key={idx} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Status Filters Pill selector */}
                <div className="pt-4 flex flex-col lg:flex-row items-center lg:justify-between gap-4 border-t border-slate-850">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 w-full lg:w-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
                    
                    <button
                      onClick={() => setComplianceFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        complianceFilter === "all"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-slate-900/40 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      All ({overallStats.totalRecords})
                    </button>

                    <button
                      onClick={() => setComplianceFilter("complete")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        complianceFilter === "complete"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-slate-900/40 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Compliant ({overallStats.completeRecords})
                    </button>

                    <button
                      onClick={() => setComplianceFilter("incomplete")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        complianceFilter === "incomplete"
                          ? "bg-rose-600 text-white shadow-md"
                          : "bg-slate-900/40 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Incomplete ({overallStats.incompleteRecords})
                    </button>
                  </div>

                  {/* Local Filter Results Count & Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
                    <div className="text-[11px] text-slate-400 font-medium font-mono text-center sm:text-right">
                      Active Filter Output: <strong className="font-semibold text-indigo-400">{filteredRecords.length}</strong> / {records.length} records ({records.length > 0 ? Math.round((filteredRecords.length / records.length) * 100) : 0}%)
                    </div>
                    
                    <button
                      onClick={handleDownloadCSV}
                      disabled={filteredRecords.length === 0}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white shadow-xs transition-all duration-150 border border-emerald-500/10 cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
                      id="download-csv-btn"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. List component representing the results */}
              <RecordList records={filteredRecords} isLoading={isLoading} />
            </div>
          )}

        </main>
      ) : (
        /* Mobile App Mode Portal */
        <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center py-6 bg-slate-950 px-4" id="mobile-app-portal">
          
          {/* Helper Desktop Tips for Simulated Mobile View */}
          <div className="hidden lg:flex flex-col items-center mb-5 text-center max-w-md space-y-1.5 bg-slate-900/40 border border-slate-850 px-5 py-3 rounded-2xl shadow-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold rounded-full">
              📱 Interactive Mobile App Sandbox Active
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This simulated smartphone viewport displays the custom native-feel mobile app interface. Resize your browser width to trigger a full-screen experience!
            </p>
          </div>

          {/* Smartphone Shell on Desktop, Native Screen on Physical Mobile */}
          <div className="lg:max-w-[400px] lg:w-full lg:h-[810px] lg:my-2 lg:rounded-[55px] lg:border-[12px] lg:border-slate-800 lg:shadow-[0_0_80px_rgba(0,0,0,0.85)] lg:overflow-hidden bg-slate-950 flex flex-col w-full min-h-screen lg:min-h-0 relative border-slate-800" id="mobile-device-frame">
            
            {/* Simulated iPhone Speaker & Camera Notch - ONLY visible on Large/Desktop screens */}
            <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50">
              <div className="w-12 h-1 bg-slate-900 rounded-full mx-auto mt-1" />
            </div>

            {/* Simulated Status Bar - ONLY visible on Large/Desktop screens */}
            <div className="hidden lg:flex items-center justify-between px-6 pt-7 pb-2.5 bg-black text-slate-400 text-[11px] font-semibold tracking-tight shrink-0 select-none border-b border-slate-900">
              <span className="text-white font-bold">{bdTime ? bdTime.split(" ")[0] : "10:48"}</span>
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-slate-300" />
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Mobile Native Header */}
            <div className="px-4 py-3.5 bg-slate-900 border-b border-slate-850 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-slate-950 px-2 py-1 rounded-lg text-xs font-black text-indigo-400 tracking-wider">10MS</div>
                )}
                <div>
                  <div className="flex items-center gap-1">
                    <h2 className="text-[11px] font-bold text-white leading-tight">Content Ops App</h2>
                    <span className="text-[8px] font-mono text-slate-500 font-bold tracking-tight">v1.2.4</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                    <span className="text-[8px] text-rose-400 font-black tracking-wider uppercase leading-none">LIVE FEED</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Sync Trigger button */}
                <button
                  onClick={() => fetchData(true)}
                  disabled={isLoading || isRefreshing}
                  className="p-1.5 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-800 text-indigo-400 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                  title="Force Reload Google Sheet Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Port */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800" id="mobile-viewport">
              {isLoading && !isRefreshing ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold font-mono">Loading core feeds...</p>
                </div>
              ) : error ? (
                <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-rose-300 leading-normal">{error}</p>
                </div>
              ) : (
                <>
                  {/* KPI Overview Tab */}
                  {activeTab === "summary" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Dashboard Summary</span>
                        <span className="text-[9px] text-slate-500 font-mono">Updated: {lastSynced?.toLocaleTimeString() || "..."}</span>
                      </div>
                      <StatsOverview stats={overallStats} isCompact={true} />
                      <div className="bg-slate-900/30 border border-slate-850/60 p-3 rounded-2xl space-y-1.5">
                        <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                          Completeness Threshold
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          To make a live class operational, all 6 mandatory meta columns must be fully populated. Incomplete records will trigger action items.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Charts Tab */}
                  {activeTab === "charts" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block pb-1">Operational Metrics</span>
                      <MetricCharts stats={overallStats} isCompact={true} />
                    </div>
                  )}

                  {/* Filter Hub Tab */}
                  {activeTab === "filters" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-850 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-indigo-400" />
                            Search Filter Hub
                          </h3>
                          <button 
                            onClick={resetFilters}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          >
                            Reset All
                          </button>
                        </div>

                        <div className="space-y-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                              <input
                                type="text"
                                placeholder="Title, topic, course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operational Date</label>
                            <DatePicker
                              selectedDate={selectedDate}
                              onChange={setSelectedDate}
                              allDates={overallStats.allDates}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Course Channel</label>
                            <select
                              value={selectedCourse}
                              onChange={(e) => setSelectedCourse(e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                            >
                              <option value="">All Courses</option>
                              {overallStats.allCourses.map((c, idx) => (
                                <option key={idx} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subject Area</label>
                            <select
                              value={selectedSubject}
                              onChange={(e) => setSelectedSubject(e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                            >
                              <option value="">All Subjects</option>
                              {overallStats.allSubjects.map((s, idx) => (
                                <option key={idx} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Coordinator Stakeholder</label>
                            <select
                              value={selectedCoordinator}
                              onChange={(e) => setSelectedCoordinator(e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                            >
                              <option value="">All Coordinators</option>
                              {overallStats.allCoordinators.map((c, idx) => (
                                <option key={idx} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Compliance State:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => setComplianceFilter("all")}
                              className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                                complianceFilter === "all"
                                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                              }`}
                            >
                              All ({overallStats.totalRecords})
                            </button>
                            <button
                              onClick={() => setComplianceFilter("complete")}
                              className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                                complianceFilter === "complete"
                                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                              }`}
                            >
                              Ready ({overallStats.completeRecords})
                            </button>
                            <button
                              onClick={() => setComplianceFilter("incomplete")}
                              className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                                complianceFilter === "incomplete"
                                  ? "bg-rose-600 text-white border-rose-500 shadow-md"
                                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                              }`}
                            >
                              Pending ({overallStats.incompleteRecords})
                            </button>
                          </div>
                        </div>

                        {/* Apply Trigger */}
                        <button
                          onClick={() => setActiveTab("records")}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Apply & View {filteredRecords.length} Items</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Records Feed Tab */}
                  {activeTab === "records" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-850">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search in stream..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          onClick={handleDownloadCSV}
                          disabled={filteredRecords.length === 0}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-emerald-500 text-white shadow-md cursor-pointer shrink-0"
                          title="Export CSV"
                        >
                          CSV
                        </button>
                      </div>

                      <RecordList records={filteredRecords} isLoading={isLoading} isCompact={true} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Native Navigation Tab Bar */}
            <div className="bg-slate-900 border-t border-slate-850 px-4 py-2 flex items-center justify-around shrink-0 select-none pb-6 lg:pb-3.5 z-10">
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${
                  activeTab === "summary" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">KPIs</span>
              </button>

              <button
                onClick={() => setActiveTab("charts")}
                className={`flex flex-col items-center gap-1 py-1 transition-all cursor-pointer ${
                  activeTab === "charts" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">Trends</span>
              </button>

              <button
                onClick={() => setActiveTab("filters")}
                className={`flex flex-col items-center gap-1 py-1 transition-all relative cursor-pointer ${
                  activeTab === "filters" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">Filters</span>
                {(selectedDate || selectedCourse || selectedSubject || selectedCoordinator || complianceFilter !== "all" || searchQuery) && (
                  <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("records")}
                className={`flex flex-col items-center gap-1 py-1 transition-all relative cursor-pointer ${
                  activeTab === "records" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ListChecks className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">Feed</span>
                <span className="absolute -top-1 -right-2 px-1.5 py-0.5 text-[8px] font-black text-white bg-indigo-600 rounded-full scale-90 border border-slate-900 shadow-sm">
                  {filteredRecords.length}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Humble footer showing workspace metadata */}
      <footer className="bg-slate-950 border-t border-slate-900/80 py-8 mt-12 text-center" id="main-footer">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
          <Database className="w-4 h-4 text-slate-600" />
          <span>Connected Google Sheet: <strong className="font-semibold text-slate-400 font-mono">13H2FFJ8WzKbis-Ud9SXlea9NNTM6exnOaguML8MVZI4</strong></span>
        </p>
        <p className="text-[10px] text-slate-600 mt-1.5 uppercase tracking-widest font-semibold">
          Operational Dashboard • Provided Service Account Access
        </p>
      </footer>

      {/* Brand Logo Settings Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs" id="logo-settings-modal">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Brand Logo Configuration</h3>
              </div>
              <button
                onClick={() => setShowLogoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 space-y-5">
              
              {/* Info text & External Links */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Provide a web image URL or upload directly to display your company's brand logo next to the dashboard title.
                </p>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Public Image Hosts:</span>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://postimages.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/20 transition-all"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Postimages.org
                    </a>
                    <a
                      href="https://imgur.com/upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-all"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Imgur.com
                    </a>
                    <a
                      href="https://pasteboard.co"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 rounded-lg border border-pink-500/20 transition-all"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Pasteboard
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
                    *Upload on one of these sites, then copy the <strong>Direct Link</strong> (ending with .png, .jpg, or .webp) and paste it below.
                  </p>
                </div>
              </div>

              {/* Live Preview */}
              <div className="flex items-center gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="w-14 h-14 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {brandLogo ? (
                    <img
                      src={brandLogo}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">None</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Active Logo Preview</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {brandLogo ? "Custom logo active" : "Default system letters badge active"}
                  </p>
                </div>
              </div>

              {/* Option 1: File Upload */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Option 1: Direct Local Upload</span>
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl cursor-pointer hover:bg-slate-850/50 transition-all group">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors mb-1.5" />
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white">Choose Image File</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WEBP (Max 2MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option 2: Image URL */}
              <form onSubmit={handleLogoUrlSubmit} className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Option 2: Public Logo URL</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-hidden font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-md shrink-0 transition-all active:scale-95 cursor-pointer"
                  >
                    Apply URL
                  </button>
                </div>
              </form>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={handleLogoReset}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Reset to Default
              </button>
              
              <button
                type="button"
                onClick={() => setShowLogoModal(false)}
                className="bg-slate-800 hover:bg-slate-750 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
