'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InventoryCategoryStats,
  InventoryDepartmentStats,
  InventoryResultAnalysis,
  InventoryTaskStats,
  InventoryTrendStats,
} from '@/lib/api/reports';
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
  YAxis,
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
  muted: '#6b7280',
};

interface InventoryResultChartProps {
  data: InventoryResultAnalysis;
}

export function InventoryResultChart({ data }: InventoryResultChartProps) {
  const chartData = [
    { name: '正常', value: data.normal_count, rate: data.normal_rate, fill: COLORS.success },
    { name: '盘盈', value: data.surplus_count, rate: data.surplus_rate, fill: COLORS.info },
    { name: '盘亏', value: data.deficit_count, rate: data.deficit_rate, fill: COLORS.warning },
    { name: '损坏', value: data.damaged_count, rate: data.damaged_rate, fill: COLORS.danger },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>盘点结果分布</CardTitle>
        <CardDescription>各种盘点结果的数量和比例</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, rate }) => `${name} (${rate.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} 个`, '资产数量']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface InventoryDepartmentChartProps {
  data: InventoryDepartmentStats[];
}

export function InventoryDepartmentChart({ data }: InventoryDepartmentChartProps) {
  const chartData = data.slice(0, 10); // 只显示前10个部门

  return (
    <Card>
      <CardHeader>
        <CardTitle>部门盘点分析</CardTitle>
        <CardDescription>各部门的盘点情况和准确率</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department_name" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'total_assets') return [`${value} 个`, '总资产'];
                if (name === 'checked_assets') return [`${value} 个`, '已检查'];
                if (name === 'accuracy_rate') return [`${value.toFixed(1)}%`, '准确率'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="total_assets" fill={COLORS.muted} name="总资产" />
            <Bar yAxisId="left" dataKey="checked_assets" fill={COLORS.primary} name="已检查" />
            <Line yAxisId="right" dataKey="accuracy_rate" stroke={COLORS.success} name="准确率" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface InventoryCategoryChartProps {
  data: InventoryCategoryStats[];
}

export function InventoryCategoryChart({ data }: InventoryCategoryChartProps) {
  const chartData = data.slice(0, 10); // 只显示前10个分类

  return (
    <Card>
      <CardHeader>
        <CardTitle>分类盘点分析</CardTitle>
        <CardDescription>各分类的盘点情况和准确率</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category_name" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'total_assets') return [`${value} 个`, '总资产'];
                if (name === 'checked_assets') return [`${value} 个`, '已检查'];
                if (name === 'accuracy_rate') return [`${value.toFixed(1)}%`, '准确率'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="total_assets" fill={COLORS.muted} name="总资产" />
            <Bar yAxisId="left" dataKey="checked_assets" fill={COLORS.primary} name="已检查" />
            <Line yAxisId="right" dataKey="accuracy_rate" stroke={COLORS.success} name="准确率" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface InventoryTrendChartProps {
  data: InventoryTrendStats[];
}

export function InventoryTrendChart({ data }: InventoryTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>盘点趋势分析</CardTitle>
        <CardDescription>月度盘点任务数量和准确率趋势</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'task_count') return [`${value} 个`, '任务数量'];
                if (name === 'accuracy_rate') return [`${value.toFixed(1)}%`, '准确率'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="task_count" fill={COLORS.primary} name="任务数量" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="accuracy_rate"
              stroke={COLORS.success}
              strokeWidth={2}
              name="准确率"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface InventoryTaskAnalysisChartProps {
  data: InventoryTaskStats[];
}

export function InventoryTaskAnalysisChart({ data }: InventoryTaskAnalysisChartProps) {
  const chartData = data.slice(0, 8); // 只显示前8个任务

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务执行分析</CardTitle>
        <CardDescription>各盘点任务的执行情况</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="task_name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'normal_count') return [`${value} 个`, '正常'];
                if (name === 'surplus_count') return [`${value} 个`, '盘盈'];
                if (name === 'deficit_count') return [`${value} 个`, '盘亏'];
                if (name === 'damaged_count') return [`${value} 个`, '损坏'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="normal_count" stackId="a" fill={COLORS.success} name="正常" />
            <Bar dataKey="surplus_count" stackId="a" fill={COLORS.info} name="盘盈" />
            <Bar dataKey="deficit_count" stackId="a" fill={COLORS.warning} name="盘亏" />
            <Bar dataKey="damaged_count" stackId="a" fill={COLORS.danger} name="损坏" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface InventoryAccuracyChartProps {
  data: InventoryDepartmentStats[];
}

export function InventoryAccuracyChart({ data }: InventoryAccuracyChartProps) {
  const chartData = data
    .filter(item => item.checked_assets > 0)
    .sort((a, b) => b.accuracy_rate - a.accuracy_rate)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>部门准确率排行</CardTitle>
        <CardDescription>各部门盘点准确率排行榜</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="department_name" width={120} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '准确率']} />
            <Bar dataKey="accuracy_rate" fill={COLORS.success} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
