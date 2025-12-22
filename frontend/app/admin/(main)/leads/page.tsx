"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import { Building, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Lead } from "@/types";
import { DetailedLead } from "@/lib/api/endpoints/admin-auth";
import logger from "@/lib/logger";
import { useTenant } from "@/contexts/tenant-context";
import { LeadDetailsContent } from "@/components/admin/lead-details-content";

export default function LeadsPage() {
  const { getTenantQueryParams } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);

  // Use the pagination hook
  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredLeads, { pageSize: 10 });

  // Calculate stats
  const stats: StatCard[] = [
    {
      title: "Total Leads",
      value: leads.length,
      icon: <Building className="h-8 w-8" />,
      color: "text-blue-600",
    },
    {
      title: "Active Leads",
      value: leads.filter((l) => l.status === "active").length,
      icon: <Building className="h-8 w-8" />,
      color: "text-green-600",
    },
    {
      title: "Lead Status",
      value: leads.filter((l) => l.status === "lead").length,
      icon: <Building className="h-8 w-8" />,
      color: "text-yellow-600",
    },
    {
      title: "Inactive Leads",
      value: leads.filter((l) => l.status === "inactive").length,
      icon: <Building className="h-8 w-8" />,
      color: "text-red-600",
    },
  ];

  // Define columns
  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Name",
      render: (lead) => <span className="font-medium">{lead.name}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (lead) => (
        <div>
          <div className="text-sm">{lead.email || "No email"}</div>
          <div className="text-xs text-gray-500">
            {lead.phone || "No phone"}
          </div>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (lead) => lead.company || "N/A",
    },
    {
      key: "status",
      header: "Status",
      render: (lead) => (
        <Badge variant={getStatusBadgeVariant(lead.status)}>
          {lead.status}
        </Badge>
      ),
    },
    {
      key: "conversationStage",
      header: "Stage",
      render: (lead) => {
        const stage = lead.conversationState?.stage;
        if (!stage) return <span className="text-gray-400 text-xs">-</span>;

        const stageColors: Record<string, string> = {
          discovery: "bg-blue-100 text-blue-700",
          qualification: "bg-purple-100 text-purple-700",
          objection_handling: "bg-orange-100 text-orange-700",
          closing: "bg-yellow-100 text-yellow-700",
          booked: "bg-green-100 text-green-700",
        };

        return (
          <span
            className={`text-xs px-2 py-1 rounded-full ${stageColors[stage] || "bg-gray-100 text-gray-700"}`}
          >
            {stage.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "qualified",
      header: "Qualified",
      render: (lead) => {
        const qualified = lead.conversationState?.qualified;
        if (qualified === true)
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        if (qualified === false)
          return <AlertCircle className="h-4 w-4 text-red-600" />;
        return <Clock className="h-4 w-4 text-gray-400" />;
      },
    },
    {
      key: "strategy",
      header: "Strategy",
      render: (lead) => lead.strategy?.name || "N/A",
    },
    {
      key: "lastMessageDate",
      header: "Last Message",
      render: (lead) =>
        lead.lastMessageDate ? formatDate(lead.lastMessageDate) : "No messages",
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "lead", label: "Lead" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const loadLeads = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Use tenant context for automatic filtering
      const queryParams = getTenantQueryParams();
      logger.debug("Loading leads with tenant params:", queryParams);

      const leadsData = await api.leads.getLeads(queryParams);
      setLeads(leadsData);
      setFilteredLeads(leadsData);
      setTotalItems(leadsData.length);
    } catch (error) {
      logger.error("Failed to load leads:", error);
      setError("Failed to load leads");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getTenantQueryParams, setTotalItems]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(term.toLowerCase()) ||
        lead.email?.toLowerCase().includes(term.toLowerCase()) ||
        lead.company?.toLowerCase().includes(term.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredLeads(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = leads;

    if (key === "status" && value !== "all") {
      filtered = filtered.filter((lead) => lead.status === value);
    }

    setFilteredLeads(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = async (lead: Lead) => {
    try {
      const detailedLead = await api.adminAuth.getDetailedLead(lead.id);
      setSelectedLead(detailedLead);
    } catch (error) {
      logger.error("Failed to load lead details:", error);
    }
  };

  const handleEdit = (lead: Lead) => {
    // Navigate to edit page
    window.location.href = `/admin/leads/${lead.id}/edit`;
  };

  const handleDelete = async (lead: Lead) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      try {
        setError(null);
        await api.leads.deleteLead(lead.id);
        setSuccess("Lead deleted successfully");
        loadLeads();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        logger.error("Failed to delete lead:", error);
        setError("Failed to delete lead. Please try again.");
      }
    }
  };

  const handleCreate = () => {
    window.location.href = "/admin/leads/new";
  };

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "lead":
        return "secondary";
      case "inactive":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <DataTable
        data={paginatedData}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        columns={columns}
        title="Lead Management"
        description="A list of all your leads and their current status"
        searchPlaceholder="Search leads..."
        filters={filters}
        onSearchChange={handleSearch}
        onFilterChange={handleFilter}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          pageSize: pagination.pageSize,
          totalItems: pagination.totalItems,
          onPageChange: setCurrentPage,
        }}
        onCreateClick={handleCreate}
        onRefresh={loadLeads}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        stats={stats}
        error={error}
        success={success}
      />

      {/* Lead Details Dialog */}
      {selectedLead && (
        <Dialog
          open={!!selectedLead}
          onOpenChange={() => setSelectedLead(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <LeadDetailsContent
              lead={selectedLead}
              formatDate={formatDate}
              getStatusBadgeVariant={getStatusBadgeVariant}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
