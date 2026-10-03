import React from 'react';
import { TrafficParams, DEFAULT_PARAMS } from '../hooks/useTrafficModel';

interface ControlsProps {
  params: TrafficParams;
  setParams: (p: TrafficParams) => void;
  density: number;
  setDensity: (k: number) => void;
  trafficState: { speed: number; flow: number; travelTime: number };
  optimalK: number;
  maxQ: number;
  speedAtMaxQ: number;
}

export default function Controls({
  params, setParams, density, setDensity, trafficState,
  optimalK, maxQ, speedAtMaxQ
}: ControlsProps) {
  const updateParam = (key: keyof TrafficParams, value: number | string) => {
    setParams({ ...params, [key]: value });
  };

  const resetDefaults = () => {
    setParams(DEFAULT_PARAMS);
    setDensity(50);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Column 1: Model + Parameters */}
      <div className="space-y-3">
        {/* Model Selection */}
        <div>
          <label className="block text-[11px] font-medium text-gray-300 mb-1.5">
            Speed-Density Model
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['greenshields', 'greenberg', 'underwood'] as const).map(model => (
              <button
                key={model}
                onClick={() => updateParam('model', model)}
                className={`px-2 py-1.5 text-[11px] font-medium rounded transition-all ${
                  params.model === model
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {model.charAt(0).toUpperCase() + model.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-1 italic">
            {params.model === 'greenshields' && 'v = v_f(1 - k/k_j) — Linear (1935)'}
            {params.model === 'greenberg' && 'v = v_m·ln(k_j/k) — Log (1959)'}
            {params.model === 'underwood' && 'v = v_f·exp(-k/k_m) — Exp (1961)'}
          </p>
        </div>

        {/* Parameters */}
        <div className="space-y-2">
          <SliderControl
            label="Free-flow Speed (v_f)"
            value={params.freeFlowSpeed}
            min={30}
            max={140}
            step={5}
            unit="km/h"
            onChange={(v) => updateParam('freeFlowSpeed', v)}
          />
          <SliderControl
            label="Jam Density (k_j)"
            value={params.jamDensity}
            min={80}
            max={250}
            step={5}
            unit="veh/km/ln"
            onChange={(v) => updateParam('jamDensity', v)}
          />
          <SliderControl
            label="Road Length"
            value={params.roadLength}
            min={1}
            max={50}
            step={1}
            unit="km"
            onChange={(v) => updateParam('roadLength', v)}
          />
          <SliderControl
            label="Number of Lanes"
            value={params.numLanes}
            min={1}
            max={6}
            step={1}
            unit="lanes"
            onChange={(v) => updateParam('numLanes', v)}
          />
        </div>
      </div>

      {/* Column 2: Density Control + Current State */}
      <div className="space-y-3">
        {/* Density Slider */}
        <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
          <label className="block text-[11px] font-medium text-gray-300 mb-1.5">
            🚗 Traffic Density (drag to change)
          </label>
          <input
            type="range"
            min={0}
            max={params.jamDensity}
            step={1}
            value={density}
            onChange={(e) => setDensity(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>0 (empty)</span>
            <span className="text-blue-400 font-bold">{density.toFixed(0)} veh/km/ln</span>
            <span>{params.jamDensity} (jam)</span>
          </div>
          {/* Density bar visualization */}
          <div className="mt-2 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(density / params.jamDensity) * 100}%`,
                background: density <= optimalK
                  ? `linear-gradient(90deg, #22c55e, #eab308)`
                  : `linear-gradient(90deg, #22c55e, #eab308, #ef4444)`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
            <span>Free flow</span>
            <span style={{ marginLeft: `${(optimalK / params.jamDensity) * 100 - 10}%` }}>▲ k_m</span>
            <span>Jam</span>
          </div>
        </div>

        {/* Current State */}
        <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
          <h4 className="text-[11px] font-semibold text-gray-300 mb-2">📊 Current State</h4>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Density" value={`${density.toFixed(1)}`} unit="veh/km/ln" color="text-blue-400" />
            <MetricBox label="Speed" value={`${trafficState.speed.toFixed(1)}`} unit="km/h" color="text-green-400" />
            <MetricBox label="Flow" value={`${trafficState.flow.toFixed(0)}`} unit="veh/h/ln" color="text-purple-400" />
            <MetricBox
              label="Travel Time"
              value={trafficState.travelTime === Infinity ? '∞' : trafficState.travelTime.toFixed(1)}
              unit={`min / ${params.roadLength}km`}
              color="text-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Column 3: Capacity + Status */}
      <div className="space-y-3">
        {/* Capacity Info */}
        <div className="bg-indigo-900/20 rounded-lg p-3 border border-indigo-800/40">
          <h4 className="text-[11px] font-semibold text-indigo-300 mb-2">⚡ Road Capacity</h4>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Max Flow (q_max)" value={`${maxQ.toFixed(0)}`} unit="veh/h/ln" color="text-yellow-400" />
            <MetricBox label="Critical Density" value={`${optimalK.toFixed(0)}`} unit="veh/km/ln" color="text-yellow-400" />
            <MetricBox label="Speed at Cap." value={`${speedAtMaxQ.toFixed(0)}`} unit="km/h" color="text-yellow-400" />
            <MetricBox
              label="Total Capacity"
              value={`${(maxQ * params.numLanes).toFixed(0)}`}
              unit={`veh/h (${params.numLanes} ln)`}
              color="text-yellow-400"
            />
          </div>
        </div>

        {/* Congestion Status */}
        <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
          <h4 className="text-[11px] font-semibold text-gray-300 mb-1.5">🚦 Traffic Condition</h4>
          <CongestionIndicator density={density} optimalK={optimalK} jamDensity={params.jamDensity} />
        </div>

        {/* Reset + References */}
        <div className="flex flex-col gap-2">
          <button
            onClick={resetDefaults}
            className="w-full px-3 py-1.5 text-[11px] font-medium bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ↺ Reset to Defaults (HCM values)
          </button>
          <div className="text-[9px] text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-500">Defaults from:</p>
            <p>• HCM 2010 (Freeway FFS=100km/h)</p>
            <p>• Greenshields (1935), Greenberg (1959)</p>
            <p>• k_j ≈ 150 veh/km/ln (avg 6.7m spacing)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <label className="text-[11px] font-medium text-gray-300">{label}</label>
        <span className="text-[11px] text-blue-400 font-mono font-bold">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg cursor-pointer"
      />
    </div>
  );
}

function MetricBox({ label, value, unit, color }: {
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="bg-gray-800/60 rounded p-2">
      <div className="text-[9px] text-gray-500">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-gray-600">{unit}</div>
    </div>
  );
}

function CongestionIndicator({ density, optimalK, jamDensity }: {
  density: number; optimalK: number; jamDensity: number;
}) {
  let status: string, color: string, emoji: string, description: string;
  const ratio = density / optimalK;

  if (density <= optimalK * 0.5) {
    status = 'Free Flow';
    color = 'text-green-400';
    emoji = '🟢';
    description = 'Vehicles travel at or near free-flow speed. No interactions.';
  } else if (density <= optimalK) {
    status = 'Stable Flow';
    color = 'text-yellow-400';
    emoji = '🟡';
    description = 'Speed begins to decrease. Flow still increasing toward capacity.';
  } else if (density <= optimalK * 1.5) {
    status = 'Unstable Flow';
    color = 'text-orange-400';
    emoji = '🟠';
    description = 'Beyond capacity. Speed drops rapidly. Flow decreasing.';
  } else {
    status = 'Congested / Jam';
    color = 'text-red-400';
    emoji = '🔴';
    description = 'Heavy congestion. Very low speeds. Approaching gridlock.';
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <div>
          <div className={`text-sm font-medium ${color}`}>{status}</div>
          <div className="text-[10px] text-gray-500">
            v/c = {ratio.toFixed(2)} | {(density / jamDensity * 100).toFixed(0)}% of jam density
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 italic">{description}</p>
    </div>
  );
}
