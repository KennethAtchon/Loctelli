import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { ContactSubmission, CreateContactNoteDto } from "@/types";
import { useTenant } from "@/contexts/tenant-context";

export const Route = createFileRoute('/admin/crm/contacts')({
  component: AdminContactsPage,
});

function AdminContactsPage() {
  const {} = useTenant();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactSubmission[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    inProgress: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredContacts, { pageSize: 10 });

  const statsCards: StatCard[] = [
    {
      title: "Total Contacts",
      value: stats.total,
      icon: <Mail className="h-8 w-8" />,
      color: "text-blue-600",
    },
    {
      title: "New",
      value: stats.newCount,
      icon: <User className="h-8 w-8" />,
      color: "text-green-600",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: <Calendar className="h-8 w-8" />,
      color: "text-yellow-600",
    },
    {
      title: "Closed",
      value: stats.closed,
      icon: <MessageSquare className="h-8 w-8" />,
      color: "text-gray-600",
    },
  ];

  const columns: Column<ContactSubmission>[] = [
    {
      key: "fullName",
      header: "Name",
      render: (contact) => (
        <span className="font-medium">{contact.fullName}</span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (contact) => (
        <div>
          <div className="text-sm">{contact.email}</div>
          <div className="text-xs text-gray-500">{contact.phone}</div>
        </div>
      ),
    },
    {
      key: "services",
      header: "Services",
      render: (contact) => {
        const serviceLabels = {
          "free-website": "Free Website",
          "google-reviews": "Google Reviews",
          "customer-reactivation": "Customer Reactivation",
          "lead-generation": "AI Lead Generation",
          "all-services": "All Services",
        };
        return (
          serviceLabels[contact.services as keyof typeof serviceLabels] ||
          contact.services
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (contact) => (
        <Badge variant={getStatusBadgeVariant(contact.status)}>
          {contact.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (contact) => (
        <Badge variant={getPriorityBadgeVariant(contact.priority)}>
          {contact.priority}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (contact) => contact.assignedTo?.name || "Unassigned",
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (contact) => formatDate(contact.submittedAt),
    },
  ];

  const filters: Filter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "NEW", label: "New" },
        { value: "CONTACTED", label: "Contacted" },
        { value: "QUALIFIED", label: "Qualified" },
        { value: "PROPOSAL_SENT", label: "Proposal Sent" },
        { value: "CLOSED_WON", label: "Closed Won" },
        { value: "CLOSED_LOST", label: "Closed Lost" },
        { value: "UNRESPONSIVE", label: "Unresponsive" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
        { value: "URGENT", label: "Urgent" },
      ],
    },
  ];

  const loadContacts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const [contactsData, statsData] = await Promise.all([
        api.contacts.getContacts(),
        api.contacts.getStats(),
      ]);
      setContacts(contactsData);
      setFilteredContacts(contactsData);
      setStats(statsData);
      setTotalItems(contactsData.length);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      setError("Failed to load contacts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setTotalItems]);

  const handleSearch = (term: string) => {
    const filtered = contacts.filter(
      (contact) =>
        contact.fullName.toLowerCase().includes(term.toLowerCase()) ||
        contact.email.toLowerCase().includes(term.toLowerCase()) ||
        contact.phone.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredContacts(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  const handleFilter = (key: string, value: string) => {
    let filtered = contacts;
    if (key === "status" && value !== "all") {
      filtered = filtered.filter((contact) => contact.status === value);
    }
    if (key === "priority" && value !== "all") {
      filtered = filtered.filter((contact) => contact.priority === value);
    }
    setFilteredContacts(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  const handleView = async (contact: ContactSubmission) => {
    try {
      const detailedContact = await api.contacts.getContact(contact.id);
      setSelectedContact(detailedContact);
    } catch (error) {
      console.error("Failed to load contact details:", error);
    }
  };

  const handleDelete = async (contact: ContactSubmission) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        setError(null);
        // Note: Delete endpoint not available in API, commenting out
        // await api.contacts.deleteContact(contact.id);
        setSuccess("Contact deletion not implemented");
        loadContacts();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Failed to delete contact:", error);
        setError("Failed to delete contact. Please try again.");
      }
    }
  };

  const handleAddNote = async () => {
    if (!selectedContact || !newNote.trim()) return;
    
    try {
      setIsAddingNote(true);
      const noteDto: CreateContactNoteDto = { content: newNote };
      await api.contacts.addNote(selectedContact.id, noteDto);
      setNewNote("");
      const updatedContact = await api.contacts.getContact(selectedContact.id);
      setSelectedContact(updatedContact);
      setSuccess("Note added successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to add note:", error);
      setError("Failed to add note. Please try again.");
    } finally {
      setIsAddingNote(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW":
        return "default";
      case "CONTACTED":
      case "QUALIFIED":
        return "secondary";
      case "PROPOSAL_SENT":
        return "outline";
      case "CLOSED_WON":
        return "default";
      case "CLOSED_LOST":
      case "UNRESPONSIVE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "outline";
      case "MEDIUM":
        return "secondary";
      case "HIGH":
        return "default";
      case "URGENT":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return "N/A";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "Invalid Date";
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
        title="Contact Management"
        description="Manage contact form submissions"
        searchPlaceholder="Search contacts..."
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
        onRefresh={loadContacts}
        onView={handleView}
        onDelete={handleDelete}
        stats={statsCards}
        error={error}
        success={success}
      />

      {selectedContact && (
        <Dialog
          open={!!selectedContact}
          onOpenChange={() => setSelectedContact(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contact Details - {selectedContact.fullName}</DialogTitle>
              <DialogDescription>
                Complete contact information and interaction history
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedContact.fullName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedContact.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedContact.phone}
                  </div>
                  <div>
                    <strong>Services:</strong> {selectedContact.services}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <Badge variant={getStatusBadgeVariant(selectedContact.status)} className="ml-2">
                      {selectedContact.status}
                    </Badge>
                  </div>
                  <div>
                    <strong>Priority:</strong>
                    <Badge variant={getPriorityBadgeVariant(selectedContact.priority)} className="ml-2">
                      {selectedContact.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedContact.message && (
                <div>
                  <h3 className="font-semibold mb-3">Message</h3>
                  <p className="text-sm text-gray-700">{selectedContact.message}</p>
                </div>
              )}

              {selectedContact.notes && selectedContact.notes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Notes ({selectedContact.notes.length})</h3>
                  <div className="space-y-2">
                    {selectedContact.notes.map((note, index) => (
                      <div key={index} className="p-3 border rounded">
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {note.authorName} • {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Add Note</h3>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this contact..."
                  rows={3}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNote.trim()}
                  className="mt-2"
                >
                  {isAddingNote ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
