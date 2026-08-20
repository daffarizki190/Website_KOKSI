import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Share2,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Server,
  HardDrive,
  Cpu,
  Layers,
  Database,
  Activity,
  Terminal,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ExternalLink,
  Flame,
  Radio
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface GrafanaArcGaugeProps {
  title: string;
  value: string | number;
  unit?: string;
  percent?: number; // 0 to 100
  color?: string; // hex or tailwind
  infoTooltip?: string;
  subValue?: string;
  isTextOnly?: boolean;
}

// Reusable SVG Radial Arc Gauge matching Grafana Gauge Panel
export const GrafanaArcGauge: React.FC<GrafanaArcGaugeProps> = ({
  title,
  value,
  unit = '',
  percent = 0,
  color = '#22c55e',
  infoTooltip,
  isTextOnly = false
}) => {
  // SVG Dimensions & Arc geometry (180-degree or 220-degree semicircle arc)
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // 180 degree semi-circle
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Determine auto color if not explicitly provided
  let arcColor = color;
  if (!color || color === 'auto') {
    if (clampedPercent >= 85) arcColor = '#ef4444'; // Red
    else if (clampedPercent >= 70) arcColor = '#f97316'; // Orange
    else if (clampedPercent >= 45) arcColor = '#eab308'; // Yellow
    else arcColor = '#22c55e'; // Green
  }

  return (
    <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between items-center relative shadow-sm hover:border-[#3d4452] transition-colors h-[100px] select-none">
      {/* Panel Header */}
      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-300 px-1 border-b border-[#242933] pb-1">
        <span className="truncate">{title}</span>
        {infoTooltip && (
          <span title={infoTooltip} className="text-slate-500 hover:text-slate-300 cursor-pointer ml-1">
            <Info className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Gauge Body */}
      {isTextOnly ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm font-bold text-rose-500 tracking-wider uppercase">
            {value}
          </span>
        </div>
      ) : (
        <div className="relative w-[110px] h-[55px] flex items-end justify-center mt-1 overflow-hidden">
          <svg className="w-[110px] h-[110px] absolute top-0" viewBox="0 0 110 110">
            {/* Background Arc */}
            <path
              d="M 10 60 A 45 45 0 0 1 100 60"
              fill="none"
              stroke="#2c3240"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value Colored Arc */}
            <path
              d="M 10 60 A 45 45 0 0 1 100 60"
              fill="none"
              stroke={arcColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Value */}
          <div className="text-center z-10 -mb-1">
            <span
              className="text-base font-black tracking-tight"
              style={{ color: arcColor }}
            >
              {value}
            </span>
            {unit && <span className="text-[10px] font-semibold ml-0.5 text-slate-300">{unit}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export const GrafanaNOCDashboard: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(5); // seconds
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('Last 1 hour');
  const [datasource, setDatasource] = useState<string>('Prometheus-0y5');
  const [location, setLocation] = useState<string>('Gandaria City Jakarta');
  const [instance, setInstance] = useState<string>('localhost:9192');

  // Accordion open/close state for servers
  const [serverUtamaOpen, setServerUtamaOpen] = useState<boolean>(true);
  const [serverBackupOpen, setServerBackupOpen] = useState<boolean>(true);

  // Dynamic live metric simulation data with realistic fluctuations
  const [metricsUtama, setMetricsUtama] = useState({
    pressureCpu: 0.9,
    pressureMem: 4.8,
    pressureIO: 29.3,
    cpuLoad: 25.4,
    sysLoad5m: 7.65,
    sysLoad15m: 7.49,
    ramUsedPercent: 59.0,
    ramUsedGiB: 37.17,
    ramTotalGiB: 63,
    swapUsed: 'N/A',
    diskUsedPercent: 59.6,
    diskTotalTiB: 2,
    diskHealth: 92,
    diskPerformance: 100,
    diskLifetimeWrites: 272,
    diskTemp: 41,
    diskDevice: '/dev/nvme0',
    diskModel: 'Samsung SSD 990 PRO 2TB',
    diskPowerOnTime: '47 weeks',
    uptimeWeeks: '28.0 weeks',
    cpuCores: 16
  });

  const [metricsBackup, setMetricsBackup] = useState({
    pressureCpu: 0.0,
    pressureMem: 0.0,
    pressureIO: 0.7,
    cpuLoad: 1.73,
    sysLoad5m: 0.62,
    sysLoad15m: 0.62,
    ramUsedPercent: 33.0,
    ramUsedGiB: 20.79,
    ramTotalGiB: 63,
    swapUsed: 'N/A',
    diskUsedPercent: 62.7,
    diskTotalTiB: 2,
    diskHealth: 93,
    diskPerformance: 100,
    diskLifetimeWrites: 114,
    diskTemp: 31,
    diskDevice: '/dev/nvme0',
    diskModel: 'Samsung SSD 990 PRO 2TB',
    diskPowerOnTime: '24 weeks',
    uptimeWeeks: '8.7 weeks',
    cpuCores: 16
  });

  // Real-time Temperature Series (6 Cores) for Hardware Monitor Chart
  const [chartDataUtama, setChartDataUtama] = useState<Array<{
    time: string;
    core1: number;
    core2: number;
    core3: number;
    core4: number;
    core5: number;
    core6: number;
  }>>([]);

  const [chartDataBackup, setChartDataBackup] = useState<Array<{
    time: string;
    core1: number;
    core2: number;
    core3: number;
  }>>([]);

  // Initialize and update real-time temperature graph series
  useEffect(() => {
    // Generate initial 15 data points
    const now = Date.now();
    const initDataUtama = [];
    const initDataBackup = [];
    for (let i = 14; i >= 0; i--) {
      const t = new Date(now - i * 15000);
      const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
      initDataUtama.push({
        time: timeStr,
        core1: 76 + Math.sin(i) * 2 + (Math.random() * 2 - 1),
        core2: 68 + Math.cos(i) * 1.5 + (Math.random() * 2 - 1),
        core3: 66 + Math.sin(i * 0.8) * 1.8 + (Math.random() * 2 - 1),
        core4: 68 + Math.cos(i * 1.2) * 1.4 + (Math.random() * 2 - 1),
        core5: 65 + Math.sin(i * 1.5) * 1.2 + (Math.random() * 2 - 1),
        core6: 77 + Math.cos(i * 0.5) * 2.2 + (Math.random() * 2 - 1)
      });

      initDataBackup.push({
        time: timeStr,
        core1: 40 + Math.sin(i) * 1.2 + (Math.random() * 1.5 - 0.75),
        core2: 39 + Math.cos(i) * 1.1 + (Math.random() * 1.5 - 0.75),
        core3: 37 + Math.sin(i * 0.9) * 0.9 + (Math.random() * 1.5 - 0.75)
      });
    }
    setChartDataUtama(initDataUtama);
    setChartDataBackup(initDataBackup);
  }, []);

  // Interval Tick for live updating Grafana NOC meters
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      const t = new Date();
      const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
      setLastUpdated(t);

      // Jitter metrics slightly to simulate live telemetry stream
      setMetricsUtama(prev => ({
        ...prev,
        cpuLoad: Number(Math.max(12, Math.min(85, prev.cpuLoad + (Math.random() * 3.4 - 1.7))).toFixed(2)),
        sysLoad5m: Number(Math.max(4.0, Math.min(12.0, prev.sysLoad5m + (Math.random() * 0.4 - 0.2))).toFixed(2)),
        sysLoad15m: Number(Math.max(4.0, Math.min(10.0, prev.sysLoad15m + (Math.random() * 0.2 - 0.1))).toFixed(2)),
        ramUsedPercent: Number(Math.max(50, Math.min(75, prev.ramUsedPercent + (Math.random() * 0.8 - 0.4))).toFixed(1)),
        pressureCpu: Number(Math.max(0.2, Math.min(5.0, prev.pressureCpu + (Math.random() * 0.4 - 0.2))).toFixed(1)),
        pressureMem: Number(Math.max(2.0, Math.min(9.0, prev.pressureMem + (Math.random() * 0.3 - 0.15))).toFixed(1)),
        pressureIO: Number(Math.max(15.0, Math.min(45.0, prev.pressureIO + (Math.random() * 2.0 - 1.0))).toFixed(1)),
        diskTemp: Math.round(41 + (Math.random() * 2 - 1))
      }));

      setMetricsBackup(prev => ({
        ...prev,
        cpuLoad: Number(Math.max(0.8, Math.min(5.0, prev.cpuLoad + (Math.random() * 0.4 - 0.2))).toFixed(2)),
        sysLoad5m: Number(Math.max(0.4, Math.min(1.2, prev.sysLoad5m + (Math.random() * 0.05 - 0.025))).toFixed(2)),
        sysLoad15m: Number(Math.max(0.4, Math.min(1.0, prev.sysLoad15m + (Math.random() * 0.04 - 0.02))).toFixed(2)),
        ramUsedPercent: Number(Math.max(30, Math.min(38, prev.ramUsedPercent + (Math.random() * 0.4 - 0.2))).toFixed(1)),
        diskTemp: Math.round(31 + (Math.random() * 1.5 - 0.75))
      }));

      // Update charts
      setChartDataUtama(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: timeStr,
          core1: Number((76 + (Math.random() * 3 - 1.5)).toFixed(1)),
          core2: Number((68 + (Math.random() * 2.5 - 1.2)).toFixed(1)),
          core3: Number((66 + (Math.random() * 2.2 - 1.1)).toFixed(1)),
          core4: Number((68 + (Math.random() * 2.5 - 1.2)).toFixed(1)),
          core5: Number((65 + (Math.random() * 2.0 - 1.0)).toFixed(1)),
          core6: Number((77 + (Math.random() * 3.2 - 1.6)).toFixed(1))
        });
        return next;
      });

      setChartDataBackup(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: timeStr,
          core1: Number((40 + (Math.random() * 1.5 - 0.75)).toFixed(1)),
          core2: Number((39 + (Math.random() * 1.3 - 0.65)).toFixed(1)),
          core3: Number((37 + (Math.random() * 1.1 - 0.55)).toFixed(1))
        });
        return next;
      });
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isLiveActive, refreshInterval]);

  return (
    <div className="w-full bg-[#111217] text-slate-200 font-sans min-h-screen rounded-2xl border border-[#22252b] overflow-hidden shadow-2xl flex flex-col">
      {/* 1. TOP GRAFANA APP BAR */}
      <div className="bg-[#181b1f] border-b border-[#242933] px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Breadcrumbs & Dashboard Title */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#ff7919] rounded flex items-center justify-center text-slate-950 font-black text-[11px]">
            G
          </div>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Home</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Dashboards</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-bold flex items-center gap-1.5">
            Summary
            <span className="text-amber-400 cursor-pointer">★</span>
          </span>
        </div>

        {/* Center: Search / Jump bar */}
        <div className="hidden lg:flex items-center bg-[#111217] border border-[#2b313d] rounded-md px-2.5 py-1 text-slate-400 gap-2 w-72">
          <Search className="w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search or jump to..."
            className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder:text-slate-600"
          />
          <span className="text-[10px] font-mono text-slate-500 bg-[#181b1f] px-1 rounded border border-[#2b313d]">ctrl+k</span>
        </div>

        {/* Right: Controls & Presets */}
        <div className="flex items-center gap-2">
          <button className="bg-[#1f232b] hover:bg-[#2b313d] px-2.5 py-1 rounded text-slate-300 font-semibold flex items-center gap-1.5 border border-[#2a2f38] transition-colors cursor-pointer text-xs">
            <Share2 className="w-3 h-3 text-sky-400" />
            <span>Share</span>
          </button>

          {/* Time Picker */}
          <div className="bg-[#1f232b] border border-[#2a2f38] rounded px-2.5 py-1 flex items-center gap-1.5 text-slate-200 font-semibold cursor-pointer">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeRange}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          {/* Auto Refresh dropdown */}
          <div className="flex items-center bg-[#1f232b] border border-[#2a2f38] rounded">
            <button
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={`p-1.5 border-r border-[#2a2f38] transition-colors ${
                isLiveActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={isLiveActive ? 'Live streaming active' : 'Live stream paused'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs px-2 py-1 outline-none cursor-pointer"
            >
              <option value="5" className="bg-[#181b1f]">5s</option>
              <option value="10" className="bg-[#181b1f]">10s</option>
              <option value="30" className="bg-[#181b1f]">30s</option>
              <option value="60" className="bg-[#181b1f]">1m</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. PROMETHEUS VARIABLES & FILTER TOOLBAR */}
      <div className="bg-[#14161a] border-b border-[#242933] px-3.5 py-2 flex flex-wrap items-center gap-2 text-[11px] overflow-x-auto">
        {/* datasource */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-[#3b82f6] font-semibold">datasource</span>
          <select
            value={datasource}
            onChange={(e) => setDatasource(e.target.value)}
            className="bg-transparent text-slate-200 font-bold outline-none cursor-pointer"
          >
            <option value="Prometheus-0y5" className="bg-[#181b1f]">Prometheus-0y5</option>
            <option value="Prometheus-Prod" className="bg-[#181b1f]">Prometheus-Prod</option>
            <option value="NeonDB-Pool" className="bg-[#181b1f]">NeonDB-Pool</option>
          </select>
        </div>

        {/* datasource-2 */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-[#3b82f6] font-semibold">datasource-2</span>
          <span className="text-slate-200 font-bold">Prometheus-0y5-Backup</span>
        </div>

        {/* Interval */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Interval</span>
          <span className="text-slate-200 font-bold">auto</span>
        </div>

        {/* Namespace */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Namespace</span>
          <span className="text-slate-200 font-bold">None</span>
        </div>

        {/* Release */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Release</span>
          <span className="text-slate-200 font-bold">None</span>
        </div>

        {/* Instance */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Instance</span>
          <span className="text-emerald-400 font-mono font-bold">{instance}</span>
        </div>

        {/* Database */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Database</span>
          <span className="text-slate-200 font-bold">All</span>
        </div>

        {/* Lock table */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Lock table</span>
          <span className="text-slate-200 font-bold">All</span>
        </div>

        {/* Job */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Job</span>
          <span className="text-amber-400 font-mono font-bold">node</span>
        </div>

        {/* Host */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5">
          <span className="text-slate-400">Host:</span>
          <span className="text-cyan-400 font-mono font-bold">localhost:9100</span>
        </div>

        {/* Location */}
        <div className="flex items-center bg-[#1b1f26] border border-[#2a303d] rounded px-2 py-0.5 gap-1.5 ml-auto">
          <span className="text-slate-400">Location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-transparent text-emerald-400 font-bold outline-none cursor-pointer"
          >
            <option value="Gandaria City Jakarta" className="bg-[#181b1f]">Gandaria City Jakarta</option>
            <option value="Jakarta IDC Tier-3" className="bg-[#181b1f]">Jakarta IDC Tier-3</option>
            <option value="Singapore Edge DC" className="bg-[#181b1f]">Singapore Edge DC</option>
          </select>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
        
        {/* ========================================================= */}
        {/* SECTION 1: SERVER UTAMA (PRIMARY PRODUCTION ENGINE) */}
        {/* ========================================================= */}
        <div className="border border-[#262b35] rounded-lg bg-[#14161b] overflow-hidden shadow-lg">
          {/* Section Collapsible Header */}
          <div
            onClick={() => setServerUtamaOpen(!serverUtamaOpen)}
            className="bg-[#1b1f26] hover:bg-[#20252e] px-3.5 py-2 flex items-center justify-between border-b border-[#262b35] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wide">
              {serverUtamaOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Server Utama (Production - Gandaria City Jakarta)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE (ACTIVE)
              </span>
              <span className="font-mono text-slate-400 text-[11px]">Uptime: {metricsUtama.uptimeWeeks}</span>
            </div>
          </div>

          {serverUtamaOpen && (
            <div className="p-3 space-y-3">
              {/* ROW 1: PRESSURE & SPEEDOMETER GAUGES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {/* Panel 1: Pressure Meters */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[100px]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-[#242933] pb-1">
                    <span>Pressure</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="space-y-1 text-[10px] font-mono mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">CPU</span>
                      <div className="w-12 bg-[#2c3240] h-2 rounded-sm overflow-hidden flex items-center">
                        <div className="bg-emerald-500 h-full" style={{ width: `${metricsUtama.pressureCpu * 20}%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold">{metricsUtama.pressureCpu}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mem</span>
                      <div className="w-12 bg-[#2c3240] h-2 rounded-sm overflow-hidden flex items-center">
                        <div className="bg-emerald-500 h-full" style={{ width: `${metricsUtama.pressureMem * 15}%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold">{metricsUtama.pressureMem}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">I/O</span>
                      <div className="w-12 bg-[#2c3240] h-2 rounded-sm overflow-hidden flex items-center">
                        <div className="bg-emerald-500 h-full" style={{ width: `${metricsUtama.pressureIO}%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold">{metricsUtama.pressureIO}%</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: CPU Loads */}
                <GrafanaArcGauge
                  title="CPU Loads"
                  value={`${metricsUtama.cpuLoad}%`}
                  percent={metricsUtama.cpuLoad}
                  color="#22c55e"
                  infoTooltip="Realtime CPU processor core utilization"
                />

                {/* Panel 3: Sys Load (5m avg) */}
                <GrafanaArcGauge
                  title="Sys Load (5m avg)"
                  value={metricsUtama.sysLoad5m}
                  percent={(metricsUtama.sysLoad5m / 16) * 100}
                  color="#22c55e"
                  infoTooltip="5 minute system load average across 16 cores"
                />

                {/* Panel 4: Sys Load (15m avg) */}
                <GrafanaArcGauge
                  title="Sys Load (15m avg)"
                  value={metricsUtama.sysLoad15m}
                  percent={(metricsUtama.sysLoad15m / 16) * 100}
                  color="#22c55e"
                  infoTooltip="15 minute system load average across 16 cores"
                />

                {/* Panel 5: RAM Used */}
                <GrafanaArcGauge
                  title="RAM Used"
                  value={`${metricsUtama.ramUsedPercent}%`}
                  percent={metricsUtama.ramUsedPercent}
                  color="#22c55e"
                  infoTooltip="Total ECC Physical Memory utilized"
                />

                {/* Panel 6: SWAP Used */}
                <GrafanaArcGauge
                  title="SWAP Used"
                  value={metricsUtama.swapUsed}
                  percent={0}
                  color="#ef4444"
                  infoTooltip="Virtual Swap Memory Utilization"
                />

                {/* Panel 7: Disk Used */}
                <GrafanaArcGauge
                  title="Disk Used"
                  value={`${metricsUtama.diskUsedPercent}%`}
                  percent={metricsUtama.diskUsedPercent}
                  color="#22c55e"
                  infoTooltip="NVMe SSD Partition Utilization"
                />
              </div>

              {/* ROW 2: SPECS & HARDWARE STATS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
                {/* Memory Test */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">Memory Test</span>
                  <span className="text-rose-500 font-extrabold text-xs tracking-wider">No Data</span>
                </div>

                {/* CPU Cores */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">CPU Cores</span>
                  <span className="text-white font-black text-base">{metricsUtama.cpuCores}</span>
                </div>

                {/* Uptime */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">Uptime</span>
                  <span className="text-slate-200 font-bold text-xs">{metricsUtama.uptimeWeeks}</span>
                </div>

                {/* RAM Total */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">RAM Total</span>
                  <span className="text-white font-black text-sm">{metricsUtama.ramTotalGiB} GiB</span>
                </div>

                {/* SWAP Total */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">SWAP Total</span>
                  <span className="text-slate-300 font-bold text-xs">0 B</span>
                </div>

                {/* Disk Total */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">Disk Total</span>
                  <span className="text-white font-black text-sm">{metricsUtama.diskTotalTiB} TiB</span>
                </div>
              </div>

              {/* ROW 3: DISK SENSORS & HARDWARE TEMPERATURE MONITOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                {/* Left Side: Disk Health, Performance, Temp & Info (7 cols) */}
                <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Disk Health */}
                  <GrafanaArcGauge
                    title="Disk Health"
                    value={`${metricsUtama.diskHealth}%`}
                    percent={metricsUtama.diskHealth}
                    color="#f97316"
                  />

                  {/* Disk Performance */}
                  <GrafanaArcGauge
                    title="Disk Performance"
                    value={`${metricsUtama.diskPerformance}%`}
                    percent={metricsUtama.diskPerformance}
                    color="#22c55e"
                  />

                  {/* Disk Lifetime Writes */}
                  <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[100px] text-center">
                    <span className="text-[11px] font-semibold text-slate-300">Disk Lifetime Writes</span>
                    <div className="flex items-baseline justify-center gap-1 my-auto">
                      <span className="text-xl font-black text-white">{metricsUtama.diskLifetimeWrites}</span>
                      <span className="text-xs font-bold text-slate-400">TB</span>
                    </div>
                  </div>

                  {/* Disk Temperature */}
                  <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[100px] text-center">
                    <span className="text-[11px] font-semibold text-slate-300">Disk Temperature</span>
                    <div className="flex items-baseline justify-center gap-1 my-auto">
                      <span className="text-xl font-black text-white">{metricsUtama.diskTemp}</span>
                      <span className="text-xs font-bold text-slate-400">°C</span>
                    </div>
                  </div>

                  {/* Device Info Badges */}
                  <div className="col-span-2 sm:col-span-4 bg-[#181b1f] border border-[#2a2f38] rounded-md p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Disk Device</span>
                      <span className="font-mono text-cyan-400 font-bold">{metricsUtama.diskDevice}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Disk Model</span>
                      <span className="text-slate-200 font-semibold truncate block">{metricsUtama.diskModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Disk Power On Time</span>
                      <span className="text-slate-300 font-bold">{metricsUtama.diskPowerOnTime}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Hardware Temperature Monitor Chart (6 cols) */}
                <div className="lg:col-span-6 bg-[#181b1f] border border-[#2a2f38] rounded-md p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-[#242933] pb-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Hardware temperature monitor</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Sensors: coretemp</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 items-center">
                    {/* Chart Canvas */}
                    <div className="md:col-span-2 h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataUtama} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#262b35" vertical={false} />
                          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[50, 90]} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#14161b', borderColor: '#2e3542', fontSize: '11px', borderRadius: '6px' }}
                            formatter={(v: any) => [`${v} °C`]}
                          />
                          <Line type="monotone" dataKey="core1" stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core2" stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core3" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core4" stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core5" stroke="#ec4899" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core6" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Sensor Values Table */}
                    <div className="bg-[#14161b] p-2 rounded border border-[#242933] text-[10px] space-y-1 font-mono">
                      <div className="flex justify-between text-slate-500 font-bold border-b border-[#262b35] pb-0.5">
                        <span>Name</span>
                        <span>Last *</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>coretemp temp1</span>
                        <span>77 °C</span>
                      </div>
                      <div className="flex justify-between text-yellow-400">
                        <span>coretemp temp2</span>
                        <span>68 °C</span>
                      </div>
                      <div className="flex justify-between text-blue-400">
                        <span>coretemp temp3</span>
                        <span>66 °C</span>
                      </div>
                      <div className="flex justify-between text-purple-400">
                        <span>coretemp temp4</span>
                        <span>68 °C</span>
                      </div>
                      <div className="flex justify-between text-pink-400">
                        <span>coretemp temp5</span>
                        <span>65 °C</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>coretemp temp6</span>
                        <span>77 °C</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: SERVER BACKUP (STANDBY / FAILOVER NODE) */}
        {/* ========================================================= */}
        <div className="border border-[#262b35] rounded-lg bg-[#14161b] overflow-hidden shadow-lg">
          {/* Section Collapsible Header */}
          <div
            onClick={() => setServerBackupOpen(!serverBackupOpen)}
            className="bg-[#1b1f26] hover:bg-[#20252e] px-3.5 py-2 flex items-center justify-between border-b border-[#262b35] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wide">
              {serverBackupOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Server Backup (Secondary Node - Standby Disaster Recovery)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                STANDBY (IDLE)
              </span>
              <span className="font-mono text-slate-400 text-[11px]">Uptime: {metricsBackup.uptimeWeeks}</span>
            </div>
          </div>

          {serverBackupOpen && (
            <div className="p-3 space-y-3">
              {/* ROW 1: PRESSURE & SPEEDOMETER GAUGES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {/* Panel 1: Pressure Meters */}
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[100px]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-[#242933] pb-1">
                    <span>Pressure</span>
                    <Info className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="space-y-1 text-[10px] font-mono mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">CPU</span>
                      <div className="w-12 bg-[#2c3240] h-2 rounded-sm overflow-hidden flex items-center">
                        <div className="bg-emerald-500 h-full" style={{ width: `0%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold">0.0%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mem</span>
                      <div className="w-12 bg-[#2c3240] h-2 rounded-sm overflow-hidden flex items-center">
                        <div className="bg-emerald-500 h-full" style={{ width: `0%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold">0.0%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">I/O</span>
                      <div className="w-12 bg-[#2c3240] h-2 rounded-sm overflow-hidden flex items-center">
                        <div className="bg-emerald-500 h-full" style={{ width: `2%` }} />
                      </div>
                      <span className="text-emerald-400 font-bold">0.7%</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: CPU Loads */}
                <GrafanaArcGauge
                  title="CPU Loads"
                  value={`${metricsBackup.cpuLoad}%`}
                  percent={metricsBackup.cpuLoad}
                  color="#22c55e"
                />

                {/* Panel 3: Sys Load (5m avg) */}
                <GrafanaArcGauge
                  title="Sys Load (5m avg)"
                  value={metricsBackup.sysLoad5m}
                  percent={(metricsBackup.sysLoad5m / 16) * 100}
                  color="#22c55e"
                />

                {/* Panel 4: Sys Load (15m avg) */}
                <GrafanaArcGauge
                  title="Sys Load (15m avg)"
                  value={metricsBackup.sysLoad15m}
                  percent={(metricsBackup.sysLoad15m / 16) * 100}
                  color="#22c55e"
                />

                {/* Panel 5: RAM Used */}
                <GrafanaArcGauge
                  title="RAM Used"
                  value={`${metricsBackup.ramUsedPercent}%`}
                  percent={metricsBackup.ramUsedPercent}
                  color="#22c55e"
                />

                {/* Panel 6: SWAP Used */}
                <GrafanaArcGauge
                  title="SWAP Used"
                  value={metricsBackup.swapUsed}
                  percent={0}
                  color="#ef4444"
                />

                {/* Panel 7: Disk Used */}
                <GrafanaArcGauge
                  title="Disk Used"
                  value={`${metricsBackup.diskUsedPercent}%`}
                  percent={metricsBackup.diskUsedPercent}
                  color="#22c55e"
                />
              </div>

              {/* ROW 2: SPECS & HARDWARE STATS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">Memory Test</span>
                  <span className="text-rose-500 font-extrabold text-xs tracking-wider">No Data</span>
                </div>
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">CPU Cores</span>
                  <span className="text-white font-black text-base">{metricsBackup.cpuCores}</span>
                </div>
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">Uptime</span>
                  <span className="text-slate-200 font-bold text-xs">{metricsBackup.uptimeWeeks}</span>
                </div>
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">RAM Total</span>
                  <span className="text-white font-black text-sm">{metricsBackup.ramTotalGiB} GiB</span>
                </div>
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">SWAP Total</span>
                  <span className="text-slate-300 font-bold text-xs">0 B</span>
                </div>
                <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[65px]">
                  <span className="text-[10px] text-slate-400 font-semibold">Disk Total</span>
                  <span className="text-white font-black text-sm">{metricsBackup.diskTotalTiB} TiB</span>
                </div>
              </div>

              {/* ROW 3: DISK SENSORS & HARDWARE TEMPERATURE MONITOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                {/* Left Side: Disk Health, Performance, Temp & Info (6 cols) */}
                <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <GrafanaArcGauge
                    title="Disk Health"
                    value={`${metricsBackup.diskHealth}%`}
                    percent={metricsBackup.diskHealth}
                    color="#f97316"
                  />
                  <GrafanaArcGauge
                    title="Disk Performance"
                    value={`${metricsBackup.diskPerformance}%`}
                    percent={metricsBackup.diskPerformance}
                    color="#22c55e"
                  />
                  <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[100px] text-center">
                    <span className="text-[11px] font-semibold text-slate-300">Disk Lifetime Writes</span>
                    <div className="flex items-baseline justify-center gap-1 my-auto">
                      <span className="text-xl font-black text-white">{metricsBackup.diskLifetimeWrites}</span>
                      <span className="text-xs font-bold text-slate-400">TB</span>
                    </div>
                  </div>
                  <div className="bg-[#181b1f] border border-[#2a2f38] rounded-md p-2 flex flex-col justify-between h-[100px] text-center">
                    <span className="text-[11px] font-semibold text-slate-300">Disk Temperature</span>
                    <div className="flex items-baseline justify-center gap-1 my-auto">
                      <span className="text-xl font-black text-white">{metricsBackup.diskTemp}</span>
                      <span className="text-xs font-bold text-slate-400">°C</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Temperature Chart */}
                <div className="lg:col-span-6 bg-[#181b1f] border border-[#2a2f38] rounded-md p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-[#242933] pb-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Hardware temperature monitor (Standby)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Sensors: coretemp</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 items-center">
                    <div className="md:col-span-2 h-[100px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataBackup} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#262b35" vertical={false} />
                          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[30, 50]} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#14161b', borderColor: '#2e3542', fontSize: '11px', borderRadius: '6px' }}
                            formatter={(v: any) => [`${v} °C`]}
                          />
                          <Line type="monotone" dataKey="core1" stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core2" stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="core3" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-[#14161b] p-2 rounded border border-[#242933] text-[10px] space-y-1 font-mono">
                      <div className="flex justify-between text-slate-500 font-bold border-b border-[#262b35] pb-0.5">
                        <span>Name</span>
                        <span>Last *</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>coretemp temp1</span>
                        <span>40 °C</span>
                      </div>
                      <div className="flex justify-between text-yellow-400">
                        <span>coretemp temp2</span>
                        <span>39 °C</span>
                      </div>
                      <div className="flex justify-between text-blue-400">
                        <span>coretemp temp3</span>
                        <span>37 °C</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
