'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    BarChart3,
    LineChart,
    Palette,
    PieChart,
    Settings,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useCallback, useState } from 'react';

// 图表配置接口
export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'radar' | 'combo';
  title: string;
  description?: string;
  height: number;
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  showBrush: boolean;
  showReferenceLine: boolean;
  referenceValue?: number;
  referenceLabel?: string;
  colors: string[];
  dataKeys: Array<{ key: string; name: string; color: string; visible: boolean }>;
  xAxisKey: string;
  stacked: boolean;
  smooth: boolean;
  showDataLabels: boolean;
  animation: boolean;
  gradient: boolean;
}

// 默认配置
const defaultConfig: ChartConfig = {
  type: 'line',
  title: '图表标题',
  description: '图表描述',
  height: 300,
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  showBrush: false,
  showReferenceLine: false,
  colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'],
  dataKeys: [],
  xAxisKey: 'name',
  stacked: false,
  smooth: true,
  showDataLabels: false,
  animation: true,
  gradient: true
};

// 图表类型选项
const chartTypes = [
  { value: 'line', label: '折线图', icon: LineChart },
  { value: 'bar', label: '柱状图', icon: BarChart3 },
  { value: 'area', label: '面积图', icon: TrendingUp },
  { value: 'pie', label: '饼图', icon: PieChart },
  { value: 'scatter', label: '散点图', icon: Zap },
  { value: 'radar', label: '雷达图', icon: Settings },
  { value: 'combo', label: '组合图', icon: BarChart3 },
];

