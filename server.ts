import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

// Simple in-memory cache
interface CacheData {
  headers: string[];
  rows: string[][];
  sheetName: string;
  fetchedAt: number;
}

let dataCache: CacheData | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

// Robust Google Service Account private key cleaner
function cleanPrivateKey(key: string): string {
  if (!key) return "";

  let cleaned = key.trim();

  // 1. Remove surrounding single or double quotes repeatedly
  while (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // 2. Unescape double-escaped newlines and carriage returns
  cleaned = cleaned.replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/\\r/g, "\r");

  // 3. Remove backslash escapes for quotes if they got double-escaped
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\'/g, "'");

  // 4. Extract base64 body, ignoring any headers, footers, whitespace or formatting
  const base64Body = cleaned
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/, "")
    .replace(/\s+/g, "")
    .trim();

  // 5. Decode to buffer and re-encode to standardized Base64
  const buf = Buffer.from(base64Body, "base64");
  const cleanBase64 = buf.toString("base64");

  // 6. Wrap base64 body at 64 characters per line
  const lines = [];
  for (let i = 0; i < cleanBase64.length; i += 64) {
    lines.push(cleanBase64.substring(i, i + 64));
  }

  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}

// Initialize Google Sheets API client
const rawPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
const privateKey = cleanPrivateKey(rawPrivateKey);
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || "";
const spreadsheetId = process.env.SPREADSHEET_ID || "";
const sheetGid = 2007500225;

let sheetsClient: any = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!privateKey || !clientEmail) {
    throw new Error("Google Service Account credentials are not configured in environment variables (.env).");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

// Helper to get sheet name by GID
async function getSheetNameFromGid(sheets: any, spreadsheetId: string, gid: number): Promise<string> {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = response.data.sheets || [];
  const found = sheetsList.find((s: any) => s.properties?.sheetId === gid);
  if (found && found.properties?.title) {
    return found.properties.title;
  }
  return sheetsList[0]?.properties?.title || "Sheet1";
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasCredentials: !!(privateKey && clientEmail),
    spreadsheetId: spreadsheetId ? `${spreadsheetId.slice(0, 6)}...` : "missing"
  });
});

app.get("/api/data", async (req, res) => {
  const forceRefresh = req.query.refresh === "true";

  // Check cache
  if (!forceRefresh && dataCache && Date.now() - dataCache.fetchedAt < CACHE_TTL_MS) {
    res.json({
      success: true,
      cached: true,
      ...dataCache
    });
    return;
  }

  try {
    const sheets = getSheetsClient();
    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is missing in the configuration.");
    }

    const sheetName = await getSheetNameFromGid(sheets, spreadsheetId, sheetGid);
    
    // Fetch values. Let's get up to 2500 rows and up to column Z (columns A to Z).
    const range = `${sheetName}!A1:Z2500`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    if (values.length === 0) {
      res.json({
        success: true,
        headers: [],
        rows: [],
        sheetName,
        message: "No data found in the spreadsheet."
      });
      return;
    }

    const headers = values[0];
    const rows = values.slice(1);

    // Update cache
    dataCache = {
      headers,
      rows,
      sheetName,
      fetchedAt: Date.now()
    };

    res.json({
      success: true,
      cached: false,
      headers,
      rows,
      sheetName,
      fetchedAt: dataCache.fetchedAt
    });
  } catch (error: any) {
    console.error("Error fetching sheet data:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while fetching spreadsheet data.",
      details: error.response?.data?.error || null,
      suggestions: [
        "Ensure the Google Spreadsheet is shared with the service account client email: ops-api-service@my-project-007-500907.iam.gserviceaccount.com",
        "Verify your SPREADSHEET_ID is correct.",
        "Check that your GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is correct."
      ]
    });
  }
});

// Vite / static asset serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupViteOrStatic();
