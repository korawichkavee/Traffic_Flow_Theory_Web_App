import React, { useEffect, useRef, useState } from 'react';
import { TrafficState, TrafficParams } from '../hooks/useTrafficModel';

interface TrafficRoadProps {
  trafficState: TrafficState;
  params: TrafficParams;
}

interface Car {
  id: number;
  x: number;
  lane: number;
  speed: number;
  color: string;
  length: number;
}

const CAR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#d35400', '#c0392b',
  '#2980b9', '#27ae60', '#8e44ad', '#16a085', '#f1c40f',
  '#e84393', '#00b894', '#fdcb6e', '#6c5ce7', '#fab1a0',
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function TrafficRoad({ trafficState, params }: TrafficRoadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carsRef = useRef<Car[]>([]);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

  // Initialize/reset cars based on density
  useEffect(() => {
    const numCars = Math.round(trafficState.density * params.roadLength * params.numLanes);
    const cars: Car[] = [];
    for (let i = 0; i < numCars; i++) {
      cars.push({
        id: i,
        x: Math.random() * dimensions.width,
        lane: i % params.numLanes,
        speed: trafficState.speed * (0.85 + Math.random() * 0.3),
        color: CAR_COLORS[i % CAR_COLORS.length],
        length: 18 + Math.random() * 12,
      });
    }
    carsRef.current = cars;
  }, [trafficState.density, trafficState.speed, params.roadLength, params.numLanes, dimensions.width]);

  // Update car speeds when traffic state changes
  useEffect(() => {
    carsRef.current.forEach(car => {
      car.speed = trafficState.speed * (0.85 + Math.random() * 0.3);
    });
  }, [trafficState.speed]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0;
      lastTimeRef.current = time;

      // Update car positions
      const scale = dimensions.width / params.roadLength; // pixels per km
      carsRef.current.forEach(car => {
        const pixelsPerSec = (car.speed / 3600) * scale;
        car.x += pixelsPerSec * dt;
        if (car.x > dimensions.width + 60) {
          car.x = -60;
        }
      });

      // Draw
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      drawRoad(ctx, dimensions.width, dimensions.height, params.numLanes);
      drawCars(ctx, carsRef.current, dimensions.height, params.numLanes);
      drawOverlay(ctx, trafficState, dimensions.width, params.freeFlowSpeed);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [trafficState, params.numLanes, params.roadLength, params.freeFlowSpeed, dimensions]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (canvasRef.current?.parentElement) {
      observer.observe(canvasRef.current.parentElement);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[200px] relative bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}

function drawRoad(ctx: CanvasRenderingContext2D, width: number, height: number, numLanes: number) {
  const roadTop = height * 0.2;
  const roadBottom = height * 0.8;
  const roadHeight = roadBottom - roadTop;
  const laneHeight = roadHeight / numLanes;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, roadTop);
  skyGrad.addColorStop(0, '#1a365d');
  skyGrad.addColorStop(1, '#2d3748');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, roadTop);

  // Ground (below road)
  const groundGrad = ctx.createLinearGradient(0, roadBottom, 0, height);
  groundGrad.addColorStop(0, '#2d3748');
  groundGrad.addColorStop(1, '#1a202c');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, roadBottom, width, height - roadBottom);

  // Grass strips
  ctx.fillStyle = '#276749';
  ctx.fillRect(0, roadTop - 8, width, 8);
  ctx.fillRect(0, roadBottom, width, 8);

  // Road surface
  const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  roadGrad.addColorStop(0, '#2d2d2d');
  roadGrad.addColorStop(0.5, '#3d3d3d');
  roadGrad.addColorStop(1, '#2d2d2d');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, roadTop, width, roadHeight);

  // Road edges (solid white lines)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, roadTop);
  ctx.lineTo(width, roadTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, roadBottom);
  ctx.lineTo(width, roadBottom);
  ctx.stroke();

  // Lane markings (dashed)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([25, 20]);
  for (let i = 1; i < numLanes; i++) {
    const y = roadTop + i * laneHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCars(ctx: CanvasRenderingContext2D, cars: Car[], height: number, numLanes: number) {
  const roadTop = height * 0.2;
  const roadBottom = height * 0.8;
  const roadHeight = roadBottom - roadTop;
  const laneHeight = roadHeight / numLanes;
  const carHeight = Math.min(laneHeight * 0.55, 28);

  cars.forEach(car => {
    const y = roadTop + car.lane * laneHeight + (laneHeight - carHeight) / 2;
    const x = car.x - car.length / 2;

    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    roundRect(ctx, x + 2, y + 2, car.length, carHeight, 4);
    ctx.fill();

    // Car body
    ctx.fillStyle = car.color;
    roundRect(ctx, x, y, car.length, carHeight, 4);
    ctx.fill();

    // Car roof (lighter shade)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    roundRect(ctx, x + car.length * 0.25, y + 2, car.length * 0.35, carHeight - 4, 2);
    ctx.fill();

    // Windshield
    ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
    ctx.fillRect(x + car.length * 0.65, y + 3, car.length * 0.15, carHeight - 6);

    // Headlights
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.fillRect(x + car.length - 3, y + 3, 3, 3);
    ctx.fillRect(x + car.length - 3, y + carHeight - 6, 3, 3);

    // Taillights
    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.fillRect(x, y + 3, 2, 3);
    ctx.fillRect(x, y + carHeight - 6, 2, 3);
  });
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: TrafficState, width: number, freeFlowSpeed: number) {
  // Info panel background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  roundRect(ctx, 10, 10, 190, 85, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  roundRect(ctx, 10, 10, 190, 85, 8);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText(`k = ${state.density.toFixed(1)} veh/km/ln`, 20, 32);
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`v = ${state.speed.toFixed(1)} km/h`, 20, 49);
  ctx.fillStyle = '#a78bfa';
  ctx.fillText(`q = ${state.flow.toFixed(0)} veh/h/ln`, 20, 66);
  ctx.fillStyle = '#fb923c';
  ctx.fillText(`t = ${state.travelTime === Infinity ? '∞' : state.travelTime.toFixed(1) + ' min'}`, 20, 83);

  // Speed bar (top right)
  const barWidth = 120;
  const barHeight = 10;
  const barX = width - barWidth - 20;
  const barY = 18;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  roundRect(ctx, barX - 10, barY - 12, barWidth + 20, 45, 8);
  ctx.fill();

  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px sans-serif';
  ctx.fillText('Speed Ratio', barX, barY);

  // Background bar
  ctx.fillStyle = '#374151';
  roundRect(ctx, barX, barY + 6, barWidth, barHeight, 4);
  ctx.fill();

  // Speed fill
  const speedRatio = Math.max(0, Math.min(1, state.speed / freeFlowSpeed));
  const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  gradient.addColorStop(0, '#ef4444');
  gradient.addColorStop(0.4, '#f59e0b');
  gradient.addColorStop(1, '#22c55e');
  ctx.fillStyle = gradient;
  roundRect(ctx, barX, barY + 6, barWidth * speedRatio, barHeight, 4);
  ctx.fill();

  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`${(speedRatio * 100).toFixed(0)}%`, barX + barWidth + 5, barY + 15);
}
