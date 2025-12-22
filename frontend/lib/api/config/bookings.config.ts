/**
 * Bookings API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { Booking, CreateBookingDto } from "@/types";

export const bookingsConfig: EndpointGroup = {
  getBookings: {
    method: "GET",
    path: "/booking",
    queryParams: [
      { name: "subAccountId", type: "number" },
      { name: "userId", type: "number" },
      { name: "leadId", type: "number" },
      { name: "startDate", type: "string" },
      { name: "endDate", type: "string" },
    ],
    responseType: {} as Booking[],
  },

  getBooking: {
    method: "GET",
    path: "/booking/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as Booking,
  },

  createBooking: {
    method: "POST",
    path: "/booking",
    requiresBody: true,
    bodyType: {} as CreateBookingDto,
    responseType: {} as Booking,
  },

  updateBooking: {
    method: "PATCH",
    path: "/booking/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as Partial<CreateBookingDto>,
    responseType: {} as Booking,
  },

  deleteBooking: {
    method: "DELETE",
    path: "/booking/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as void,
  },

  getBookingsByUser: {
    method: "GET",
    path: "/booking",
    queryParams: [
      { name: "userId", required: true, type: "number" },
    ],
    responseType: {} as Booking[],
  },

  getBookingsByLead: {
    method: "GET",
    path: "/booking",
    queryParams: [
      { name: "leadId", required: true, type: "number" },
    ],
    responseType: {} as Booking[],
  },

  getBookingsByDateRange: {
    method: "GET",
    path: "/booking",
    queryParams: [
      { name: "startDate", required: true, type: "string" },
      { name: "endDate", required: true, type: "string" },
    ],
    responseType: {} as Booking[],
  },

  updateBookingStatus: {
    method: "PATCH",
    path: "/booking/:id/status",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as { status: string },
    responseType: {} as Booking,
  },
};

