import React from 'react';
import { 
  FileText, Activity, AlertCircle, Database, Shield, FileSpreadsheet, Server, Users, Search, Play, Pause, AlertTriangle, ShieldAlert, Key, Link as LinkIcon, ExternalLink, Calendar, Plus, RefreshCw, Filter, Trash2, Edit3, X, Save, Lock, LogOut, CheckCircle2, Copy, Download, Printer, Check, ChevronDown, CheckSquare, Package, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export interface PeriodicSummaryReportModalProps {
  showSummaryModal: any;
  setShowSummaryModal: any;
  summaryReportText: any;
  handleCopySummary: any;
  copiedSummary: any;
}



export const PeriodicSummaryReportModal: React.FC<PeriodicSummaryReportModalProps> = ({ showSummaryModal, setShowSummaryModal, summaryReportText, handleCopySummary, copiedSummary }) => {
  if (!showSummaryModal) return null;

  return (
<div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">
                  Laporan Rangkuman Berkala Kinerja & Infrastruktur IT
                </h3>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {summaryReportText}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={handleCopySummary}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-teal-400" />
                <span>{copiedSummary ? 'Tersalin ke Clipboard!' : 'Salin Teks Laporan'}</span>
              </button>

              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-teal-500/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      
  );
};