// 预设颜色方案
const colorSchemes = [
  { name: '默认', colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'] },
  { name: '商务', colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'] },
  { name: '活力', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'] },
  { name: '专业', colors: ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12', '#27AE60', '#9B59B6'] },
  { name: '柔和', colors: ['#FFB6C1', '#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD', '#F5DEB3'] },
];

interface ChartConfigPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
}

export function ChartConfigPanel({
  config,
  onConfigChange,
  onReset,
  onApply,
  className
}: ChartConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  // 更新数据键
  const updateDataKey = useCallback((index: number, updates: Partial<{ key: string; name: string; color: string; visible: boolean }>) => {
    const newDataKeys = [...config.dataKeys];
    newDataKeys[index] = { ...newDataKeys[index], ...updates };
    updateConfig({ dataKeys: newDataKeys });
  }, [config.dataKeys, updateConfig]);

  // 添加数据键
  const addDataKey = useCallback(() => {
    const newDataKey = {
      key: `value${config.dataKeys.length + 1}`,
      name: `数据${config.dataKeys.length + 1}`,
      color: config.colors[config.dataKeys.length % config.colors.length],
      visible: true
    };
    updateConfig({ dataKeys: [...config.dataKeys, newDataKey] });
  }, [config.dataKeys, config.colors, updateConfig]);

  // 删除数据键
  const removeDataKey = useCallback((index: number) => {
    const newDataKeys = config.dataKeys.filter((_, i) => i !== index);
    updateConfig({ dataKeys: newDataKeys });
  }, [config.dataKeys, updateConfig]);

  // 应用颜色方案
  const applyColorScheme = useCallback((scheme: typeof colorSchemes[0]) => {
    updateConfig({ colors: scheme.colors });
  }, [updateConfig]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              图表配置
            </CardTitle>
            <CardDescription>
              自定义图表外观和行为
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '收起' : '展开'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* 基础设置 */}
          <div className="space-y-4">
            <h4 className="font-medium">基础设置</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chart-type">图表类型</Label>
                <Select
                  value={config.type}
                  onValueChange={(value: ChartConfig['type']) => updateConfig({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择图表类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-height">图表高度</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[config.height]}
                    onValueChange={([value]) => updateConfig({ height: value })}
                    min={200}
                    max={800}
                    step={50}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {config.height}px
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-title">图表标题</Label>
              <Input
                id="chart-title"
                value={config.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                placeholder="输入图表标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-description">图表描述</Label>
              <Input
                id="chart-description"
                value={config.description || ''}
                onChange={(e) => updateConfig({ description: e.target.value })}
                placeholder="输入图表描述（可选）"
              />
            </div>
          </div>

          {/* 显示选项 */}
          <div className="space-y-4">
            <h4 className="font-medium">显示选项</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-legend"
                  checked={config.showLegend}
                  onCheckedChange={(checked) => updateConfig({ showLegend: checked })}
                />
                <Label htmlFor="show-legend">显示图例</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-grid"
                  checked={config.showGrid}
                  onCheckedChange={(checked) => updateConfig({ showGrid: checked })}
                />
                <Label htmlFor="show-grid">显示网格</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-tooltip"
                  checked={config.showTooltip}
                  onCheckedChange={(checked) => updateConfig({ showTooltip: checked })}
                />
                <Label htmlFor="show-tooltip">显示提示</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-brush"
                  checked={config.showBrush}
                  onCheckedChange={(checked) => updateConfig({ showBrush: checked })}
                />
                <Label htmlFor="show-brush">显示刷选</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-reference-line"
                  checked={config.showReferenceLine}
                  onCheckedChange={(checked) => updateConfig({ showReferenceLine: checked })}
                />
                <Label htmlFor="show-reference-line">显示参考线</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="stacked"
                  checked={config.stacked}
                  onCheckedChange={(checked) => updateConfig({ stacked: checked })}
                />
                <Label htmlFor="stacked">堆叠显示</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smooth"
                  checked={config.smooth}
                  onCheckedChange={(checked) => updateConfig({ smooth: checked })}
                />
                <Label htmlFor="smooth">平滑曲线</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-data-labels"
                  checked={config.showDataLabels}
                  onCheckedChange={(checked) => updateConfig({ showDataLabels: checked })}
                />
                <Label htmlFor="show-data-labels">显示数据标签</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="animation"
                  checked={config.animation}
                  onCheckedChange={(checked) => updateConfig({ animation: checked })}
                />
                <Label htmlFor="animation">动画效果</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="gradient"
                  checked={config.gradient}
                  onCheckedChange={(checked) => updateConfig({ gradient: checked })}
                />
                <Label htmlFor="gradient">渐变填充</Label>
              </div>
            </div>
          </div>

          {/* 参考线设置 */}
          {config.showReferenceLine && (
            <div className="space-y-4">
              <h4 className="font-medium">参考线设置</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference-value">参考值</Label>
                  <Input
                    id="reference-value"
                    type="number"
                    value={config.referenceValue || ''}
                    onChange={(e) => updateConfig({ referenceValue: parseFloat(e.target.value) || undefined })}
                    placeholder="输入参考值"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference-label">参考标签</Label>
                  <Input
                    id="reference-label"
                    value={config.referenceLabel || ''}
                    onChange={(e) => updateConfig({ referenceLabel: e.target.value })}
                    placeholder="输入参考标签"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 颜色方案 */}
          <div className="space-y-4">
            <h4 className="font-medium">颜色方案</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {colorSchemes.map((scheme) => (
                <div
                  key={scheme.name}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => applyColorScheme(scheme)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4" />
                    <span className="font-medium">{scheme.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {scheme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 数据键配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">数据系列</h4>
              <Button variant="outline" size="sm" onClick={addDataKey}>
                添加系列
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.dataKeys.map((dataKey, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">系列 {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDataKey(index)}
                    >
                      删除
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>数据键</Label>
                      <Input
                        value={dataKey.key}
                        onChange={(e) => updateDataKey(index, { key: e.target.value })}
                        placeholder="数据键名"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>显示名称</Label>
                      <Input
                        value={dataKey.name}
                        onChange={(e) => updateDataKey(index, { name: e.target.value })}
                        placeholder="显示名称"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>颜色</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={dataKey.color}
                          onChange={(e) => updateDataKey(index, { color: e.target.value })}
                          className="w-12 h-9 p-1"
                        />
                        <span className="text-sm text-muted-foreground">
                          {dataKey.color}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`visible-${index}`}
                      checked={dataKey.visible}
                      onCheckedChange={(checked) => updateDataKey(index, { visible: checked })}
                    />
                    <Label htmlFor={`visible-${index}`}>显示此系列</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onReset}>
              重置
            </Button>
            <Button onClick={onApply}>
              应用配置
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// 图表预设配置
export const chartPresets: Record<string, Partial<ChartConfig>> = {
  'asset-summary': {
    type: 'pie',
    title: '资产分类统计',
    description: '按分类统计资产分布情况',
    height: 300,
    showLegend: true,
    showTooltip: true,
    dataKeys: [
      { key: 'value', name: '数量', color: '#0088FE', visible: true }
    ],
    xAxisKey: 'name'
  },
  'borrow-trend': {
    type: 'line',
    title: '借用趋势分析',
    description: '借用和归还的时间趋势',
    height: 400,
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    showBrush: true,
    smooth: true,
    dataKeys: [
      { key: 'borrow_count', name: '借用数量', color: '#0088FE', visible: true },
      { key: 'return_count', name: '归还数量', color: '#00C49F', visible: true }
    ],
    xAxisKey: 'month'
  },
  'inventory-accuracy': {
    type: 'bar',
    title: '盘点准确率统计',
    description: '各部门盘点准确率对比',
    height: 350,
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    dataKeys: [
      { key: 'accuracy_rate', name: '准确率', color: '#00C49F', visible: true }
    ],
    xAxisKey: 'department_name'
  }
};
