import { Badge } from "@/components/ui/badge";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailedLead } from "@/lib/api/endpoints/admin-auth";
import { TrendingUp, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface LeadDetailsContentProps {
  lead: DetailedLead;
  formatDate: (dateInput: string | Date) => string;
  getStatusBadgeVariant: (
    status: string
  ) => "default" | "secondary" | "outline" | "destructive";
}

export function LeadDetailsContent({
  lead,
  formatDate,
  getStatusBadgeVariant,
}: LeadDetailsContentProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Lead Details - {lead.name}</DialogTitle>
        <DialogDescription>
          Complete lead information and related data
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="font-semibold mb-3">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>ID:</strong> {lead.id}
            </div>
            <div>
              <strong>Name:</strong> {lead.name}
            </div>
            <div>
              <strong>Email:</strong> {lead.email || "N/A"}
            </div>
            <div>
              <strong>Phone:</strong> {lead.phone || "N/A"}
            </div>
            <div>
              <strong>Company:</strong> {lead.company || "N/A"}
            </div>
            <div>
              <strong>Position:</strong> {lead.position || "N/A"}
            </div>
            <div>
              <strong>Timezone:</strong> {lead.timezone || "N/A"}
            </div>
            <div>
              <strong>Status:</strong>
              <Badge
                variant={getStatusBadgeVariant(lead.status)}
                className="ml-2"
              >
                {lead.status}
              </Badge>
            </div>
            <div>
              <strong>Custom ID:</strong> {lead.customId || "N/A"}
            </div>
          </div>
        </div>

        {/* Conversation State */}
        {lead.conversationState && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversation Progress
            </h3>
            <div className="space-y-3">
              {/* Stage */}
              {lead.conversationState.stage && (
                <div className="flex items-center gap-2">
                  <strong className="min-w-[140px]">Current Stage:</strong>
                  <Badge variant="default" className="capitalize">
                    {lead.conversationState.stage.replace("_", " ")}
                  </Badge>
                </div>
              )}

              {/* Qualification Status */}
              <div className="flex items-center gap-2">
                <strong className="min-w-[140px]">Qualified:</strong>
                {lead.conversationState.qualified === true ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : lead.conversationState.qualified === false ? (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" /> No
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-4 w-4" /> Not yet determined
                  </span>
                )}
              </div>

              {/* Discussion Flags */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <strong>Budget Discussed:</strong>
                  {lead.conversationState.budgetDiscussed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-gray-400 text-sm">Not yet</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <strong>Timeline Discussed:</strong>
                  {lead.conversationState.timelineDiscussed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-gray-400 text-sm">Not yet</span>
                  )}
                </div>
              </div>

              {/* Decision Maker */}
              <div className="flex items-center gap-2">
                <strong className="min-w-[140px]">Decision Maker:</strong>
                {lead.conversationState.decisionMaker === true ? (
                  <span className="text-green-600">Yes</span>
                ) : lead.conversationState.decisionMaker === false ? (
                  <span className="text-orange-600">
                    No (requires approval)
                  </span>
                ) : (
                  <span className="text-gray-500">Unknown</span>
                )}
              </div>

              {/* Pain Points */}
              {lead.conversationState.painPointsIdentified &&
                lead.conversationState.painPointsIdentified.length > 0 && (
                  <div>
                    <strong className="block mb-2">
                      Pain Points Identified:
                    </strong>
                    <div className="flex flex-wrap gap-2">
                      {lead.conversationState.painPointsIdentified.map(
                        (point, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {point}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Objections */}
              {lead.conversationState.objections &&
                lead.conversationState.objections.length > 0 && (
                  <div>
                    <strong className="block mb-2">Objections Raised:</strong>
                    <div className="flex flex-wrap gap-2">
                      {lead.conversationState.objections.map(
                        (objection, idx) => (
                          <Badge
                            key={idx}
                            variant="destructive"
                            className="text-xs"
                          >
                            {objection}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Last Updated */}
              {lead.conversationState.lastUpdated && (
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {formatDate(lead.conversationState.lastUpdated)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div>
            <h3 className="font-semibold mb-3">Notes</h3>
            <div className="p-3 bg-gray-50 rounded text-sm">{lead.notes}</div>
          </div>
        )}

        {/* Timestamps */}
        <div>
          <h3 className="font-semibold mb-3">Timestamps</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Created:</strong> {formatDate(lead.createdAt)}
            </div>
            <div>
              <strong>Updated:</strong> {formatDate(lead.updatedAt)}
            </div>
            <div>
              <strong>Last Message:</strong>{" "}
              {lead.lastMessageDate
                ? formatDate(lead.lastMessageDate)
                : "No messages"}
            </div>
          </div>
        </div>

        {/* User Information */}
        {(lead.regularUser || lead.user) && (
          <div>
            <h3 className="font-semibold mb-3">Assigned User</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>User ID:</strong> {(lead.regularUser || lead.user)?.id}
              </div>
              <div>
                <strong>Name:</strong> {(lead.regularUser || lead.user)?.name}
              </div>
              <div>
                <strong>Email:</strong> {(lead.regularUser || lead.user)?.email}
              </div>
              <div>
                <strong>Role:</strong> {(lead.regularUser || lead.user)?.role}
              </div>
              <div>
                <strong>Company:</strong>{" "}
                {(lead.regularUser || lead.user)?.company || "N/A"}
              </div>
              <div>
                <strong>Budget:</strong>{" "}
                {(lead.regularUser || lead.user)?.budget || "N/A"}
              </div>
              <div>
                <strong>Booking Enabled:</strong>{" "}
                {(lead.regularUser || lead.user)?.bookingEnabled ? "Yes" : "No"}
              </div>
              <div>
                <strong>Active:</strong>{" "}
                {(lead.regularUser || lead.user)?.isActive ? "Yes" : "No"}
              </div>
            </div>
          </div>
        )}

        {/* Strategy Information */}
        {lead.strategy && (
          <div>
            <h3 className="font-semibold mb-3">Strategy Details</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Strategy ID:</strong> {lead.strategy.id}
                </div>
                <div>
                  <strong>Name:</strong> {lead.strategy.name}
                </div>
                <div>
                  <strong>Tag:</strong> {lead.strategy.tag || "N/A"}
                </div>
                <div>
                  <strong>Active:</strong>{" "}
                  {lead.strategy.isActive ? "Yes" : "No"}
                </div>
              </div>

              {lead.strategy.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1 text-gray-600">
                    {lead.strategy.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>AI Name:</strong> {lead.strategy.aiName}
                </div>
                <div>
                  <strong>Industry:</strong>{" "}
                  {lead.strategy.industryContext || "N/A"}
                </div>
              </div>

              {lead.strategy.aiRole && (
                <div>
                  <strong>AI Role:</strong>
                  <p className="mt-1 text-gray-600 text-xs">
                    {lead.strategy.aiRole}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message History */}
        {lead.lastMessage && (
          <div>
            <h3 className="font-semibold mb-3">Latest Message</h3>
            <div className="p-3 bg-gray-50 rounded text-sm">
              <p className="text-gray-700">{lead.lastMessage}</p>
              {lead.lastMessageDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Sent: {formatDate(lead.lastMessageDate)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bookings */}
        {lead.bookings && lead.bookings.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">
              Bookings ({lead.bookings.length})
            </h3>
            <div className="space-y-2">
              {lead.bookings.map((booking) => (
                <div key={booking.id} className="p-2 border rounded">
                  <div className="font-medium">{booking.bookingType}</div>
                  <div className="text-sm text-gray-600">
                    Status: {booking.status} | Created:{" "}
                    {formatDate(booking.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub Account ID */}
        <div>
          <h3 className="font-semibold mb-3">System Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Regular User ID:</strong>{" "}
              {lead.regularUserId || lead.user?.id || "N/A"}
            </div>
            <div>
              <strong>Strategy ID:</strong>{" "}
              {lead.strategyId || lead.strategy?.id || "N/A"}
            </div>
            <div>
              <strong>SubAccount ID:</strong> {lead.subAccountId || "N/A"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
