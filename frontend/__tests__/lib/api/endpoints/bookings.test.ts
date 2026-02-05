import { mock } from "bun:test";
import { BookingsApi } from "@/lib/api/endpoints/bookings";
import { Booking, CreateBookingDto } from "@/types";
import { ApiClient } from "@/lib/api/client";

// Mock removed - use Bun mocks instead

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

describe("BookingsApi", () => {
  let bookingsApi: BookingsApi;

  beforeEach(() => {
    // Create a new instance
    bookingsApi = new BookingsApi(mockClient);
  });

  describe("getBookings", () => {
    it("should call get bookings endpoint", async () => {
      const mockBookings: Booking[] = [
        {
          id: 1,
          userId: 1,
          leadId: 1,
          bookingType: "consultation",
          details: {
            date: "2024-01-15",
            time: "14:00",
            duration: 60,
            notes: "Initial consultation call",
          },
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          leadId: 2,
          bookingType: "demo",
          details: {
            date: "2024-01-16",
            time: "10:00",
            duration: 90,
            notes: "Product demonstration",
          },
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGet.mockResolvedValue(mockBookings);

      const result = await bookingsApi.getBookings();

      expect(mockGet).toHaveBeenCalledWith("/booking");
      expect(result).toEqual(mockBookings);
    });

    it("should handle get bookings error", async () => {
      const error = new Error("Failed to fetch bookings");
      mockGet.mockRejectedValue(error);

      await expect(bookingsApi.getBookings()).rejects.toThrow(
        "Failed to fetch bookings"
      );
      expect(mockGet).toHaveBeenCalledWith("/booking");
    });
  });

  describe("getBooking", () => {
    it("should call get booking by id endpoint", async () => {
      const mockBooking: Booking = {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: "consultation",
        details: {
          date: "2024-01-15",
          time: "14:00",
          duration: 60,
          notes: "Initial consultation call",
        },
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGet.mockResolvedValue(mockBooking);

      const result = await bookingsApi.getBooking(1);

      expect(mockGet).toHaveBeenCalledWith("/booking/1");
      expect(result).toEqual(mockBooking);
    });

    it("should handle get booking error", async () => {
      const error = new Error("Booking not found");
      mockGet.mockRejectedValue(error);

      await expect(bookingsApi.getBooking(999)).rejects.toThrow(
        "Booking not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/booking/999");
    });
  });

  describe("createBooking", () => {
    it("should call create booking endpoint with correct data", async () => {
      const createBookingData: CreateBookingDto = {
        userId: 1,
        leadId: 1,
        bookingType: "consultation",
        details: {
          date: "2024-01-20",
          time: "15:00",
          duration: 60,
          notes: "Follow-up consultation",
        },
        status: "pending",
      };

      const mockCreatedBooking: Booking = {
        id: 3,
        userId: 1,
        leadId: 1,
        bookingType: "consultation",
        details: {
          date: "2024-01-20",
          time: "15:00",
          duration: 60,
          notes: "Follow-up consultation",
        },
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPost.mockResolvedValue(mockCreatedBooking);

      const result = await bookingsApi.createBooking(createBookingData);

      expect(mockPost).toHaveBeenCalledWith("/booking", createBookingData);
      expect(result).toEqual(mockCreatedBooking);
    });

    it("should handle create booking error", async () => {
      const createBookingData: CreateBookingDto = {
        userId: 1,
        leadId: 999, // Invalid lead ID
        bookingType: "consultation",
        details: {
          date: "2024-01-20",
          time: "15:00",
          duration: 60,
        },
      };

      const error = new Error("Invalid lead");
      mockPost.mockRejectedValue(error);

      await expect(
        bookingsApi.createBooking(createBookingData)
      ).rejects.toThrow("Invalid lead");
      expect(mockPost).toHaveBeenCalledWith("/booking", createBookingData);
    });

    it("should handle create booking without lead", async () => {
      const createBookingData: CreateBookingDto = {
        userId: 1,
        bookingType: "general",
        details: {
          date: "2024-01-20",
          time: "15:00",
          duration: 60,
          notes: "General meeting",
        },
      };

      const mockCreatedBooking: Booking = {
        id: 4,
        userId: 1,
        bookingType: "general",
        details: {
          date: "2024-01-20",
          time: "15:00",
          duration: 60,
          notes: "General meeting",
        },
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPost.mockResolvedValue(mockCreatedBooking);

      const result = await bookingsApi.createBooking(createBookingData);

      expect(mockPost).toHaveBeenCalledWith("/booking", createBookingData);
      expect(result).toEqual(mockCreatedBooking);
    });
  });

  describe("updateBooking", () => {
    it("should call update booking endpoint with correct data", async () => {
      const updateData = {
        bookingType: "demo",
        status: "confirmed",
        details: {
          date: "2024-01-25",
          time: "16:00",
          duration: 90,
          notes: "Updated demo session",
        },
      };

      const mockUpdatedBooking: Booking = {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: "demo",
        details: {
          date: "2024-01-25",
          time: "16:00",
          duration: 90,
          notes: "Updated demo session",
        },
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPatch.mockResolvedValue(mockUpdatedBooking);

      const result = await bookingsApi.updateBooking(1, updateData);

      expect(mockPatch).toHaveBeenCalledWith("/booking/1", updateData);
      expect(result).toEqual(mockUpdatedBooking);
    });

    it("should handle update booking error", async () => {
      const updateData = {
        status: "invalid-status",
      };

      const error = new Error("Invalid status value");
      mockPatch.mockRejectedValue(error);

      await expect(bookingsApi.updateBooking(1, updateData)).rejects.toThrow(
        "Invalid status value"
      );
      expect(mockPatch).toHaveBeenCalledWith("/booking/1", updateData);
    });
  });

  describe("deleteBooking", () => {
    it("should call delete booking endpoint", async () => {
      mockDelete.mockResolvedValue(undefined);

      await bookingsApi.deleteBooking(1);

      expect(mockDelete).toHaveBeenCalledWith("/booking/1");
    });

    it("should handle delete booking error", async () => {
      const error = new Error("Booking not found");
      mockDelete.mockRejectedValue(error);

      await expect(bookingsApi.deleteBooking(999)).rejects.toThrow(
        "Booking not found"
      );
      expect(mockDelete).toHaveBeenCalledWith("/booking/999");
    });
  });

  describe("getBookingsByUser", () => {
    it("should call get bookings by user endpoint", async () => {
      const mockBookings: Booking[] = [
        {
          id: 1,
          userId: 1,
          leadId: 1,
          bookingType: "consultation",
          details: {
            date: "2024-01-15",
            time: "14:00",
            duration: 60,
          },
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          leadId: 2,
          bookingType: "demo",
          details: {
            date: "2024-01-16",
            time: "10:00",
            duration: 90,
          },
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGet.mockResolvedValue(mockBookings);

      const result = await bookingsApi.getBookingsByUser(1);

      expect(mockGet).toHaveBeenCalledWith("/booking?userId=1");
      expect(result).toEqual(mockBookings);
    });

    it("should handle get bookings by user error", async () => {
      const error = new Error("User not found");
      mockGet.mockRejectedValue(error);

      await expect(bookingsApi.getBookingsByUser(999)).rejects.toThrow(
        "User not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/booking?userId=999");
    });
  });

  describe("getBookingsByLead", () => {
    it("should call get bookings by lead endpoint", async () => {
      const mockBookings: Booking[] = [
        {
          id: 1,
          userId: 1,
          leadId: 1,
          bookingType: "consultation",
          details: {
            date: "2024-01-15",
            time: "14:00",
            duration: 60,
          },
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 2,
          leadId: 1,
          bookingType: "follow-up",
          details: {
            date: "2024-01-20",
            time: "15:00",
            duration: 45,
          },
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGet.mockResolvedValue(mockBookings);

      const result = await bookingsApi.getBookingsByLead(1);

      expect(mockGet).toHaveBeenCalledWith("/booking?leadId=1");
      expect(result).toEqual(mockBookings);
    });

    it("should handle get bookings by lead error", async () => {
      const error = new Error("Lead not found");
      mockGet.mockRejectedValue(error);

      await expect(bookingsApi.getBookingsByLead(999)).rejects.toThrow(
        "Lead not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/booking?leadId=999");
    });
  });

  describe("getBookingsByDateRange", () => {
    it("should call get bookings by date range endpoint", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";
      const mockBookings: Booking[] = [
        {
          id: 1,
          userId: 1,
          leadId: 1,
          bookingType: "consultation",
          details: {
            date: "2024-01-15",
            time: "14:00",
            duration: 60,
          },
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGet.mockResolvedValue(mockBookings);

      const result = await bookingsApi.getBookingsByDateRange(
        startDate,
        endDate
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/booking?startDate=2024-01-01&endDate=2024-01-31"
      );
      expect(result).toEqual(mockBookings);
    });

    it("should handle get bookings by date range error", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";
      const error = new Error("Invalid date range");
      mockGet.mockRejectedValue(error);

      await expect(
        bookingsApi.getBookingsByDateRange(startDate, endDate)
      ).rejects.toThrow("Invalid date range");
      expect(mockGet).toHaveBeenCalledWith(
        "/booking?startDate=2024-01-01&endDate=2024-01-31"
      );
    });
  });

  describe("updateBookingStatus", () => {
    it("should call update booking status endpoint", async () => {
      const status = "confirmed";
      const mockUpdatedBooking: Booking = {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: "consultation",
        details: {
          date: "2024-01-15",
          time: "14:00",
          duration: 60,
        },
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPatch.mockResolvedValue(mockUpdatedBooking);

      const result = await bookingsApi.updateBookingStatus(1, status);

      expect(mockPatch).toHaveBeenCalledWith("/booking/1/status", {
        status,
      });
      expect(result).toEqual(mockUpdatedBooking);
    });

    it("should handle update booking status error", async () => {
      const status = "invalid-status";
      const error = new Error("Invalid status value");
      mockPatch.mockRejectedValue(error);

      await expect(bookingsApi.updateBookingStatus(1, status)).rejects.toThrow(
        "Invalid status value"
      );
      expect(mockPatch).toHaveBeenCalledWith("/booking/1/status", {
        status,
      });
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct Booking structure", () => {
      const validBooking: Booking = {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: "consultation",
        details: {
          date: "2024-01-15",
          time: "14:00",
          duration: 60,
        },
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validBooking).toHaveProperty("id");
      expect(validBooking).toHaveProperty("userId");
      expect(validBooking).toHaveProperty("bookingType");
      expect(validBooking).toHaveProperty("details");
      expect(validBooking).toHaveProperty("status");
      expect(validBooking).toHaveProperty("createdAt");
      expect(validBooking).toHaveProperty("updatedAt");
    });

    it("should enforce correct CreateBookingDto structure", () => {
      const validCreateBookingDto: CreateBookingDto = {
        userId: 1,
        leadId: 1,
        bookingType: "consultation",
        details: {
          date: "2024-01-15",
          time: "14:00",
          duration: 60,
        },
      };

      expect(validCreateBookingDto).toHaveProperty("userId");
      expect(validCreateBookingDto).toHaveProperty("bookingType");
      expect(validCreateBookingDto).toHaveProperty("details");
    });
  });
});
