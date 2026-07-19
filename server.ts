import express from "express";
import path from "path";
import app from "./app";

const PORT = 3000;

// Vite / static asset serving for local development and standalone prod starts
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

// Only start the Express listener and asset serving if we are NOT on Vercel.
// On Vercel, the front-end is served statically and the Express app is run serverless.
if (!process.env.VERCEL) {
  setupViteOrStatic();
}

export default app;
