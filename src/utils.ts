import { ContentRecord, DashboardStats, ColumnMetric, DayMetric } from "./types";

export function normalizeDate(dateStr: string): string | null {
  if (!dateStr || dateStr === "N/A" || dateStr === "Unknown Date") return null;
  
  const str = dateStr.trim();
  
  // Find a year if present (4 digits)
  let year = 2026; // Default to 2026 based on dataset
  const yearMatch = str.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }
  
  // Find month
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const shortMonths = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];
  
  let monthIdx = -1;
  const lowerStr = str.toLowerCase();
  
  // Check full month names first
  for (let i = 0; i < 12; i++) {
    if (lowerStr.includes(months[i])) {
      monthIdx = i;
      break;
    }
  }
  
  // Check short month names
  if (monthIdx === -1) {
    for (let i = 0; i < 12; i++) {
      const reg = new RegExp(`\\b${shortMonths[i]}\\b`);
      if (reg.test(lowerStr)) {
        monthIdx = i;
        break;
      }
    }
  }
  
  if (monthIdx === -1) {
    for (let i = 0; i < 12; i++) {
      if (lowerStr.includes(shortMonths[i])) {
        monthIdx = i;
        break;
      }
    }
  }
  
  if (monthIdx === -1) return null;
  
  // Find day (1 or 2 digit number that is not the year)
  const cleanStr = str.replace(/\b20\d{2}\b/g, "");
  const numbers = cleanStr.match(/\b(\d{1,2})\b/g);
  let day = -1;
  if (numbers && numbers.length > 0) {
    day = parseInt(numbers[0], 10);
  } else {
    const simpleNumbers = cleanStr.match(/\d+/g);
    if (simpleNumbers && simpleNumbers.length > 0) {
      day = parseInt(simpleNumbers[0], 10);
    }
  }
  
  if (day === -1 || day < 1 || day > 31) return null;
  
  const yyyy = year.toString();
  const mm = (monthIdx + 1).toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${monthNames[monthIdx]} ${day}, ${year}`;
  }
  return dateStr;
}

export function parseSheetData(headers: string[], rows: string[][]): ContentRecord[] {
  if (!headers || headers.length === 0) return [];

  // Helper to search dynamically for a header index
  const findIndex = (searches: string[], defaultIndex: number): number => {
    const idx = headers.findIndex(h => 
      searches.some(s => h.toLowerCase().replace(/[^a-z0-9]/g, "").includes(s.toLowerCase().replace(/[^a-z0-9]/g, "")))
    );
    return idx !== -1 ? idx : defaultIndex;
  };

  // Find left-side identification indices
  const dateTimeIdx = findIndex(["datetime", "dateandtime", "date", "timestamp"], 0);
  const classTimeIdx = findIndex(["scheduledtime", "classtime", "time", "scheduled"], 1);
  const courseIdx = findIndex(["course"], 1);
  const subjectIdx = findIndex(["subject"], 2);
  const topicIdx = findIndex(["topic"], 3);

  // Find focus columns indices: M (12), N (13), P (15), Q (16), R (17), T (19)
  // Let's first search for text matches, and if not found, fall back to indices.
  const studioIdx = findIndex(["studio"], 12);
  const coordinatorIdx = findIndex(["coordinator", "stakeholder", "studiocoordinator"], 13);
  const lectureSlideIdx = findIndex(["lectureslidepptxobpdf", "lectureslidepptx", "lectureslide", "pptx", "obpdf"], 15);
  const titleIdx = findIndex(["title", "topictitle"], 16);
  const captionIdx = findIndex(["caption"], 17);
  const sourcePlatformIdx = findIndex(["sourceplatform", "platform"], 19);

  return rows.map((row, index) => {
    const getValue = (idx: number) => {
      if (idx < 0 || idx >= row.length) return "";
      return (row[idx] || "").trim();
    };

    const dateTime = getValue(dateTimeIdx) || "N/A";
    const classTime = getValue(classTimeIdx) || "";
    const course = getValue(courseIdx) || "N/A";
    const subject = getValue(subjectIdx) || "N/A";
    const topic = getValue(topicIdx) || "N/A";

    const studio = getValue(studioIdx);
    const coordinator = getValue(coordinatorIdx);
    const lectureSlide = getValue(lectureSlideIdx);
    const title = getValue(titleIdx);
    const caption = getValue(captionIdx);
    const sourcePlatform = getValue(sourcePlatformIdx);

    const isStudioFilled = studio.length > 0;
    const isCoordinatorFilled = coordinator.length > 0;
    const isLectureSlideFilled = lectureSlide.length > 0;
    const isTitleFilled = title.length > 0;
    const isCaptionFilled = caption.length > 0;
    const isSourcePlatformFilled = sourcePlatform.length > 0;

    let score = 0;
    if (isStudioFilled) score++;
    if (isCoordinatorFilled) score++;
    if (isLectureSlideFilled) score++;
    if (isTitleFilled) score++;
    if (isCaptionFilled) score++;
    if (isSourcePlatformFilled) score++;

    return {
      id: `record-${index}-${Date.now()}`,
      dateTime,
      classTime,
      course,
      subject,
      topic,
      studio,
      coordinator,
      lectureSlide,
      title,
      caption,
      sourcePlatform,
      rawRow: row,
      completeness: {
        studio: isStudioFilled,
        coordinator: isCoordinatorFilled,
        lectureSlide: isLectureSlideFilled,
        title: isTitleFilled,
        caption: isCaptionFilled,
        sourcePlatform: isSourcePlatformFilled,
        score,
        isComplete: score === 6
      }
    };
  });
}

export function calculateDashboardStats(records: ContentRecord[]): DashboardStats {
  const totalRecords = records.length;
  const completeRecords = records.filter(r => r.completeness.isComplete).length;
  const incompleteRecords = totalRecords - completeRecords;
  const overallCompleteness = totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 0;

  // 1. Column Metrics
  const columnKeys: Array<{ key: keyof ContentRecord["completeness"]; label: string; name: string }> = [
    { key: "studio", label: "Studio", name: "Studio" },
    { key: "coordinator", label: "Studio Coordinator Stakeholder", name: "Studio Coordinator" },
    { key: "lectureSlide", label: "Lecture Slide", name: "Lecture Slide" },
    { key: "title", label: "Title", name: "Title" },
    { key: "caption", label: "Caption", name: "Caption" },
    { key: "sourcePlatform", label: "Source Platform", name: "Source Platform" }
  ];

  const columnMetrics: ColumnMetric[] = columnKeys.map(col => {
    let filledCount = 0;
    records.forEach(r => {
      if ((r.completeness as any)[col.key]) {
        filledCount++;
      }
    });

    return {
      name: col.name,
      label: col.label,
      filledCount,
      emptyCount: totalRecords - filledCount,
      totalCount: totalRecords,
      percentage: totalRecords > 0 ? Math.round((filledCount / totalRecords) * 100) : 0
    };
  });

  // 2. Day-wise Metrics (operational oversight requirement)
  // Group by normalized date (YYYY-MM-DD) for proper chronological sorting
  const recordsByDay: { [date: string]: ContentRecord[] } = {};
  records.forEach(r => {
    const norm = normalizeDate(r.dateTime);
    const dateStr = norm || "Unknown Date";
    if (!recordsByDay[dateStr]) {
      recordsByDay[dateStr] = [];
    }
    recordsByDay[dateStr].push(r);
  });

  const dayMetrics: DayMetric[] = Object.keys(recordsByDay)
    .filter(d => d !== "Unknown Date")
    .sort((a, b) => a.localeCompare(b)) // Perfect chronological sort since keys are YYYY-MM-DD
    .map(date => {
      const dayRecords = recordsByDay[date];
      const total = dayRecords.length;
      const complete = dayRecords.filter(r => r.completeness.isComplete).length;
      const incomplete = total - complete;
      const completenessRate = total > 0 ? Math.round((complete / total) * 100) : 0;

      return {
        date: formatDisplayDate(date), // Beautifully formatted label e.g. "Jul 14, 2026"
        total,
        complete,
        incomplete,
        completenessRate
      };
    });

  // 3. Unique Filter Values in clean YYYY-MM-DD format
  const allDates = Array.from(new Set(records.map(r => {
    return normalizeDate(r.dateTime) || "";
  }).filter(d => d.length > 0))).sort();

  const allCourses = Array.from(new Set(records.map(r => r.course).filter(c => c && c !== "N/A"))).sort();
  const allSubjects = Array.from(new Set(records.map(r => r.subject).filter(s => s && s !== "N/A"))).sort();
  const allCoordinators = Array.from(new Set(records.map(r => r.coordinator).filter(c => c && c.length > 0))).sort();

  return {
    totalRecords,
    completeRecords,
    incompleteRecords,
    overallCompleteness,
    columnMetrics,
    dayMetrics,
    allDates,
    allCourses,
    allSubjects,
    allCoordinators
  };
}
