import { useState, useCallback, useMemo } from 'react';

// Traffic flow theory parameters based on real research
// Greenshields (1935), Greenberg (1959), Underwood (1961) models
// Default values based on HCM (Highway Capacity Manual) and field measurements

export interface TrafficParams {
  freeFlowSpeed: number; // v_f in km/h (typical highway: 100-120 km/h)
  jamDensity: number; // k_j in veh/km/lane (typical: 120-180 veh/km/lane)
  roadLength: number; // km
  numLanes: number;
  model: 'greenshields' | 'greenberg' | 'underwood';
}

export interface TrafficState {
  density: number; // veh/km/lane
  speed: number; // km/h
  flow: number; // veh/h/lane
  travelTime: number; // minutes
}

// Default parameters based on real research papers:
// - Free-flow speed: 100 km/h (HCM typical freeway FFS)
// - Jam density: 150 veh/km/lane (based on average vehicle length + spacing)
// Reference: Traffic Flow Theory (May, 1990), HCM 2010
export const DEFAULT_PARAMS: TrafficParams = {
  freeFlowSpeed: 100,
  jamDensity: 150,
  roadLength: 5,
  numLanes: 3,
  model: 'greenshields',
};

// Speed-density relationship
export function speedFromDensity(k: number, params: TrafficParams): number {
  const { freeFlowSpeed: vf, jamDensity: kj, model } = params;
  if (k <= 0) return vf;
  if (k >= kj) return 0;

  switch (model) {
    case 'greenshields':
      // v = v_f * (1 - k/k_j) - Linear model (Greenshields, 1935)
      return vf * (1 - k / kj);
    case 'greenberg':
      // v = v_m * ln(k_j/k) - Logarithmic model (Greenberg, 1959)
      // v_m occurs at optimal density
      const km_greenberg = kj / Math.E;
      const vm = vf * (1 - km_greenberg / kj); // calibrate to match
      return Math.max(0, vm * Math.log(kj / k));
    case 'underwood':
      // v = v_f * exp(-k/k_m) - Exponential model (Underwood, 1961)
      const km_under = kj / Math.E;
      return vf * Math.exp(-k / km_under);
    default:
      return vf * (1 - k / kj);
  }
}

// Flow-density relationship: q = k * v
export function flowFromDensity(k: number, params: TrafficParams): number {
  if (k <= 0 || k >= params.jamDensity) return 0;
  return k * speedFromDensity(k, params);
}

// Density-flow relationship (inverse)
export function densityFromFlow(q: number, params: TrafficParams, branch: 'free' | 'congested' = 'free'): number {
  const { freeFlowSpeed: vf, jamDensity: kj, model } = params;

  if (model === 'greenshields') {
    // q = vf * k * (1 - k/kj) => quadratic in k
    // vf*kj*q = vf*kj*vf*k - vf*k^2*vf ... solve: k^2 - kj*k + q*kj/vf = 0
    const a = 1;
    const b = -kj;
    const c = (q * kj) / vf;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return 0;
    const k1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const k2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    return branch === 'free' ? Math.min(k1, k2) : Math.max(k1, k2);
  }

  // For other models, use numerical search
  let bestK = 0;
  let bestDiff = Infinity;
  for (let k = 0.1; k < kj; k += 0.5) {
    const qCalc = flowFromDensity(k, params);
    const diff = Math.abs(qCalc - q);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestK = k;
    }
  }
  return bestK;
}

// Optimal (critical) density where flow is maximized
export function optimalDensity(params: TrafficParams): number {
  const { freeFlowSpeed: vf, jamDensity: kj, model } = params;

  switch (model) {
    case 'greenshields':
      return kj / 2;
    case 'greenberg':
      return kj / Math.E;
    case 'underwood':
      return kj / Math.E;
    default:
      return kj / 2;
  }
}

// Maximum flow (capacity)
export function maxFlow(params: TrafficParams): number {
  const km = optimalDensity(params);
  return flowFromDensity(km, params);
}

// Speed at maximum flow
export function speedAtMaxFlow(params: TrafficParams): number {
  const km = optimalDensity(params);
  return speedFromDensity(km, params);
}

export function useTrafficModel() {
  const [params, setParams] = useState<TrafficParams>(DEFAULT_PARAMS);
  const [density, setDensity] = useState(50); // veh/km/lane

  const trafficState = useMemo<TrafficState>(() => {
    const speed = speedFromDensity(density, params);
    const flow = flowFromDensity(density, params);
    const travelTime = speed > 0 ? (params.roadLength / speed) * 60 : Infinity;
    return { density, speed, flow, travelTime };
  }, [density, params]);

  const updateDensity = useCallback((k: number) => {
    setDensity(Math.max(0, Math.min(params.jamDensity, k)));
  }, [params.jamDensity]);

  const updateFlow = useCallback((q: number, branch: 'free' | 'congested' = 'free') => {
    const k = densityFromFlow(q, params, branch);
    setDensity(k);
  }, [params]);

  return {
    params,
    setParams,
    density,
    setDensity: updateDensity,
    trafficState,
    updateFlow,
    optimalDensity: optimalDensity(params),
    maxFlow: maxFlow(params),
    speedAtMaxFlow: speedAtMaxFlow(params),
  };
}
