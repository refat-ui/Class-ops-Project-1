import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

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

// Robust Google Service Account private key normalizer
function normalizePrivateKey(keyStr: string): string {
  if (!keyStr) return "";

  try {
    let cleaned = keyStr.trim();
    while (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    cleaned = cleaned.replace(/\\n/g, "\n");
    cleaned = cleaned.replace(/\\r/g, "\r");
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\'/g, "'");

    // Try standard parsing
    try {
      const pkey = crypto.createPrivateKey(cleaned);
      return pkey.export({ type: "pkcs8", format: "pem" }) as string;
    } catch (e) {
      // Proceed to base64 DER fallback if standard parsing fails
    }

    let base64Body = cleaned
      .replace(/-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----/, "")
      .replace(/-----END (?:[A-Z ]+)?PRIVATE KEY-----/, "")
      .replace(/\s+/g, "")
      .replace(/\\n/g, "")
      .replace(/\\r/g, "");

    const derBuffer = Buffer.from(base64Body, "base64");
    const pkey = crypto.createPrivateKey({
      key: derBuffer,
      format: "der",
      type: "pkcs8"
    });
    return pkey.export({ type: "pkcs8", format: "pem" }) as string;
  } catch (err) {
    console.error("Failed to normalize private key:", err);
    return keyStr;
  }
}

// Initialize Google Sheets API client
let rawPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";

// Fallback if rawPrivateKey doesn't look like a real PEM key (e.g. doesn't contain "-----BEGIN")
if (!rawPrivateKey.includes("-----BEGIN")) {
  try {
    const envExamplePath = path.join(process.cwd(), ".env.example");
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, "utf-8");
      // Find the key in .env.example
      const match = content.match(/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY\s*=\s*["']([^"']+)["']/);
      if (match && match[1]) {
        rawPrivateKey = match[1];
      }
    }
  } catch (err) {
    console.error("Failed to load fallback private key from .env.example:", err);
  }
}

const privateKey = normalizePrivateKey(rawPrivateKey);
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
    spreadsheetId: spreadsheetId ? `${spreadsheetId.slice(0, 6)}...` : "missing",
    usingFallbackKey: !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.includes("-----BEGIN"),
    privateKeyDetails: {
      length: privateKey.length,
      start: privateKey ? privateKey.substring(0, 50) : "",
      end: privateKey ? privateKey.substring(Math.max(0, privateKey.length - 50)) : "",
      hasLiteralN: privateKey.includes("\n"),
      hasEscapedN: privateKey.includes("\\n"),
    }
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
