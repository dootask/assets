'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BorrowDepartmentStats,
    MonthlyBorrowStats,
    OverdueAnalysis,
    PopularAssetStats
} from '@/lib/api/reports';
import { BorrowStatus } from '@/lib/types';
import {
    Area,
    AreaChart,
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
const COLORS = [
    '#0088fe', '#00c49f', '#ffbb28', '#ff8042',
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c',
    '#8b5cf6', '#06b6d4', '#f97316', '#22c55e'
];

// 状态标签映射
const getStatusLabel = (status: BorrowStatus): string => {
  const labels = {
    borrowed: '借用中',
    returned: '已归还',
    overdue: '已逾期'
  };
  return labels[status] || status;
};

// 状态颜色映射
const getStatusColor = (status: BorrowStatus): string => {
  const colors = {
    borrowed: '#8884d8',
    returned: '#82ca9d', 
    overdue: '#ff6b6b'
  };
  return colors[status] || '#8884d8';
};

interface BorrowDepartmentChartProps {
  data: BorrowDepartmentStats[];
}

export function BorrowDepartmentChart({ data }: BorrowDepartmentChartProps) {
  const chartData = data.slice(0, 10); // 只显示前10个部门

  return (
    <Card>
      <CardHeader>
        <CardTitle>部门借用统计</CardTitle>
        <CardDescription>各部门的借用情况和超期分析</CardDescription>
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
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'borrow_count') return [`${value} 次`, '总借用'];
                if (name === 'active_count') return [`${value} 次`, '活跃借用'];
                if (name === 'overdue_count') return [`${value} 次`, '超期借用'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="borrow_count" fill={COLORS[0]} name="总借用" />
            <Bar dataKey="active_count" fill={COLORS[1]} name="活跃借用" />
            <Bar dataKey="overdue_count" fill={COLORS[3]} name="超期借用" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface OverdueAnalysisChartProps {
  data: OverdueAnalysis;
}

export function OverdueAnalysisChart({ data }: OverdueAnalysisChartProps) {
  const chartData = data.by_overdue_days;

  return (
    <Card>
      <CardHeader>
        <CardTitle>超期分析</CardTitle>
        <CardDescription>按超期天数分布的借用情况</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="days_range" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value} 次`, '超期借用']}
            />
            <Bar dataKey="count" fill={COLORS[3]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface MonthlyBorrowTrendChartProps {
  data: MonthlyBorrowStats[];
}

export function MonthlyBorrowTrendChart({ data }: MonthlyBorrowTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>借用趋势</CardTitle>
        <CardDescription>月度借用和归还趋势分析</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'borrow_count') return [`${value} 次`, '借用数量'];
                if (name === 'return_count') return [`${value} 次`, '归还数量'];
                return [value, name];
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="borrow_count" 
              stackId="1" 
              stroke={COLORS[0]} 
              fill={COLORS[0]}
              fillOpacity={0.6}
              name="借用数量"
            />
            <Area 
              type="monotone" 
              dataKey="return_count" 
              stackId="2" 
              stroke={COLORS[1]} 
              fill={COLORS[1]}
              fillOpacity={0.6}
              name="归还数量"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface PopularAssetsChartProps {
  data: PopularAssetStats[];
}

export function PopularAssetsChart({ data }: PopularAssetsChartProps) {
  const chartData = data.slice(0, 8); // 只显示前8个热门资产

  return (
    <Card>
      <CardHeader>
        <CardTitle>热门资产排行</CardTitle>
        <CardDescription>借用次数最多的资产</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="asset_name" 
              width={120}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} 次`, '借用次数']}
            />
            <Bar dataKey="borrow_count" fill={COLORS[2]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface BorrowSummaryChartProps {
  totalBorrows: number;
  activeBorrows: number;
  returnedBorrows: number;
  overdueBorrows: number;
}

export function BorrowSummaryChart({ 
  totalBorrows, 
  activeBorrows, 
  returnedBorrows, 
  overdueBorrows 
}: BorrowSummaryChartProps) {
  const chartData = [
    { name: '已归还', value: returnedBorrows, fill: COLORS[4] },
    { name: '正常借用', value: activeBorrows - overdueBorrows, fill: COLORS[0] },
    { name: '超期借用', value: overdueBorrows, fill: COLORS[3] }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>借用状态分布</CardTitle>
        <CardDescription>当前借用状态的整体分布</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${percent ? (percent * 100).toFixed(1) : '0.0'}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} 次`, '借用次数']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const BorrowTrendChart = ({ data }: { data: MonthlyBorrowStats[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="borrow_count" stroke={COLORS[0]} name="借用数量" />
      <Line type="monotone" dataKey="return_count" stroke={COLORS[1]} name="归还数量" />
    </LineChart>
  </ResponsiveContainer>
);

const BorrowStatusChart = ({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: getStatusLabel(key as BorrowStatus),
    value,
    color: getStatusColor(key as BorrowStatus)
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};