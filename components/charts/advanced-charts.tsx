'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart3,
    BarChart4,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useState } from 'react';
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
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

// 折线图组件
interface LineChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  title: string;
  description?: string;
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  showBrush?: boolean;
  showReferenceLine?: boolean;
  referenceValue?: number;
  referenceLabel?: string;
}

export function AdvancedLineChart({ 
  data, 
  title, 
  description, 
  dataKey, 
  xAxisKey = 'name',
  height = 300,
  showBrush = false,
  showReferenceLine = false,
  referenceValue,
  referenceLabel = '参考线'
}: LineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LineChart className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
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
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS[0], strokeWidth: 2 }}
                connectNulls={false}
              />
              {showReferenceLine && referenceValue !== undefined && (
                <ReferenceLine 
                  y={referenceValue} 
                  stroke="#ff7300" 
                  strokeDasharray="5 5"
                  label={{ value: referenceLabel, position: "topRight" }}
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 面积图组件
interface AreaChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  title: string;
  description?: string;
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  fill?: string;
  stroke?: string;
  showGradient?: boolean;
}

export function AdvancedAreaChart({ 
  data, 
  title, 
  description, 
  dataKey, 
  xAxisKey = 'name',
  height = 300,
  fill = COLORS[0],
  stroke = COLORS[0],
  showGradient = true
}: AreaChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AreaChart className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {showGradient && (
                  <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={fill} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={fill} stopOpacity={0.1}/>
                  </linearGradient>
                )}
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
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={stroke}
                fill={showGradient ? `url(#color${dataKey})` : fill}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 雷达图组件
interface RadarChartProps {
  data: Array<{ subject: string; A: number; B?: number; C?: number; [key: string]: any }>;
  title: string;
  description?: string;
  height?: number;
  dataKeys: Array<{ key: string; name: string; color: string }>;
}

export function AdvancedRadarChart({ 
  data, 
  title, 
  description, 
  height = 300,
  dataKeys
}: RadarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis dataKey="subject" stroke="#666" fontSize={12} />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                stroke="#666" 
                fontSize={12}
                tick={false}
              />
              <Radar
                name="A"
                dataKey="A"
                stroke={dataKeys[0]?.color || COLORS[0]}
                fill={dataKeys[0]?.color || COLORS[0]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
              {dataKeys[1] && (
                <Radar
                  name="B"
                  dataKey="B"
                  stroke={dataKeys[1].color}
                  fill={dataKeys[1].color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              {dataKeys[2] && (
                <Radar
                  name="C"
                  dataKey="C"
                  stroke={dataKeys[2].color}
                  fill={dataKeys[2].color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              <Legend />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 散点图组件
interface ScatterChartProps {
  data: Array<{ x: number; y: number; z?: number; name?: string; [key: string]: any }>;
  title: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  zAxisKey?: string;
  height?: number;
  color?: string;
}

export function AdvancedScatterChart({ 
  data, 
  title, 
  description, 
  xAxisKey = 'x',
  yAxisKey = 'y',
  zAxisKey = 'z',
  height = 300,
  color = COLORS[0]
}: ScatterChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart4 className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey={xAxisKey} 
                name={xAxisKey}
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="number" 
                dataKey={yAxisKey} 
                name={yAxisKey}
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Scatter 
                dataKey={yAxisKey} 
                fill={color}
                r={zAxisKey ? 6 : 4}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 高级柱状图组件
interface AdvancedBarChartProps {
  data: Array<{ [key: string]: any }>;
  title: string;
  description?: string;
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  color?: string;
  showBrush?: boolean;
}

export function AdvancedBarChart({ 
  data, 
  title, 
  description, 
  dataKey,
  xAxisKey = 'name',
  height = 300,
  color = COLORS[0],
  showBrush = false
}: AdvancedBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
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
                labelFormatter={(label) => `名称: ${label}`}
              />
              <Bar 
                dataKey={dataKey} 
                fill={color}
                radius={[4, 4, 0, 0]}
              />
              {showBrush && (
                <Brush 
                  dataKey={xAxisKey}
                  height={30}
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 组合图表组件（柱状图 + 折线图）
interface ComboChartProps {
  data: Array<{ name: string; barValue: number; lineValue: number; [key: string]: any }>;
  title: string;
  description?: string;
  barDataKey: string;
  lineDataKey: string;
  barName: string;
  lineName: string;
  height?: number;
  barColor?: string;
  lineColor?: string;
}

export function AdvancedComboChart({ 
  data, 
  title, 
  description, 
  barDataKey,
  lineDataKey,
  barName,
  lineName,
  height = 300,
  barColor = COLORS[0],
  lineColor = COLORS[1]
}: ComboChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
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
                labelFormatter={(label) => `名称: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey={barDataKey} 
                name={barName}
                fill={barColor}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey={lineDataKey} 
                name={lineName}
                stroke={lineColor}
                strokeWidth={2}
                dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: lineColor, strokeWidth: 2 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 趋势分析图表组件
interface TrendChartProps {
  data: Array<{ 
    period: string; 
    current: number; 
    previous?: number; 
    target?: number;
    [key: string]: any 
  }>;
  title: string;
  description?: string;
  height?: number;
  showComparison?: boolean;
  showTarget?: boolean;
  currentLabel?: string;
  previousLabel?: string;
  targetLabel?: string;
}

export function TrendAnalysisChart({ 
  data, 
  title, 
  description, 
  height = 300,
  showComparison = true,
  showTarget = false,
  currentLabel = '当前',
  previousLabel = '上期',
  targetLabel = '目标'
}: TrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
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
                labelFormatter={(label) => `期间: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="current"
                name={currentLabel}
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: COLORS[0], strokeWidth: 2 }}
              />
              {showComparison && data[0]?.previous !== undefined && (
                <Line
                  type="monotone"
                  dataKey="previous"
                  name={previousLabel}
                  stroke={COLORS[1]}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS[1], strokeWidth: 2, r: 4 }}
                />
              )}
              {showTarget && data[0]?.target !== undefined && (
                <Line
                  type="monotone"
                  dataKey="target"
                  name={targetLabel}
                  stroke={COLORS[2]}
                  strokeWidth={2}
                  strokeDasharray="10 5"
                  dot={{ fill: COLORS[2], strokeWidth: 2, r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 热力图组件（使用柱状图模拟）
interface HeatmapChartProps {
  data: Array<{ 
    name: string; 
    value: number; 
    category: string;
    [key: string]: any 
  }>;
  title: string;
  description?: string;
  height?: number;
  colorScale?: string[];
}

export function HeatmapChart({ 
  data, 
  title, 
  description, 
  height = 300,
  colorScale = ['#f0f0f0', '#ffeb3b', '#ff9800', '#f44336']
}: HeatmapChartProps) {
  // 计算颜色映射
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const getColor = (value: number) => {
    if (range === 0) return colorScale[0];
    const ratio = (value - minValue) / range;
    const index = Math.floor(ratio * (colorScale.length - 1));
    return colorScale[Math.min(index, colorScale.length - 1)];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
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
                labelFormatter={(label) => `名称: ${label}`}
              />
              <Bar 
                dataKey="value" 
                fill={(entry: any) => getColor(entry.value)}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
