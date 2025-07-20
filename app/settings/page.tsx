'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MockDataManager } from '@/lib/mock-data';
import { SystemSettings } from '@/lib/types';
import { AlertTriangle, Key, Link as LinkIcon, RefreshCw, Save, Settings, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = () => {
    setIsLoading(true);
    setTimeout(() => {
      MockDataManager.initializeData();
      const systemSettings = MockDataManager.getSystemSettings();
      setSettings(systemSettings);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setTimeout(() => {
      MockDataManager.updateSystemSettings(settings);
      toast.success('设置已保存');
      setIsSaving(false);
    }, 1000);
  };

  const testConnection = (type: string) => {
    toast.success(`${type} 连接测试成功`);
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
            <p className="text-muted-foreground">配置集成和系统参数</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-5 w-32 animate-pulse rounded"></div>
                <div className="bg-muted h-4 w-48 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-20 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
          <p className="text-muted-foreground">配置集成和系统参数</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dootask" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dootask">DooTask 集成</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="general">通用设置</TabsTrigger>
        </TabsList>

        {/* DooTask 集成配置 */}
        <TabsContent value="dootask" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                DooTask 集成
              </CardTitle>
              <CardDescription>配置与 DooTask 主程序的连接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      settings.dootaskIntegration.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium">连接状态</span>
                </div>
                <div className="flex items-center gap-2">
                  {settings.dootaskIntegration.isConnected ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      已连接
                    </Badge>
                  ) : (
                    <Badge variant="destructive">未连接</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => testConnection('DooTask')}>
                    测试连接
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>DooTask API 地址</Label>
                <Input
                  value={settings.dootaskIntegration.apiBaseUrl}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      dootaskIntegration: {
                        ...settings.dootaskIntegration,
                        apiBaseUrl: e.target.value,
                      },
                    })
                  }
                  placeholder="https://dootask.example.com/api"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  访问令牌
                </Label>
                <Input
                  type="password"
                  value={settings.dootaskIntegration.token}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      dootaskIntegration: {
                        ...settings.dootaskIntegration,
                        token: e.target.value,
                      },
                    })
                  }
                  placeholder="DooTask 用户访问令牌"
                />
                <p className="text-muted-foreground text-xs">从 DooTask 个人设置中获取访问令牌</p>
              </div>

              {settings.dootaskIntegration.lastSync && (
                <div className="text-muted-foreground text-sm">
                  最后同步：{new Date(settings.dootaskIntegration.lastSync).toLocaleString('zh-CN')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook 配置 */}
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook 配置
              </CardTitle>
              <CardDescription>配置接收 DooTask 消息的 Webhook 端点</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      settings.webhookConfig.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium">Webhook 状态</span>
                </div>
                <div className="flex items-center gap-2">
                  {settings.webhookConfig.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      活跃
                    </Badge>
                  ) : (
                    <Badge variant="secondary">未启用</Badge>
                  )}
                  <Switch
                    checked={settings.webhookConfig.isActive}
                    onCheckedChange={checked =>
                      setSettings({
                        ...settings,
                        webhookConfig: {
                          ...settings.webhookConfig,
                          isActive: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.webhookConfig.url}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        webhookConfig: {
                          ...settings.webhookConfig,
                          url: e.target.value,
                        },
                      })
                    }
                    placeholder="https://ai-plugin.example.com/webhook"
                  />
                  <Button variant="outline" onClick={() => testConnection('Webhook')}>
                    测试
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>签名密钥</Label>
                <Input
                  type="password"
                  value={settings.webhookConfig.secret}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      webhookConfig: {
                        ...settings.webhookConfig,
                        secret: e.target.value,
                      },
                    })
                  }
                  placeholder="用于验证 Webhook 消息的密钥"
                />
                <p className="text-muted-foreground text-xs">用于验证来自 DooTask 的 Webhook 请求</p>
              </div>

              {settings.webhookConfig.lastReceived && (
                <div className="text-muted-foreground text-sm">
                  最后收到消息：{new Date(settings.webhookConfig.lastReceived).toLocaleString('zh-CN')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通用设置 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                通用设置
              </CardTitle>
              <CardDescription>系统基础配置和参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>默认语言</Label>
                  <Select
                    value={settings.generalSettings.defaultLanguage}
                    onValueChange={value =>
                      setSettings({
                        ...settings,
                        generalSettings: {
                          ...settings.generalSettings,
                          defaultLanguage: value as 'zh-CN' | 'en-US',
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">中文 (简体)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>时区</Label>
                  <Select
                    value={settings.generalSettings.timezone}
                    onValueChange={value =>
                      setSettings({
                        ...settings,
                        generalSettings: {
                          ...settings.generalSettings,
                          timezone: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>日志级别</Label>
                  <Select
                    value={settings.generalSettings.logLevel}
                    onValueChange={value =>
                      setSettings({
                        ...settings,
                        generalSettings: {
                          ...settings.generalSettings,
                          logLevel: value as 'debug' | 'info' | 'warn' | 'error',
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>对话历史保留 (条)</Label>
                  <Input
                    type="number"
                    value={settings.generalSettings.maxConversationHistory}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        generalSettings: {
                          ...settings.generalSettings,
                          maxConversationHistory: parseInt(e.target.value),
                        },
                      })
                    }
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>自动清理天数</Label>
                <Input
                  type="number"
                  value={settings.generalSettings.autoCleanupDays}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      generalSettings: {
                        ...settings.generalSettings,
                        autoCleanupDays: parseInt(e.target.value),
                      },
                    })
                  }
                  placeholder="30"
                />
                <p className="text-muted-foreground text-xs">超过指定天数的对话记录将被自动清理</p>
              </div>

              <Separator />

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">注意事项</p>
                    <p className="mt-1 text-yellow-800">
                      修改系统设置可能影响系统行为。建议在非高峰时段进行设置变更， 并在变更后观察系统运行情况。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
