/**
 * Example: Tenant-aware Leads List Component
 *
 * This component demonstrates how to use the tenant system:
 * - Regular users: Automatically see only their subAccount's leads
 * - Admins (global view): See all leads across all subAccounts
 * - Admins (filtered): See leads for selected subAccount
 */

'use client';

import { useTenantData } from '@/hooks/useTenantData';
import { useTenant } from '@/contexts/tenant-context';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TenantAwareLeadsList() {
  const { mode, isGlobalView, subAccountId } = useTenant();

  // Automatic tenant filtering! No need to manually pass subAccountId
  const { data: leads, isLoading, error } = useTenantData({
    queryKey: 'leads',
    queryFn: async ({ subAccountId }) => {
      // subAccountId is automatically provided based on tenant context
      if (subAccountId) {
        return api.leads.getLeads({ subAccountId });
      }
      // For admin global view, fetch all leads
      return api.leads.getLeads();
    },
  });

  if (isLoading) {
    return <div>Loading leads...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error loading leads: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Leads</span>
          <Badge variant={isGlobalView ? 'default' : 'outline'}>
            {isGlobalView ? 'All Tenants' : `SubAccount ${subAccountId}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads && leads.length > 0 ? (
          <ul className="space-y-2">
            {leads.map((lead: any) => (
              <li key={lead.id} className="p-2 border rounded">
                <div className="font-medium">{lead.name}</div>
                <div className="text-sm text-gray-600">{lead.email}</div>
                {isGlobalView && (
                  <Badge variant="secondary" className="mt-1">
                    SubAccount: {lead.subAccountId}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No leads found</p>
        )}
      </CardContent>
    </Card>
  );
}
