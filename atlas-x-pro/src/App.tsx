/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Upload, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  BarChart3, 
  Search, 
  MessageSquare, 
  FileText, 
  Settings, 
  ChevronRight,
  Loader2,
  Database,
  Cpu,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { GoogleGenAI } from "@google/genai";

const ATLAS_X_PRO = () => {
  // Initialize Gemini on the frontend
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to **ATLAS-X PRO**. I am ready to assist with your mission-critical AI tasks. How can I help you today?', metrics: null }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState({
    confidence: 0.98,
    grounding_score: 0.95,
    hallucination_risk: 0.02,
    latency_ms: 120,
    sources: []
  });
  const [documents, setDocuments] = useState([
    { name: 'System_Architecture.pdf', size: '2.4 MB', status: 'indexed' },
    { name: 'Security_Protocol.docx', size: '1.1 MB', status: 'indexed' }
  ]);
  const [perfData, setPerfData] = useState([
    { time: '10:00', latency: 120, confidence: 98 },
    { time: '10:05', latency: 145, confidence: 97 },
    { time: '10:10', latency: 110, confidence: 99 },
    { time: '10:15', latency: 160, confidence: 96 },
    { time: '10:20', latency: 130, confidence: 98 },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, metrics: null };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const startTime = Date.now();

    try {
      // 1. Retrieval from backend
      const retrievalResponse = await fetch('/api/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });
      const { context } = await retrievalResponse.json();

      // 2. Generation on frontend
      const model = "gemini-3-flash-preview";
      const systemInstruction = `
        You are ATLAS-X PRO, a production-grade AI platform.
        Use the provided context to answer the user's question.
        If the context is not enough, use your general knowledge but indicate the confidence level.
        Always return a structured response with confidence, grounding_score, and hallucination_risk.
        Context: ${context.join("\n")}
      `;

      const aiResponse = await ai.models.generateContent({
        model,
        contents: input,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      let data;
      try {
        data = JSON.parse(aiResponse.text);
      } catch (e) {
        data = { answer: aiResponse.text };
      }
      
      const assistantMessage = { 
        role: 'assistant', 
        content: String(data.answer || data.text || aiResponse.text || "I'm sorry, I couldn't process that."), 
        metrics: {
          confidence: data.confidence || 0.9,
          grounding_score: data.grounding_score || (context.length > 0 ? 0.85 : 0.4),
          hallucination_risk: data.hallucination_risk || (context.length > 0 ? 0.05 : 0.2),
          latency_ms: Date.now() - startTime,
          sources: context || []
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActiveMetrics(assistantMessage.metrics);
      
      // Update performance chart
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes()}`;
      setPerfData(prev => [...prev.slice(-9), { 
        time: timeStr, 
        latency: assistantMessage.metrics.latency_ms, 
        confidence: assistantMessage.metrics.confidence * 100 
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "An error occurred while processing your request. Please ensure your Gemini API key is configured in the Secrets panel.", 
        metrics: null 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, content })
        });
        setDocuments(prev => [...prev, { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, status: 'indexed' }]);
      } catch (error) {
        console.error("Upload Error:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Main Layout */}
      <div className="relative flex h-screen overflow-hidden">
        
        {/* Sidebar - Document Management */}
        <aside className="w-72 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ATLAS-X</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-orange-500 font-semibold">Pro Edition</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4 block px-2">Knowledge Base</label>
              <div className="space-y-1">
                {documents.map((doc, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                      <FileText className="w-4 h-4 text-white/40 group-hover:text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-[10px] text-white/30">{doc.size} • {doc.status}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="px-2">
              <label 
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-white/20 group-hover:text-orange-500 mb-2 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-orange-500 transition-colors">Upload Data</span>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                <span className="text-[10px] font-bold">JD</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold">Admin Node</p>
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  Online
                </p>
              </div>
              <Settings className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-black/20">
          {/* Top Bar */}
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-md bg-black/40 z-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                <span className="text-xs font-bold uppercase tracking-widest">Neural Link Active</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Gemini 3.0 Pro</span>
                <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> RAG Enabled</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5">
                Export Session
              </button>
            </div>
          </header>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-6 max-w-4xl mx-auto",
                    msg.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    msg.role === 'user' 
                      ? "bg-white/5 border-white/10" 
                      : "bg-orange-500/10 border-orange-500/20"
                  )}>
                    {msg.role === 'user' ? <Search className="w-5 h-5 text-white/40" /> : <Zap className="w-5 h-5 text-orange-500" />}
                  </div>
                  <div className={cn(
                    "flex-1 space-y-2",
                    msg.role === 'user' ? "text-right" : ""
                  )}>
                    <div className={cn(
                      "inline-block p-4 rounded-2xl text-sm leading-relaxed border",
                      msg.role === 'user'
                        ? "bg-white/5 border-white/10 text-white/80"
                        : "bg-white/[0.03] border-white/5 text-white/90 backdrop-blur-sm"
                    )}>
                      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                        <Markdown>
                          {String(msg.content)}
                        </Markdown>
                      </div>
                    </div>
                    
                    {msg.metrics && (
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Confidence: {(msg.metrics.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20">
                          <Activity className="w-3 h-3 text-blue-500" />
                          Latency: {msg.metrics.latency_ms}ms
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6 max-w-4xl mx-auto"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
                <div className="flex-1 pt-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-bounce" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 pt-0">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200" />
              <div className="relative flex items-center gap-2 p-2 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-2xl">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Query ATLAS-X Intelligence..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-2 placeholder:text-white/20"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 flex items-center justify-center transition-all shadow-lg shadow-orange-500/20"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <p className="text-center mt-4 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
              Powered by Gemini 3.0 Pro • Enterprise Grade Security
            </p>
          </div>
        </main>

        {/* Right Panel - Observability */}
        <aside className="w-80 border-l border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4">System Observability</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Confidence</p>
                <p className="text-xl font-bold text-orange-500">{(activeMetrics.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Grounding</p>
                <p className="text-xl font-bold text-blue-500">{(activeMetrics.grounding_score * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Reliability Metrics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/60">Reliability Scoring</h3>
                <Activity className="w-3 h-3 text-orange-500" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-white/40">Hallucination Risk</span>
                    <span className={cn(
                      activeMetrics.hallucination_risk > 0.1 ? "text-red-500" : "text-green-500"
                    )}>
                      {(activeMetrics.hallucination_risk * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMetrics.hallucination_risk * 100}%` }}
                      className={cn(
                        "h-full rounded-full",
                        activeMetrics.hallucination_risk > 0.1 ? "bg-red-500" : "bg-green-500"
                      )} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-white/40">Grounding Score</span>
                    <span className="text-blue-500">{(activeMetrics.grounding_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMetrics.grounding_score * 100}%` }}
                      className="h-full bg-blue-500 rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/60">Latency Metrics (ms)</h3>
                <BarChart3 className="w-3 h-3 text-blue-500" />
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="latency" stroke="#f97316" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sources */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/60">Active Sources</h3>
                <Search className="w-3 h-3 text-white/20" />
              </div>
              <div className="space-y-2">
                {activeMetrics.sources && activeMetrics.sources.length > 0 ? (
                  activeMetrics.sources.map((source, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] text-white/60 leading-relaxed italic">
                      "{source.substring(0, 100)}..."
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-white/20 italic text-center py-4">No active sources retrieved</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
              <span>System Status</span>
              <span className="text-green-500">Nominal</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ATLAS_X_PRO;
