/**
 * Example: Tenant-aware Create Lead Form
 *
 * Demonstrates mutation with automatic tenant context
 */

"use client";

import { useState } from "react";
import { useTenantMutation } from "@/hooks/useTenantQuery";
import { useTenant } from "@/contexts/tenant-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TenantAwareCreateLead() {
  const { subAccountId, mode } = useTenant();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Automatic tenant context in mutations!
  const createLeadMutation = useTenantMutation<
    unknown,
    Error,
    { name: string; email: string }
  >({
    mutationFn: async ({ name, email, subAccountId }) => {
      return api.leads.createLead({
        name,
        email,
        subAccountId: subAccountId!,
        regularUserId: 1,
        strategyId: 1,
      });
    },
    requireSubAccount: true,
    invalidateQueries: [["leads"]],
    onSuccess: () => {
      setSuccess(true);
      setName("");
      setEmail("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await createLeadMutation.mutate({ name, email });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  // Admin in global view cannot create leads without selecting a subaccount
  if (mode === "ADMIN_GLOBAL") {
    return (
      <Alert>
        <AlertDescription>
          Please select a subaccount to create leads
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Lead (SubAccount: {subAccountId})</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>Lead created successfully!</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <Button type="submit" disabled={createLeadMutation.isPending}>
            {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
