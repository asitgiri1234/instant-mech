import type { BookingStatus, ServiceCategory, UserRole } from "./enums.js";

/**
 * Wire-shape types shared by the API and the dashboard.
 *
 * Dates cross the wire as ISO-8601 strings and money crosses as a number of
 * rupees, so these deliberately do not reuse the Prisma model types (which carry
 * `Date` and `Decimal`).
 */

export type ISODateString = string;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: ISODateString;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  /** Current list price in INR. Bookings snapshot this at creation time. */
  basePrice: number;
  estimatedMins: number;
}

export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  specialty: ServiceCategory;
  /** 1.0 – 5.0, one decimal place. */
  rating: number;
  onDuty: boolean;
  joinedAt: ISODateString;
}

export interface Booking {
  id: string;
  /** Human-readable reference, e.g. "IM-2026-0412". */
  code: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  mechanicId: string | null;
  status: BookingStatus;
  /**
   * Price in INR charged for this booking, snapshotted from Service.basePrice at
   * creation. Intentionally NOT a lookup — list prices change and historical
   * revenue must not move with them.
   */
  amount: number;
  scheduledAt: ISODateString;
  completedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  note: string;
  createdAt: ISODateString;
}

/** A booking joined with everything the dashboard needs to render one row. */
export interface BookingWithRelations extends Booking {
  customer: Customer;
  vehicle: Vehicle;
  service: Service;
  mechanic: Mechanic | null;
}

export interface BookingDetail extends BookingWithRelations {
  events: BookingEvent[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: ISODateString;
}
