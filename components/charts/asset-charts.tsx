'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// 资产分类图表组件
export function AssetCategoryChart({ data }: { data: Array<{ category_name: string; asset_count: number; percentage: number }> }) {
  const chartData = data.map((item, index) => ({
    name: item.category_name,
    value: item.asset_count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="mr-2 h-5 w-5" />
          按分类统计
        </CardTitle>
        <CardDescription>资产分类分布饼图</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, '数量']} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 资产部门图表组件
export function AssetDepartmentChart({ data }: { data: Array<{ department_name: string; asset_count: number; total_value: number }> }) {
  const chartData = data.map((item, index) => ({
    name: item.department_name,
    assets: item.asset_count,
    value: Math.round(item.total_value / 10000), // 转换为万元
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          按部门统计
        </CardTitle>
        <CardDescription>各部门资产数量和价值对比</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, assets }) => `${name}: ${assets}个`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="assets"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'assets') return [value, '资产数量'];
                  return [value, name];
                }}
                labelFormatter={(label) => `部门: ${label}`}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 资产状态图表组件
export function AssetStatusChart({ data }: { data: Array<{ status: string; count: number; percentage: number }> }) {
  const statusMap = {
    available: '可用',
    borrowed: '借用中',
    maintenance: '维护中',
    scrapped: '已报废',
  };

  const chartData = data.map((item, index) => ({
    name: statusMap[item.status as keyof typeof statusMap] || item.status,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="mr-2 h-5 w-5" />
          资产状态分布
        </CardTitle>
        <CardDescription>不同状态资产的分布情况</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, '数量']} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 资产价值分析图表组件
export function AssetValueAnalysisChart({ data }: { data: { high_value: number; medium_value: number; low_value: number; no_value: number } }) {
  const chartData = [
    { name: '高价值资产 (>¥10,000)', value: data.high_value, color: '#FF6B6B' },
    { name: '中等价值资产 (¥1,000-¥10,000)', value: data.medium_value, color: '#4ECDC4' },
    { name: '低价值资产 (<¥1,000)', value: data.low_value, color: '#45B7D1' },
    { name: '无价值信息', value: data.no_value, color: '#96CEB4' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          价值分析
        </CardTitle>
        <CardDescription>按价值区间分析资产分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${value}个`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, '数量']} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 资产采购趋势图表组件
export function AssetPurchaseTrendChart({ data }: { data: Array<{ year: number; count: number; total_value: number }> }) {
  const chartData = data.map(item => ({
    year: item.year.toString(),
    count: item.count,
    value: Math.round(item.total_value / 10000), // 转换为万元
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          采购趋势
        </CardTitle>
        <CardDescription>历年资产采购数量和价值趋势</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ year, count }) => `${year}年: ${count}个`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'count') return [value, '采购数量'];
                  if (name === 'value') return [`¥${value}万`, '采购价值'];
                  return [value, name];
                }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
