import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));

// --- In-Memory Document Store (Simulated FAISS) ---
// NOTE: On Vercel Serverless Functions, this store will be reset on cold starts.
// For production persistence, consider using a database like Supabase or MongoDB Atlas.
const documentStore = [];

// --- API Routes ---

// 1. Retrieval Endpoint
app.post("/api/retrieve", async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  // Simple keyword search for demo
  const results = documentStore.filter(doc => 
    doc.content.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);
  
  res.json({ context: results.map(r => r.content) });
});

// 2. Document Upload
app.post("/api/documents/upload", async (req, res) => {
  const { filename, content } = req.body;
  
  if (!filename || !content) {
    return res.status(400).json({ error: "Filename and content are required" });
  }

  documentStore.push({ filename, content });
  res.json({ status: "success", message: `Document ${filename} uploaded and indexed.` });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ATLAS-X PRO Orchestrator (Vercel Serverless)" });
});

// Export the app for Vercel
export default app;
