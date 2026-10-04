import React, { useCallback, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ReferenceDot, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import {
  TrafficParams, TrafficState,
  speedFromDensity, flowFromDensity
} from '../hooks/useTrafficModel';

interface DiagramsProps {
  params: TrafficParams;
  trafficState: TrafficState;
  onDensityChange: (k: number) => void;
  optimalK: number;
  maxQ: number;
  speedAtMaxQ: number;
}

function generateData(params: TrafficParams, steps = 150) {
  const data = [];
  for (let i = 0; i <= steps; i++) {
    const k = (i / steps) * params.jamDensity;
    const v = speedFromDensity(k, params);
    const q = k * v;
    data.push({
      density: Math.round(k * 10) / 10,
      speed: Math.round(v * 10) / 10,
      flow: Math.round(q * 10) / 10,
      time: v > 0 ? Math.round((params.roadLength / v) * 60 * 10) / 10 : null,
    });
  }
  return data;
}

export default function FundamentalDiagrams({
  params, trafficState, onDensityChange, optimalK, maxQ, speedAtMaxQ
}: DiagramsProps) {
  const data = useMemo(() => generateData(params), [params]);
  const [activeChart, setActiveChart] = useState<'fd' | 'sd' | 'sf' | 'td'>('fd');

  const handleChartClick = useCallback((chartType: string) => (e: any) => {
    if (!e) return;
    
    if (chartType === 'fd' && e.activeLabel !== undefined) {
      const k = parseFloat(e.activeLabel);
      if (!isNaN(k) && k >= 0 && k <= params.jamDensity) {
        onDensityChange(k);
      }
    } else if (chartType === 'sd' && e.activeLabel !== undefined) {
      const targetSpeed = parseFloat(e.activeLabel);
      if (isNaN(targetSpeed)) return;
      // Find density that gives this speed
      let bestK = 0, bestDiff = Infinity;
      for (let k = 0; k <= params.jamDensity; k += 0.5) {
        const v = speedFromDensity(k, params);
        const diff = Math.abs(v - targetSpeed);
        if (diff < bestDiff) { bestDiff = diff; bestK = k; }
      }
      onDensityChange(bestK);
    } else if (chartType === 'sf' && e.activeCoordinate) {
      const flow = e.activeCoordinate.y;
      if (isNaN(flow)) return;
      // Find density from flow (prefer free-flow branch)
      let bestK = 0, bestDiff = Infinity;
      for (let k = 0; k <= optimalK; k += 0.5) {
        const q = flowFromDensity(k, params);
        const diff = Math.abs(q - flow);
        if (diff < bestDiff) { bestDiff = diff; bestK = k; }
      }
      onDensityChange(bestK);
    } else if (chartType === 'td' && e.activeLabel !== undefined) {
      const k = parseFloat(e.activeLabel);
      if (!isNaN(k) && k >= 0 && k <= params.jamDensity) {
        onDensityChange(k);
      }
    }
  }, [onDensityChange, params, optimalK]);

  const currentPoint = {
    density: Math.round(trafficState.density * 10) / 10,
    speed: Math.round(trafficState.speed * 10) / 10,
    flow: Math.round(trafficState.flow * 10) / 10,
    time: trafficState.travelTime === Infinity ? null : Math.round(trafficState.travelTime * 10) / 10,
  };

  const chartTabs = [
    { id: 'fd' as const, label: 'q-k', title: 'Flow-Density' },
    { id: 'sd' as const, label: 'v-k', title: 'Speed-Density' },
    { id: 'sf' as const, label: 'v-q', title: 'Speed-Flow' },
    { id: 'td' as const, label: 't-k', title: 'Travel Time' },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart selector tabs */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {chartTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeChart === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
            }`}
          >
            <span className="font-mono">{tab.label}</span>
            <span className="ml-1.5 hidden sm:inline text-[10px] opacity-70">{tab.title}</span>
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0">
        {activeChart === 'fd' && (
          <FlowDensityChart
            data={data}
            currentPoint={currentPoint}
            optimalK={optimalK}
            maxQ={maxQ}
            onClick={handleChartClick('fd')}
          />
        )}
        {activeChart === 'sd' && (
          <SpeedDensityChart
            data={data}
            currentPoint={currentPoint}
            params={params}
            optimalK={optimalK}
            onClick={handleChartClick('sd')}
          />
        )}
        {activeChart === 'sf' && (
          <SpeedFlowChart
            data={data}
            currentPoint={currentPoint}
            params={params}
            maxQ={maxQ}
            onClick={handleChartClick('sf')}
          />
        )}
        {activeChart === 'td' && (
          <TravelTimeChart
            data={data}
            currentPoint={currentPoint}
            params={params}
            optimalK={optimalK}
            onClick={handleChartClick('td')}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          Current state
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
          Capacity point
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0 border-t border-dashed border-yellow-400/60 inline-block"></span>
          Critical values
        </span>
        <span className="ml-auto text-gray-600">Click chart to set density</span>
      </div>
    </div>
  );
}

// Flow-Density (Fundamental Diagram)
function FlowDensityChart({ data, currentPoint, optimalK, maxQ, onClick }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} onClick={onClick} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
        <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="density"
          stroke="#6b7280"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Density k (veh/km/lane)', position: 'bottom', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Flow q (veh/h/lane)', angle: -90, position: 'insideLeft', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
          itemStyle={{ color: '#93c5fd' }}
          formatter={(value: number) => [value.toFixed(0) + ' veh/h/ln', 'Flow']}
          labelFormatter={(label) => `k = ${label} veh/km/ln`}
        />
        <ReferenceLine x={optimalK} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.7} />
        <ReferenceLine y={maxQ} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.7} />
        <Area type="monotone" dataKey="flow" fill="url(#flowGrad)" stroke="#3b82f6" strokeWidth={2.5} dot={false} animationDuration={500} />
        <ReferenceDot
          x={currentPoint.density}
          y={currentPoint.flow}
          r={7}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth={2}
        />
        <ReferenceDot
          x={optimalK}
          y={maxQ}
          r={5}
          fill="#fbbf24"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
        {/* Labels for critical points */}
        <ReferenceLine x={optimalK} y={0} label={{ value: 'k_m', position: 'top', fill: '#fbbf24', fontSize: 10 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Speed-Density
function SpeedDensityChart({ data, currentPoint, params, optimalK, onClick }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} onClick={onClick} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
        <defs>
          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="density"
          stroke="#6b7280"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Density k (veh/km/lane)', position: 'bottom', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          stroke="#6b7280"
          domain={[0, params.freeFlowSpeed * 1.1]}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Speed v (km/h)', angle: -90, position: 'insideLeft', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
          itemStyle={{ color: '#6ee7b7' }}
          formatter={(value: number) => [value.toFixed(1) + ' km/h', 'Speed']}
          labelFormatter={(label) => `k = ${label} veh/km/ln`}
        />
        <ReferenceLine y={params.freeFlowSpeed} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.6} />
        <ReferenceLine x={params.jamDensity} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.6} />
        <ReferenceLine x={optimalK} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.5} />
        <Area type="monotone" dataKey="speed" fill="url(#speedGrad)" stroke="#10b981" strokeWidth={2.5} dot={false} animationDuration={500} />
        <ReferenceDot
          x={currentPoint.density}
          y={currentPoint.speed}
          r={7}
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth={2}
        />
        {/* Labels */}
        <ReferenceLine y={params.freeFlowSpeed} label={{ value: 'v_f', position: 'right', fill: '#22c55e', fontSize: 10 }} />
        <ReferenceLine x={params.jamDensity} label={{ value: 'k_j', position: 'top', fill: '#ef4444', fontSize: 10 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Speed-Flow
function SpeedFlowChart({ data, currentPoint, params, maxQ, onClick }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} onClick={onClick} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
        <defs>
          <linearGradient id="sfGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="flow"
          stroke="#6b7280"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Flow q (veh/h/lane)', position: 'bottom', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          stroke="#6b7280"
          domain={[0, params.freeFlowSpeed * 1.1]}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Speed v (km/h)', angle: -90, position: 'insideLeft', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
          itemStyle={{ color: '#c4b5fd' }}
          formatter={(value: number) => [value.toFixed(1) + ' km/h', 'Speed']}
          labelFormatter={(label) => `q = ${Number(label).toFixed(0)} veh/h/ln`}
        />
        <ReferenceLine y={params.freeFlowSpeed} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
        <ReferenceLine x={maxQ} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.6} />
        <Line type="monotone" dataKey="speed" stroke="#a855f7" strokeWidth={2.5} dot={false} animationDuration={500} />
        <ReferenceDot
          x={currentPoint.flow}
          y={currentPoint.speed}
          r={7}
          fill="#a855f7"
          stroke="#ffffff"
          strokeWidth={2}
        />
        {/* Mark capacity point */}
        <ReferenceDot
          x={maxQ}
          y={params.freeFlowSpeed / 2}
          r={5}
          fill="#fbbf24"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Travel Time vs Density
function TravelTimeChart({ data, currentPoint, params, optimalK, onClick }: any) {
  const filteredData = data.filter((d: any) => d.time !== null && d.time < 180);
  const freeFlowTime = (params.roadLength / params.freeFlowSpeed) * 60;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={filteredData} onClick={onClick} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
        <defs>
          <linearGradient id="ttGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="density"
          stroke="#6b7280"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: 'Density k (veh/km/lane)', position: 'bottom', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          label={{ value: `Travel Time (min)`, angle: -90, position: 'insideLeft', offset: 5, fill: '#9ca3af', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
          itemStyle={{ color: '#fdba74' }}
          formatter={(value: number) => [value.toFixed(1) + ' min', 'Travel Time']}
          labelFormatter={(label) => `k = ${label} veh/km/ln`}
        />
        <ReferenceLine y={freeFlowTime} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.6} />
        <ReferenceLine x={optimalK} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.5} />
        <Line type="monotone" dataKey="time" stroke="#f97316" strokeWidth={2.5} dot={false} animationDuration={500} />
        <ReferenceDot
          x={currentPoint.density}
          y={currentPoint.time}
          r={7}
          fill="#f97316"
          stroke="#ffffff"
          strokeWidth={2}
        />
        {/* Labels */}
        <ReferenceLine y={freeFlowTime} label={{ value: `Free-flow (${freeFlowTime.toFixed(1)} min)`, position: 'right', fill: '#22c55e', fontSize: 9 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
