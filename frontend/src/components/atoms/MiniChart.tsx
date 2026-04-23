import React from 'react';

/* ─── Types ─── */

interface DataPoint {
  value: number;
  label?: string;
}

type ChartType = 'area' | 'bar' | 'sparkline' | 'radar';

interface MiniChartProps {
  data: DataPoint[];
  type: ChartType;
  width?: number;
  height?: number;
  color?: string;
  secondaryColor?: string;
  showLabels?: boolean;
  style?: React.CSSProperties;
}

/* ─── SVG Helper Utilities ─── */

const normalizeData = (points: DataPoint[]): { normalized: number[]; min: number; max: number } => {
  if (points.length === 0) return { normalized: [], min: 0, max: 0 };
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return {
    normalized: values.map(v => (v - min) / range),
    min,
    max,
  };
};

/* ─── Area Chart (Bankroll Evolution) ─── */

const AreaChart: React.FC<{
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
}> = ({ data, width, height, color }) => {
  if (data.length < 2) return null;

  const padding = { top: 8, bottom: 4, left: 0, right: 0 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const { normalized } = normalizeData(data);

  const points = normalized.map((val, index) => ({
    x: padding.left + (index / (data.length - 1)) * chartWidth,
    y: padding.top + (1 - val) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  const gradientId = `area-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dot on last point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
    </svg>
  );
};

/* ─── Bar Chart (ROI por mercado) ─── */

const BarChart: React.FC<{
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
  secondaryColor: string;
  showLabels: boolean;
}> = ({ data, width, height, color, secondaryColor, showLabels }) => {
  if (data.length === 0) return null;

  const labelHeight = showLabels ? 18 : 0;
  const chartHeight = height - labelHeight - 4;
  const barGap = 4;
  const barWidth = Math.max(8, (width - barGap * (data.length + 1)) / data.length);
  const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((point, index) => {
        const barHeight = (Math.abs(point.value) / maxValue) * chartHeight;
        const x = barGap + index * (barWidth + barGap);
        const y = chartHeight - barHeight;
        const isPositive = point.value >= 0;

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill={isPositive ? color : secondaryColor}
              opacity={0.85}
            />
            {showLabels && point.label && (
              <text
                x={x + barWidth / 2}
                y={height - 2}
                textAnchor="middle"
                fill="var(--color-text-secondary)"
                fontSize="8"
                fontWeight="600"
              >
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Sparkline (tendencia inline) ─── */

const SparklineChart: React.FC<{
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
}> = ({ data, width, height, color }) => {
  if (data.length < 2) return null;

  const { normalized } = normalizeData(data);
  const points = normalized.map((val, index) => ({
    x: (index / (data.length - 1)) * width,
    y: 2 + (1 - val) * (height - 4),
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/* ─── Radar Chart (rendimiento por mercado) ─── */

const RadarChart: React.FC<{
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
}> = ({ data, width, height, color }) => {
  if (data.length < 3) return null;

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(cx, cy) - 20;
  const { normalized } = normalizeData(data);
  const angleStep = (2 * Math.PI) / data.length;

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data polygon
  const dataPoints = normalized.map((val, index) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * val * maxRadius,
      y: cy + Math.sin(angle) * val * maxRadius,
    };
  });


  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid */}
      {rings.map((r) => {
        const ringPoints = data.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          return `${cx + Math.cos(angle) * r * maxRadius},${cy + Math.sin(angle) * r * maxRadius}`;
        });
        return (
          <polygon
            key={r}
            points={ringPoints.join(' ')}
            fill="none"
            stroke="var(--color-surface-borders)"
            strokeWidth="0.5"
            opacity={0.5}
          />
        );
      })}

      {/* Axes */}
      {data.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        return (
          <line
            key={index}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * maxRadius}
            y2={cy + Math.sin(angle) * maxRadius}
            stroke="var(--color-surface-borders)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        );
      })}

      {/* Data */}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={color} fillOpacity={0.15} stroke={color} strokeWidth="1.5" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}

      {/* Labels */}
      {data.map((point, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 14;
        return (
          <text
            key={index}
            x={cx + Math.cos(angle) * labelRadius}
            y={cy + Math.sin(angle) * labelRadius}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-text-secondary)"
            fontSize="8"
            fontWeight="600"
          >
            {point.label || ''}
          </text>
        );
      })}
    </svg>
  );
};

/* ─── Main Component ─── */

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  type,
  width = 200,
  height = 80,
  color = 'var(--color-primary)',
  secondaryColor = 'var(--color-danger)',
  showLabels = false,
  style,
}) => {
  if (data.length === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Sin datos</span>
      </div>
    );
  }

  const chartMap: Record<ChartType, React.ReactNode> = {
    area: <AreaChart data={data} width={width} height={height} color={color} />,
    bar: <BarChart data={data} width={width} height={height} color={color} secondaryColor={secondaryColor} showLabels={showLabels} />,
    sparkline: <SparklineChart data={data} width={width} height={height} color={color} />,
    radar: <RadarChart data={data} width={width} height={height} color={color} />,
  };

  return <div style={{ lineHeight: 0, ...style }}>{chartMap[type]}</div>;
};
