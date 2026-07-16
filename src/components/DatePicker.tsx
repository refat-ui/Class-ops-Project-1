import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from "lucide-react";

interface DatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  allDates: string[]; // List of YYYY-MM-DD strings that have data
}

export default function DatePicker({ selectedDate, onChange, allDates }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse selectedDate or fallback to the first operational date or today
  const getInitialMonth = () => {
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    // Fallback to first available operational date, if any
    if (allDates && allDates.length > 0) {
      const firstDate = allDates[0];
      const parts = firstDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialMonth());

  // Reset calendar month view when selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        setCurrentMonth(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
      }
    }
  }, [selectedDate]);

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Format YYYY-MM-DD to "Jul 14, 2026"
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${monthNames[monthIdx]} ${day}, ${year}`;
  };

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, etc.
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      dateString: "",
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= totalDays; i++) {
    const dateString = `${year}-${(month + 1).toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      dateString,
    });
  }

  const gridDays = [...prevMonthDays, ...currentMonthDays];
  const remainingCells = 42 - gridDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    gridDays.push({
      day: i,
      isCurrentMonth: false,
      dateString: "",
    });
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="relative w-full" ref={containerRef} id="calendar-datepicker-root">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left text-xs bg-slate-900/50 border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-slate-900 transition-all flex items-center justify-between cursor-pointer ${
          selectedDate ? "border-indigo-500/50" : "border-slate-800 hover:border-slate-700"
        }`}
        id="datepicker-trigger-btn"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className={`w-4 h-4 shrink-0 ${selectedDate ? "text-indigo-400" : "text-slate-500"}`} />
          <span className={`truncate ${selectedDate ? "text-indigo-200 font-semibold" : "text-slate-400"}`}>
            {formatDisplayDate(selectedDate)}
          </span>
        </div>
        
        {selectedDate ? (
          <span
            onClick={handleClear}
            className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="text-[10px] text-slate-600 uppercase font-bold px-1.5 py-0.5 bg-slate-850 rounded border border-slate-800">
            Open
          </span>
        )}
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 md:left-auto md:right-0 lg:left-0 mt-2 z-50 w-72 bg-slate-900 border border-slate-750 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
          id="datepicker-popover-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-xs font-bold text-slate-100 font-mono">
              {monthNames[month]} {year}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, idx) => (
              <div key={idx} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((cell, idx) => {
              const hasData = cell.isCurrentMonth && allDates.includes(cell.dateString);
              const isSelected = cell.isCurrentMonth && selectedDate === cell.dateString;

              return (
                <div key={idx} className="aspect-square flex items-center justify-center">
                  {cell.isCurrentMonth ? (
                    <button
                      type="button"
                      onClick={() => handleDateSelect(cell.dateString)}
                      className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all relative ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400"
                          : hasData
                          ? "bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 hover:bg-indigo-500/20"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <span>{cell.day}</span>
                      
                      {/* Subtle indicator dot for active operational days */}
                      {hasData && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                      )}
                      {isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-mono select-none">
                      {cell.day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Info/Legende */}
          <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Operational Day
            </span>
            <button
              type="button"
              onClick={() => {
                // Instantly select the first available date with data if clicked
                if (allDates && allDates.length > 0) {
                  handleDateSelect(allDates[0]);
                }
              }}
              className="text-indigo-400 hover:underline font-semibold font-mono"
            >
              Latest Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
