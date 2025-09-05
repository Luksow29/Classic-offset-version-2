// src/components/whatsapp/WhatsAppAnalytics.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import { supabase } from '../../lib/supabaseClient';
import { MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';

interface Log { id: number; sent_at: string; template_name: string | null }
interface CommLog { id: string; created_at: string; channel: 'whatsapp' | 'sms' | 'email' | string; template_name: string | null }

const WhatsAppAnalytics: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_log')
        .select('id, sent_at, template_name')
        .order('sent_at', { ascending: false })
        .limit(500);
      if (!mounted) return;
      if (error) {
        console.info('whatsapp_log fetch failed (optional):', error.message);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
      // Try unified communication log (non-WhatsApp channels)
      try {
        const { data: cdata, error: cerror } = await supabase
          .from('communication_log')
          .select('id, created_at, channel, template_name')
          .order('created_at', { ascending: false })
          .limit(1000);
        if (cerror) throw cerror;
        if (mounted) setCommLogs((cdata as any) || []);
      } catch (e: any) {
        console.info('communication_log fetch failed (optional):', e?.message);
        if (mounted) setCommLogs([]);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const byDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of logs) {
      const d = l.sent_at ? new Date(l.sent_at).toISOString().slice(0, 10) : 'unknown';
      map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
  }, [logs]);

  const channelsBreakdown = useMemo(() => {
    const map: Record<string, number> = { whatsapp: logs.length };
    for (const c of commLogs) {
      const key = (c.channel || 'unknown').toLowerCase();
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [logs.length, commLogs]);

  const topTemplates = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of logs) {
      const t = l.template_name || 'Unknown';
      map[t] = (map[t] || 0) + 1;
    }
    for (const c of commLogs) {
      const t = c.template_name || 'Unknown';
      map[t] = (map[t] || 0) + 1;
    }
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 5);
  }, [logs, commLogs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <Card title="Activity Overview">
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><MessageSquare className="w-4 h-4"/> Total messages: {logs.length + commLogs.length}</div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><TrendingUp className="w-4 h-4"/> Active days: {byDay.length}</div>
          <div className="text-xs text-muted-foreground">WhatsApp + other channels (if communication_log is enabled)</div>
        </div>
      </Card>
      <Card title="Messages by Day">
        <div className="p-5 space-y-2">
          {byDay.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          <ul className="space-y-1">
            {byDay.map(([d, c]) => (
              <li key={d} className="flex justify-between text-sm"><span>{d}</span><span className="font-medium">{c}</span></li>
            ))}
          </ul>
        </div>
      </Card>
      <Card title="Channels Breakdown">
        <div className="p-5 space-y-2">
          {channelsBreakdown.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          <ul className="space-y-1">
            {channelsBreakdown.map(([ch, c]) => (
              <li key={ch} className="flex justify-between text-sm"><span className="capitalize">{ch}</span><span className="font-medium">{c}</span></li>
            ))}
          </ul>
        </div>
      </Card>
      <Card title="Top Templates">
        <div className="p-5 space-y-2">
          {topTemplates.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          <ul className="space-y-1">
            {topTemplates.map(([t, c]) => (
              <li key={t} className="flex justify-between text-sm"><span>{t}</span><span className="font-medium">{c}</span></li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default WhatsAppAnalytics;
