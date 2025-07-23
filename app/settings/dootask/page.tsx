'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { Key, Link as LinkIcon, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { testTokenServer } from '../../../lib/api/test';

interface DooTaskSettings {
  apiBaseUrl: string;
  token: string;
  isConnected: boolean;
  lastSync?: string;
}

const DEFAULT_SETTINGS: DooTaskSettings = {
  apiBaseUrl: '',
  token: '',
  isConnected: false,
  lastSync: undefined,
};

const CACHE_KEY = 'dootaskSettings';

export default function DooTaskSettingsPage() {
  const [settings, setSettings] = useState<DooTaskSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = () => {
    setIsLoading(true);
    try {
      const savedSettings = storage.getItem(CACHE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(DEFAULT_SETTINGS);
      toast.error('加载设置失败，使用默认配置');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await testTokenServer(settings.token, settings.apiBaseUrl);
      storage.setItem(
        CACHE_KEY,
        JSON.stringify({
          ...settings,
          isConnected: true,
          lastSync: new Date().toISOString(),
        })
      );
      toast.success('设置已保存到本地');
    } catch (error) {
      storage.setItem(
        CACHE_KEY,
        JSON.stringify({
          ...settings,
          isConnected: false,
        })
      );
      console.error('Failed to save settings:', error);
      toast.error('保存设置失败');
    } finally {
      setIsSaving(false);
      loadSettings();
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">DooTask 集成设置</h1>
            <p className="text-muted-foreground">配置与 DooTask 主程序的连接</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-32 animate-pulse rounded"></div>
            <div className="bg-muted h-4 w-48 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-20 animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">DooTask 集成设置</h1>
          <p className="text-muted-foreground">配置与 DooTask 主程序的连接，设置将保存到本地</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            DooTask 集成
          </CardTitle>
          <CardDescription>配置与 DooTask 主程序的连接参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  settings.isConnected ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'
                }`}
              />
              <span className="font-medium">连接状态</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  已连接
                </Badge>
              ) : (
                <Badge variant="destructive">未连接</Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>DooTask API 地址</Label>
            <Input
              value={settings.apiBaseUrl}
              onChange={e =>
                setSettings({
                  ...settings,
                  apiBaseUrl: e.target.value,
                })
              }
              placeholder="https://dootask.example.com"
            />
            <p className="text-muted-foreground text-xs">DooTask 系统的 API 基础地址</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              访问令牌
            </Label>
            <Input
              type="password"
              value={settings.token}
              onChange={e =>
                setSettings({
                  ...settings,
                  token: e.target.value,
                })
              }
              placeholder="DooTask 用户访问令牌"
            />
            <p className="text-muted-foreground text-xs">从 DooTask 个人设置中获取访问令牌</p>
          </div>

          {settings.lastSync && (
            <div className="text-muted-foreground text-sm">
              最后连接时间：{new Date(settings.lastSync).toLocaleString('zh-CN')}
            </div>
          )}

          <div className="flex justify-end">
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
        </CardContent>
      </Card>
    </div>
  );
}
