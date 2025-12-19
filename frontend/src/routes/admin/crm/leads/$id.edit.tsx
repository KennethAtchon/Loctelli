import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Lead, CreateLeadDto, Strategy } from "@/types";
import type { UserProfile } from "@/lib/api/endpoints/admin-auth";
import { useTenant } from "@/contexts/tenant-context";

export const Route = createFileRoute('/admin/crm/leads/$id/edit')({
  component: EditLeadPage,
});

function EditLeadPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const leadId = parseInt(id);
  const { adminFilter, subAccountId } = useTenant();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [formData, setFormData] = useState<CreateLeadDto>({
    regularUserId: 0,
    strategyId: 0,
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    customId: "",
    status: "lead",
    notes: "",
    subAccountId: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingLead(true);
        const [leadData, usersData] = await Promise.all([
          api.leads.getLead(leadId),
          api.adminAuth.getAllUsers(adminFilter ?? undefined),
        ]);

        setLead(leadData);
        setSelectedUserId(leadData.regularUserId);

        const regularUsers = usersData.filter((user) => user.role !== "admin");
        setUsers(regularUsers);

        const strategiesData = await api.strategies.getStrategiesByUser(
          leadData.regularUserId
        );
        setStrategies(strategiesData);

        setFormData({
          regularUserId: leadData.regularUserId,
          strategyId: leadData.strategyId,
          name: leadData.name,
          email: leadData.email || "",
          phone: leadData.phone || "",
          company: leadData.company || "",
          position: leadData.position || "",
          customId: leadData.customId || "",
          status: leadData.status,
          notes: leadData.notes || "",
          subAccountId: subAccountId || leadData.subAccountId || 0,
        });
      } catch (error) {
        console.error("Failed to load lead data:", error);
        setError("Failed to load lead data");
      } finally {
        setIsLoadingLead(false);
      }
    };

    if (leadId) {
      loadData();
    }
  }, [leadId, adminFilter, subAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.leads.updateLead(leadId, formData);
      navigate({ to: "/admin/crm/leads" });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update lead"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "strategyId" || name === "regularUserId"
          ? parseInt(value) || 0
          : value,
    }));
  };

  if (isLoadingLead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate({ to: "/admin/crm/leads" })}>
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/admin/crm/leads" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
          <p className="text-gray-600">Update lead information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
          <CardDescription>
            Update the lead's details below. All fields marked with * are
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regularUserId">Assign to User *</Label>
                  <Select
                    value={selectedUserId.toString()}
                    onValueChange={(value) => {
                      const userId = parseInt(value);
                      setSelectedUserId(userId);
                      setFormData((prev) => ({
                        ...prev,
                        regularUserId: userId,
                        strategyId: 0,
                      }));
                      api.strategies
                        .getStrategiesByUser(userId)
                        .then((strategiesData) => {
                          setStrategies(strategiesData);
                        })
                        .catch((error) => {
                          console.error("Failed to load strategies:", error);
                        });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategyId">Assign Strategy *</Label>
                  <Select
                    value={formData.strategyId.toString()}
                    onValueChange={(value) =>
                      handleSelectChange("strategyId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((strategy) => (
                        <SelectItem
                          key={strategy.id}
                          value={strategy.id.toString()}
                        >
                          {strategy.name} {strategy.tag && `(${strategy.tag})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter lead name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Enter job position"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customId">Custom ID</Label>
                  <Input
                    id="customId"
                    name="customId"
                    type="text"
                    value={formData.customId}
                    onChange={handleInputChange}
                    placeholder="Enter custom identifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this lead..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Lead
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/admin/crm/leads" })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
