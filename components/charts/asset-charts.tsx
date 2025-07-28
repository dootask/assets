'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryStats, DepartmentStats, PurchaseYearStats, StatusStats, ValueAnalysis } from '@/lib/api/reports';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// 颜色配置
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  success: '#22c55e',
  muted: '#6b7280'
};

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#06b6d4', '#f97316', '#22c55e'
];

interface AssetCategoryChartProps {
  data: CategoryStats[];
}

export function AssetCategoryChart({ data }: AssetCategoryChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: PIE_COLORS[index % PIE_COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>资产分类分布</CardTitle>
        <CardDescription>按分类查看资产数量分布</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category_name, percentage }) => `${category_name} (${percentage.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="asset_count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value} 个资产`, 
                name === 'asset_count' ? '数量' : name
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AssetDepartmentChartProps {
  data: DepartmentStats[];
}

export function AssetDepartmentChart({ data }: AssetDepartmentChartProps) {
  const chartData = data.slice(0, 10); // 只显示前10个部门

  return (
    <Card>
      <CardHeader>
        <CardTitle>部门资产分布</CardTitle>
        <CardDescription>各部门的资产数量和价值</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="department_name" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'asset_count') return [`${value} 个`, '资产数量'];
                if (name === 'total_value') return [`¥${value.toLocaleString()}`, '总价值'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="asset_count" fill={COLORS.primary} name="资产数量" />
            <Bar yAxisId="right" dataKey="total_value" fill={COLORS.secondary} name="总价值" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AssetStatusChartProps {
  data: StatusStats[];
}

export function AssetStatusChart({ data }: AssetStatusChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    status_name: 
      item.status === 'available' ? '可用' :
      item.status === 'borrowed' ? '借用中' :
      item.status === 'maintenance' ? '维护中' :
      item.status === 'scrapped' ? '已报废' : item.status
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return COLORS.success;
      case 'borrowed': return COLORS.warning;
      case 'maintenance': return COLORS.info;
      case 'scrapped': return COLORS.danger;
      default: return COLORS.muted;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>资产状态分布</CardTitle>
        <CardDescription>不同状态资产的数量分布</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status_name, percentage }) => `${status_name} (${percentage.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} 个资产`, '数量']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AssetPurchaseTrendChartProps {
  data: PurchaseYearStats[];
}

export function AssetPurchaseTrendChart({ data }: AssetPurchaseTrendChartProps) {
  const chartData = data.sort((a, b) => a.year - b.year);

  return (
    <Card>
      <CardHeader>
        <CardTitle>资产采购趋势</CardTitle>
        <CardDescription>历年资产采购数量和价值趋势</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'count') return [`${value} 个`, '采购数量'];
                if (name === 'total_value') return [`¥${value.toLocaleString()}`, '采购价值'];
                return [value, name];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="count" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              name="采购数量"
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="total_value" 
              stroke={COLORS.secondary} 
              strokeWidth={2}
              name="采购价值"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AssetValueAnalysisChartProps {
  data: ValueAnalysis;
}

export function AssetValueAnalysisChart({ data }: AssetValueAnalysisChartProps) {
  const chartData = [
    { name: '高价值 (>¥10,000)', value: data.high_value, fill: COLORS.danger },
    { name: '中等价值 (¥1,000-¥10,000)', value: data.medium_value, fill: COLORS.warning },
    { name: '低价值 (<¥1,000)', value: data.low_value, fill: COLORS.success },
    { name: '无价值信息', value: data.no_value, fill: COLORS.muted }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>资产价值分析</CardTitle>
        <CardDescription>按价值区间分析资产分布</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value} 个资产`, '数量']}
            />
            <Bar dataKey="value" fill={COLORS.primary}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}