'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { PricingTable } from '@/components/admin/pricing/pricing-table';
import { PricingForm } from '@/components/admin/pricing/pricing-form';
import { PricingHistory } from '@/components/admin/pricing/pricing-history';
import { TableSkeleton } from '@/components/admin/admin-skeleton';
import type { PricingConfig, PricingCategory, CreatePricingInput, UpdatePricingInput } from '@/lib/admin/types';
import { createClient } from '@/utils/supabase/client';

const TABS: { value: PricingCategory; label: string; description: string }[] = [
  { value: 'mail_piece', label: 'Mail Pieces', description: 'Per-piece printing costs by format' },
  { value: 'paper_stock', label: 'Paper Stock', description: 'Paper stock upcharges' },
  { value: 'finish', label: 'Finish', description: 'Print finish upcharges' },
  { value: 'postage', label: 'Postage', description: 'USPS postage rates' },
  { value: 'shipping', label: 'Shipping', description: 'Shipping and handling fees' },
  { value: 'volume_discount', label: 'Volume Discounts', description: 'Quantity-based printing discounts' },
  { value: 'address_validation', label: 'Address Validation', description: 'Standalone validation tiers' },
  { value: 'add_on_service', label: 'Add-On Services', description: 'Ancillary service pricing' },
  { value: 'design_service', label: 'Design Services', description: 'Professional design tiers' },
];

export default function AdminPricingPage() {
  const [activeTab, setActiveTab] = useState<PricingCategory>('mail_piece');
  const [pricing, setPricing] = useState<Record<string, PricingConfig[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<PricingConfig | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [historyItem, setHistoryItem] = useState<PricingConfig | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const supabase = createClient();

  const fetchPricing = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/pricing?includeInactive=true', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;

      const { data } = await res.json();
      const grouped: Record<string, PricingConfig[]> = {};
      for (const item of data) {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      }
      setPricing(grouped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  };

  const handleSave = async (data: CreatePricingInput | (UpdatePricingInput & { reason?: string })) => {
    const headers = await getAuthHeaders();

    if (editItem) {
      await fetch(`/api/admin/pricing/${editItem.id}`, {
        method: 'PATCH', headers, body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/admin/pricing', {
        method: 'POST', headers, body: JSON.stringify(data),
      });
    }
    setEditItem(null);
    setShowCreate(false);
    await fetchPricing();
  };

  const handleToggleActive = async (item: PricingConfig) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/pricing/${item.id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ isActive: !item.isActive, reason: item.isActive ? 'Deactivated' : 'Reactivated' }),
    });
    await fetchPricing();
  };

  const handleViewHistory = async (item: PricingConfig) => {
    setHistoryItem(item);
    setHistoryLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/pricing/${item.id}`, { headers });
      if (res.ok) {
        const { history: h } = await res.json();
        setHistory(h ?? []);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const currentItems = pricing[activeTab] ?? [];

  return (
    <div className="space-y-6 animate-admin-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all product and service pricing. Changes take effect immediately.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PricingCategory)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={4} columns={8} />
                ) : (
                  <PricingTable
                    items={currentItems}
                    onEdit={setEditItem}
                    onToggleActive={handleToggleActive}
                    onViewHistory={handleViewHistory}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      {editItem && (
        <PricingForm
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
          existing={editItem}
        />
      )}

      {/* Create Dialog */}
      {showCreate && (
        <PricingForm
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSave={handleSave}
          defaultCategory={activeTab}
        />
      )}

      {/* History Dialog */}
      <PricingHistory
        open={!!historyItem}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        history={history as Parameters<typeof PricingHistory>[0]['history']}
        isLoading={historyLoading}
      />
    </div>
  );
}
