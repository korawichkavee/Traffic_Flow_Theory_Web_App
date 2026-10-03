import React, { useState } from 'react';
import { useTrafficModel } from './hooks/useTrafficModel';
import TrafficRoad from './components/TrafficRoad';
import FundamentalDiagrams from './components/FundamentalDiagrams';
import Controls from './components/Controls';

export default function App() {
  const {
    params, setParams, density, setDensity, trafficState,
    optimalDensity, maxFlow, speedAtMaxFlow
  } = useTrafficModel();

  const [showInfo, setShowInfo] = useState(false);
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800/90 border-b border-gray-700 px-4 py-2 flex items-center justify-between backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚗</div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Traffic Flow Theory</h1>
            <p className="text-[11px] text-gray-400">Interactive Fundamental Diagrams & Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showControls ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ⚙️ Controls
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showInfo ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ℹ️ Theory
          </button>
        </div>
      </header>

      {/* Theory Info Panel */}
      {showInfo && (
        <div className="bg-gray-800/95 border-b border-gray-700 px-4 py-3 shrink-0 z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <h3 className="font-bold text-blue-400 mb-1">Fundamental Equation</h3>
              <p className="text-gray-300 mb-1 font-mono text-sm">q = k × v</p>
              <p className="text-gray-400">
                Flow (q) = Density (k) × Speed (v). The core relationship in traffic flow theory.
              </p>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <h3 className="font-bold text-green-400 mb-1">Key Parameters</h3>
              <ul className="text-gray-400 space-y-0.5">
                <li>• <b className="text-green-300">v_f</b>: Free-flow speed (no congestion)</li>
                <li>• <b className="text-green-300">k_j</b>: Jam density (gridlock)</li>
                <li>• <b className="text-green-300">q_max</b>: Road capacity</li>
                <li>• <b className="text-green-300">k_m</b>: Critical density at capacity</li>
              </ul>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <h3 className="font-bold text-purple-400 mb-1">Speed-Density Models</h3>
              <ul className="text-gray-400 space-y-0.5">
                <li>• <b>Greenshields</b>: Linear v = v_f(1-k/k_j)</li>
                <li>• <b>Greenberg</b>: Logarithmic v = v_m·ln(k_j/k)</li>
                <li>• <b>Underwood</b>: Exponential v = v_f·e^(-k/k_m)</li>
              </ul>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <h3 className="font-bold text-orange-400 mb-1">How to Interact</h3>
              <ul className="text-gray-400 space-y-0.5">
                <li>• Click/drag on charts to set density</li>
                <li>• Use sliders to adjust parameters</li>
                <li>• Watch the road respond in real-time</li>
                <li>• Compare model behaviors</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Side - Road Visualization */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-700 max-h-[40vh] lg:max-h-none">
          {/* Road Header */}
          <div className="px-4 py-2 bg-gray-800/40 border-b border-gray-700/50 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-200">🛣️ Road Simulation</h2>
                <p className="text-[10px] text-gray-500">
                  {params.numLanes} lane{params.numLanes > 1 ? 's' : ''} × {params.roadLength} km | 
                  Model: {params.model.charAt(0).toUpperCase() + params.model.slice(1)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Regime</div>
                  <div className={`text-xs font-bold ${density <= optimalDensity ? 'text-green-400' : 'text-red-400'}`}>
                    {density <= optimalDensity ? '● Free Flow' : '● Congested'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">LOS</div>
                  <div className={`text-xs font-bold ${getLOSColor(density, optimalDensity)}`}>
                    {getLOS(density, optimalDensity)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Road Canvas */}
          <div className="flex-1 p-2 min-h-0">
            <TrafficRoad trafficState={trafficState} params={params} />
          </div>

          {/* Quick Stats Bar */}
          <div className="px-4 py-2 bg-gray-800/40 border-t border-gray-700/50 grid grid-cols-5 gap-2 shrink-0">
            <QuickStat label="Density (k)" value={`${density.toFixed(1)}`} unit="veh/km/ln" color="text-blue-400" />
            <QuickStat label="Speed (v)" value={`${trafficState.speed.toFixed(1)}`} unit="km/h" color="text-green-400" />
            <QuickStat label="Flow (q)" value={`${trafficState.flow.toFixed(0)}`} unit="veh/h/ln" color="text-purple-400" />
            <QuickStat label="Space Hdw" value={`${(1000/Math.max(density,0.1)).toFixed(1)}`} unit="m" color="text-cyan-400" />
            <QuickStat label="Time Hdw" value={trafficState.flow > 0 ? `${(3600/trafficState.flow).toFixed(1)}` : '∞'} unit="sec" color="text-orange-400" />
          </div>
        </div>

        {/* Right Side - Charts + Controls */}
        <div className={`flex flex-col min-w-0 flex-1 lg:flex-none ${showControls ? 'lg:w-[55%]' : 'lg:w-full'}`}>
          {/* Charts */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-2 bg-gray-800/40 border-b border-gray-700/50 shrink-0">
              <h2 className="text-sm font-semibold text-gray-200">📈 Fundamental Diagrams</h2>
              <p className="text-[10px] text-gray-500">Click on chart to set density | Blue dot = current state | Yellow = capacity</p>
            </div>
            <div className="flex-1 p-3 min-h-[200px]">
              <FundamentalDiagrams
                params={params}
                trafficState={trafficState}
                onDensityChange={setDensity}
                optimalK={optimalDensity}
                maxQ={maxFlow}
                speedAtMaxQ={speedAtMaxFlow}
              />
            </div>
          </div>

          {/* Controls Panel */}
          {showControls && (
            <div className="shrink-0 border-t border-gray-700 bg-gray-800/60 max-h-[40vh] lg:max-h-[45vh] overflow-y-auto">
              <div className="px-4 py-3">
                <Controls
                  params={params}
                  setParams={setParams}
                  density={density}
                  setDensity={setDensity}
                  trafficState={trafficState}
                  optimalK={optimalDensity}
                  maxQ={maxFlow}
                  speedAtMaxQ={speedAtMaxFlow}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[9px] text-gray-600">{unit}</div>
    </div>
  );
}

function getLOS(density: number, optimalK: number): string {
  const ratio = density / optimalK;
  if (ratio <= 0.4) return 'A';
  if (ratio <= 0.6) return 'B';
  if (ratio <= 0.8) return 'C';
  if (ratio <= 1.0) return 'D';
  if (ratio <= 1.3) return 'E';
  return 'F';
}

function getLOSColor(density: number, optimalK: number): string {
  const ratio = density / optimalK;
  if (ratio <= 0.4) return 'text-green-400';
  if (ratio <= 0.6) return 'text-green-300';
  if (ratio <= 0.8) return 'text-yellow-400';
  if (ratio <= 1.0) return 'text-yellow-300';
  if (ratio <= 1.3) return 'text-orange-400';
  return 'text-red-400';
}
