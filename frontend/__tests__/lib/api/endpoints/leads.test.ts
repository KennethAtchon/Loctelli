import { mock } from "bun:test";
import { LeadsApi } from "@/lib/api/endpoints/leads";
import { Lead, CreateLeadDto } from "@/types";
import { ApiClient } from "@/lib/api/client";

// Mock removed - use Bun mocks instead"@/lib/logger", () => ({
  default: {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
  },
}));

const mockGet = mock();
const mockPost = mock();
const mockPut = mock();
const mockPatch = mock();
const mockDelete = mock();

let mockClient: ApiClient;

beforeAll(() => {
  mockClient = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  } as unknown as ApiClient;
});

beforeEach(() => {
  // Bun mocks cleared automatically
});

describe("LeadsApi", () => {
  let leadsApi: LeadsApi;

  beforeEach(() => {
    // Create a new instance
    leadsApi = new LeadsApi(mockClient);
  });

  describe("getLeads", () => {
    it("should call get leads endpoint", async () => {
      const mockLeads: Lead[] = [
        {
          id: 1,
          userId: 1,
          strategyId: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Test Company",
          position: "Manager",
          customId: "LEAD001",
          status: "active",
          notes: "Interested in our services",
          lastMessage: "Hello, I would like to learn more",
          lastMessageDate: "2024-01-01T10:00:00Z",
        },
        {
          id: 2,
          userId: 1,
          strategyId: 1,
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "+0987654321",
          company: "Another Company",
          position: "Director",
          customId: "LEAD002",
          status: "qualified",
          notes: "Ready to purchase",
          lastMessage: "When can we schedule a call?",
          lastMessageDate: "2024-01-02T14:30:00Z",
        },
      ];

      mockGet.mockResolvedValue(mockLeads);

      const result = await leadsApi.getLeads();

      expect(mockGet).toHaveBeenCalledWith("/lead");
      expect(result).toEqual(mockLeads);
    });

    it("should handle get leads error", async () => {
      const error = new Error("Failed to fetch leads");
      mockGet.mockRejectedValue(error);

      await expect(leadsApi.getLeads()).rejects.toThrow(
        "Failed to fetch leads"
      );
      expect(mockGet).toHaveBeenCalledWith("/lead");
    });
  });

  describe("getLead", () => {
    it("should call get lead by id endpoint", async () => {
      const mockLead: Lead = {
        id: 1,
        userId: 1,
        strategyId: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Test Company",
        position: "Manager",
        customId: "LEAD001",
        status: "active",
        notes: "Interested in our services",
        lastMessage: "Hello, I would like to learn more",
        lastMessageDate: "2024-01-01T10:00:00Z",
      };

      mockGet.mockResolvedValue(mockLead);

      const result = await leadsApi.getLead(1);

      expect(mockGet).toHaveBeenCalledWith("/lead/1");
      expect(result).toEqual(mockLead);
    });

    it("should handle get lead error", async () => {
      const error = new Error("Lead not found");
      mockGet.mockRejectedValue(error);

      await expect(leadsApi.getLead(999)).rejects.toThrow("Lead not found");
      expect(mockGet).toHaveBeenCalledWith("/lead/999");
    });
  });

  describe("createLead", () => {
    it("should call create lead endpoint with correct data", async () => {
      const createLeadData: CreateLeadDto = {
        userId: 1,
        strategyId: 1,
        name: "New Lead",
        email: "newlead@example.com",
        phone: "+1111111111",
        company: "New Company",
        position: "CEO",
        customId: "LEAD003",
        status: "new",
        notes: "Fresh lead from website",
        lastMessage: "Interested in demo",
        lastMessageDate: "2024-01-03T09:00:00Z",
      };

      const mockCreatedLead: Lead = {
        id: 3,
        userId: 1,
        strategyId: 1,
        name: "New Lead",
        email: "newlead@example.com",
        phone: "+1111111111",
        company: "New Company",
        position: "CEO",
        customId: "LEAD003",
        status: "new",
        notes: "Fresh lead from website",
        lastMessage: "Interested in demo",
        lastMessageDate: "2024-01-03T09:00:00Z",
      };

      mockPost.mockResolvedValue(mockCreatedLead);

      const result = await leadsApi.createLead(createLeadData);

      expect(mockPost).toHaveBeenCalledWith("/lead", createLeadData);
      expect(result).toEqual(mockCreatedLead);
    });

    it("should handle create lead error", async () => {
      const createLeadData: CreateLeadDto = {
        userId: 1,
        strategyId: 999, // Invalid strategy ID
        name: "Invalid Lead",
        email: "invalid@example.com",
      };

      const error = new Error("Invalid strategy");
      mockPost.mockRejectedValue(error);

      await expect(leadsApi.createLead(createLeadData)).rejects.toThrow(
        "Invalid strategy"
      );
      expect(mockPost).toHaveBeenCalledWith("/lead", createLeadData);
    });

    it("should handle create lead with minimal data", async () => {
      const createLeadData: CreateLeadDto = {
        userId: 1,
        strategyId: 1,
        name: "Minimal Lead",
        email: "minimal@example.com",
      };

      const mockCreatedLead: Lead = {
        id: 4,
        userId: 1,
        strategyId: 1,
        name: "Minimal Lead",
        email: "minimal@example.com",
        status: "new",
      };

      mockPost.mockResolvedValue(mockCreatedLead);

      const result = await leadsApi.createLead(createLeadData);

      expect(mockPost).toHaveBeenCalledWith("/lead", createLeadData);
      expect(result).toEqual(mockCreatedLead);
    });
  });

  describe("updateLead", () => {
    it("should call update lead endpoint with correct data", async () => {
      const updateData = {
        name: "Updated Lead",
        status: "qualified",
        notes: "Updated notes",
      };

      const mockUpdatedLead: Lead = {
        id: 1,
        userId: 1,
        strategyId: 1,
        name: "Updated Lead",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Test Company",
        position: "Manager",
        customId: "LEAD001",
        status: "qualified",
        notes: "Updated notes",
        lastMessage: "Hello, I would like to learn more",
        lastMessageDate: "2024-01-01T10:00:00Z",
      };

      mockPatch.mockResolvedValue(mockUpdatedLead);

      const result = await leadsApi.updateLead(1, updateData);

      expect(mockPatch).toHaveBeenCalledWith("/lead/1", updateData);
      expect(result).toEqual(mockUpdatedLead);
    });

    it("should handle update lead error", async () => {
      const updateData = {
        status: "invalid-status",
      };

      const error = new Error("Invalid status value");
      mockPatch.mockRejectedValue(error);

      await expect(leadsApi.updateLead(1, updateData)).rejects.toThrow(
        "Invalid status value"
      );
      expect(mockPatch).toHaveBeenCalledWith("/lead/1", updateData);
    });
  });

  describe("deleteLead", () => {
    it("should call delete lead endpoint", async () => {
      mockDelete.mockResolvedValue(undefined);

      await leadsApi.deleteLead(1);

      expect(mockDelete).toHaveBeenCalledWith("/lead/1");
    });

    it("should handle delete lead error", async () => {
      const error = new Error("Lead not found");
      mockDelete.mockRejectedValue(error);

      await expect(leadsApi.deleteLead(999)).rejects.toThrow("Lead not found");
      expect(mockDelete).toHaveBeenCalledWith("/lead/999");
    });
  });

  describe("getLeadsByUser", () => {
    it("should call get leads by user endpoint", async () => {
      const mockLeads: Lead[] = [
        {
          id: 1,
          userId: 1,
          strategyId: 1,
          name: "User Lead 1",
          email: "user1@example.com",
          status: "active",
        },
        {
          id: 2,
          userId: 1,
          strategyId: 1,
          name: "User Lead 2",
          email: "user2@example.com",
          status: "qualified",
        },
      ];

      mockGet.mockResolvedValue(mockLeads);

      const result = await leadsApi.getLeadsByUser(1);

      expect(mockGet).toHaveBeenCalledWith("/lead?userId=1");
      expect(result).toEqual(mockLeads);
    });

    it("should handle get leads by user error", async () => {
      const error = new Error("User not found");
      mockGet.mockRejectedValue(error);

      await expect(leadsApi.getLeadsByUser(999)).rejects.toThrow(
        "User not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/lead?userId=999");
    });
  });

  describe("getLeadsByStrategy", () => {
    it("should call get leads by strategy endpoint", async () => {
      const mockLeads: Lead[] = [
        {
          id: 1,
          userId: 1,
          strategyId: 1,
          name: "Strategy Lead 1",
          email: "strategy1@example.com",
          status: "active",
        },
        {
          id: 2,
          userId: 2,
          strategyId: 1,
          name: "Strategy Lead 2",
          email: "strategy2@example.com",
          status: "qualified",
        },
      ];

      mockGet.mockResolvedValue(mockLeads);

      const result = await leadsApi.getLeadsByStrategy(1);

      expect(mockGet).toHaveBeenCalledWith("/lead?strategyId=1");
      expect(result).toEqual(mockLeads);
    });

    it("should handle get leads by strategy error", async () => {
      const error = new Error("Strategy not found");
      mockGet.mockRejectedValue(error);

      await expect(leadsApi.getLeadsByStrategy(999)).rejects.toThrow(
        "Strategy not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/lead?strategyId=999");
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct Lead structure", () => {
      const validLead: Lead = {
        id: 1,
        userId: 1,
        strategyId: 1,
        name: "Test Lead",
        email: "test@example.com",
        status: "active",
      };

      expect(validLead).toHaveProperty("id");
      expect(validLead).toHaveProperty("userId");
      expect(validLead).toHaveProperty("strategyId");
      expect(validLead).toHaveProperty("name");
      expect(validLead).toHaveProperty("status");
    });

    it("should enforce correct CreateLeadDto structure", () => {
      const validCreateLeadDto: CreateLeadDto = {
        userId: 1,
        strategyId: 1,
        name: "Test Lead",
        email: "test@example.com",
      };

      expect(validCreateLeadDto).toHaveProperty("userId");
      expect(validCreateLeadDto).toHaveProperty("strategyId");
      expect(validCreateLeadDto).toHaveProperty("name");
    });
  });
});
