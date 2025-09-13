'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Download,
    Maximize2,
    Minimize2,
    RotateCcw,
    X,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Brush,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

// 交互式图表基础组件
interface InteractiveChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  description?: string;
  height?: number;
  children: React.ReactNode;
  onDataPointClick?: (data: any) => void;
  onDataPointHover?: (data: any) => void;
  exportable?: boolean;
  zoomable?: boolean;
  filterable?: boolean;
  onExport?: () => void;
}

export function InteractiveChart({
  data,
  title,
  description,
  height = 400,
  children,
  onDataPointClick,
  onDataPointHover,
  exportable = true,
  zoomable = true,
  filterable = true,
  onExport
}: InteractiveChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedData, setSelectedData] = useState<any[]>(data);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number } | null>(null);

  // 处理缩放
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setBrushRange(null);
    setSelectedData(data);
  }, [data]);

  // 处理全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // 处理数据点点击
  const handleDataPointClick = useCallback((data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  }, [onDataPointClick]);

  // 处理数据点悬停
  const handleDataPointHover = useCallback((data: any) => {
    if (onDataPointHover) {
      onDataPointHover(data);
    }
  }, [onDataPointHover]);

  // 处理系列显示/隐藏
  const toggleSeries = useCallback((seriesKey: string) => {
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesKey)) {
        newSet.delete(seriesKey);
      } else {
        newSet.add(seriesKey);
      }
      return newSet;
    });
  }, []);

  // 处理导出
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    } else {
      // 默认导出为PNG
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${title}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  }, [onExport, title]);

  // 处理刷选范围变化
  const handleBrushChange = useCallback((range: { startIndex: number; endIndex: number } | null) => {
    setBrushRange(range);
    if (range) {
      setSelectedData(data.slice(range.startIndex, range.endIndex + 1));
    } else {
      setSelectedData(data);
    }
  }, [data]);

  const chartHeight = isFullscreen ? window.innerHeight - 200 : height;

  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {zoomable && (
              <>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {React.cloneElement(children as React.ReactElement, {
              ...(children as any).props,
              onDataPointClick: handleDataPointClick,
              onDataPointHover: handleDataPointHover,
              hiddenSeries,
              zoomLevel,
              brushRange,
              onBrushChange: handleBrushChange
            })}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 交互式折线图
interface InteractiveLineChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  description?: string;
  height?: number;
  dataKeys: Array<{ key: string; name: string; color: string }>;
  xAxisKey: string;
  onDataPointClick?: (data: any) => void;
  onDataPointHover?: (data: any) => void;
  showBrush?: boolean;
  showReferenceLine?: boolean;
  referenceValue?: number;
  referenceLabel?: string;
}

export function InteractiveLineChart({
  data,
  title,
  description,
  height = 400,
  dataKeys,
  xAxisKey,
  onDataPointClick,
  onDataPointHover,
  showBrush = true,
  showReferenceLine = false,
  referenceValue,
  referenceLabel = '参考线'
}: InteractiveLineChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleDataPointClick = useCallback((data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  }, [onDataPointClick]);

  const handleDataPointHover = useCallback((data: any) => {
    if (onDataPointHover) {
      onDataPointHover(data);
    }
  }, [onDataPointHover]);

  return (
    <InteractiveChart
      data={data}
      title={title}
      description={description}
      height={height}
      onDataPointClick={handleDataPointClick}
      onDataPointHover={handleDataPointHover}
    >
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#666"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={(label) => `${xAxisKey}: ${label}`}
        />
        <Legend />
        {dataKeys.map(({ key, name, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            connectNulls={false}
            hide={hiddenSeries.has(key)}
          />
        ))}
        {showReferenceLine && referenceValue !== undefined && (
          <ReferenceLine 
            y={referenceValue} 
            stroke="#ff7300" 
            strokeDasharray="5 5"
            label={{ value: referenceLabel, position: "top" }}
          />
        )}
        {showBrush && (
          <Brush 
            dataKey={xAxisKey}
            height={30}
            stroke={COLORS[0]}
            fill="rgba(0, 136, 254, 0.1)"
          />
        )}
      </LineChart>
    </InteractiveChart>
  );
}

// 交互式柱状图
interface InteractiveBarChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  description?: string;
  height?: number;
  dataKeys: Array<{ key: string; name: string; color: string }>;
  xAxisKey: string;
  onDataPointClick?: (data: any) => void;
  onDataPointHover?: (data: any) => void;
  showBrush?: boolean;
  stacked?: boolean;
}

export function InteractiveBarChart({
  data,
  title,
  description,
  height = 400,
  dataKeys,
  xAxisKey,
  onDataPointClick,
  onDataPointHover,
  showBrush = true,
  stacked = false
}: InteractiveBarChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleDataPointClick = useCallback((data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  }, [onDataPointClick]);

  const handleDataPointHover = useCallback((data: any) => {
    if (onDataPointHover) {
      onDataPointHover(data);
    }
  }, [onDataPointHover]);

  return (
    <InteractiveChart
      data={data}
      title={title}
      description={description}
      height={height}
      onDataPointClick={handleDataPointClick}
      onDataPointHover={handleDataPointHover}
    >
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#666"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={(label) => `${xAxisKey}: ${label}`}
        />
        <Legend />
        {dataKeys.map(({ key, name, color }) => (
          <Bar
            key={key}
            dataKey={key}
            name={name}
            fill={color}
            radius={[4, 4, 0, 0]}
            hide={hiddenSeries.has(key)}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
        {showBrush && (
          <Brush 
            dataKey={xAxisKey}
            height={30}
            stroke={COLORS[0]}
            fill="rgba(0, 136, 254, 0.1)"
          />
        )}
      </BarChart>
    </InteractiveChart>
  );
}

// 交互式面积图
interface InteractiveAreaChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  description?: string;
  height?: number;
  dataKeys: Array<{ key: string; name: string; color: string }>;
  xAxisKey: string;
  onDataPointClick?: (data: any) => void;
  onDataPointHover?: (data: any) => void;
  showBrush?: boolean;
  stacked?: boolean;
}

export function InteractiveAreaChart({
  data,
  title,
  description,
  height = 400,
  dataKeys,
  xAxisKey,
  onDataPointClick,
  onDataPointHover,
  showBrush = true,
  stacked = false
}: InteractiveAreaChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleDataPointClick = useCallback((data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  }, [onDataPointClick]);

  const handleDataPointHover = useCallback((data: any) => {
    if (onDataPointHover) {
      onDataPointHover(data);
    }
  }, [onDataPointHover]);

  return (
    <InteractiveChart
      data={data}
      title={title}
      description={description}
      height={height}
      onDataPointClick={handleDataPointClick}
      onDataPointHover={handleDataPointHover}
    >
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map(({ key, color }) => (
            <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          ))}
        </defs>
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#666"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={(label) => `${xAxisKey}: ${label}`}
        />
        <Legend />
        {dataKeys.map(({ key, name, color }) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color}
            fill={`url(#color${key})`}
            strokeWidth={2}
            hide={hiddenSeries.has(key)}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
        {showBrush && (
          <Brush 
            dataKey={xAxisKey}
            height={30}
            stroke={COLORS[0]}
            fill="rgba(0, 136, 254, 0.1)"
          />
        )}
      </AreaChart>
    </InteractiveChart>
  );
}

// 数据点详情组件
interface DataPointDetailsProps {
  data: any;
  visible: boolean;
  onClose: () => void;
}

export function DataPointDetails({ data, visible, onClose }: DataPointDetailsProps) {
  if (!visible || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">数据点详情</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium">{key}:</span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
