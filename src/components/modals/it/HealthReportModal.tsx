import React from 'react';
import { 
  FileText, Activity, AlertCircle, Database, Shield, FileSpreadsheet, Server, Users, Search, Play, Pause, AlertTriangle, ShieldAlert, Key, Link as LinkIcon, ExternalLink, Calendar, Plus, RefreshCw, Filter, Trash2, Edit3, X, Save, Lock, LogOut, CheckCircle2, Copy, Download, Printer, Check, ChevronDown, CheckSquare, Package, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export interface HealthReportModalProps {
  showHealthReportModal: any;
  setShowHealthReportModal: any;
  healthReportText: any;
  copiedHealthReport: any;
  setCopiedHealthReport: any;
  toast: any;
  handleDownloadHealthReport: any;
}



export const HealthReportModal: React.FC<HealthReportModalProps> = ({ showHealthReportModal, setShowHealthReportModal, healthReportText, copiedHealthReport, setCopiedHealthReport, toast, handleDownloadHealthReport }) => {
  if (!showHealthReportModal) return null;

  return (
<div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Laporan Resmi Kesehatan Sistem & Diagnostik API
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Dokumen siap cetak & unduh untuk audit infrastruktur platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthReportModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {healthReportText}
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(healthReportText);
                    setCopiedHealthReport(true);
                    toast.success('Laporan kesehatan berhasil disalin!');
                    setTimeout(() => setCopiedHealthReport(false), 3000);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>{copiedHealthReport ? 'Tersalin ke Clipboard!' : 'Salin Markdown'}</span>
                </button>

                <button
                  onClick={handleDownloadHealthReport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Unduh (.md)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Cetak / PDF</span>
                </button>
              </div>

              <button
                onClick={() => setShowHealthReportModal(false)}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-teal-500/20"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      
  );
};
