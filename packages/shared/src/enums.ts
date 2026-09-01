/**
 * Domain enums, defined as plain const objects so both the browser bundle and
 * the API can use them as *values* without either side importing the generated
 * Prisma client. These are mirrored by the enums in apps/api/prisma/schema.prisma —
 * keep the two in sync.
 */

export const BookingStatus = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  ON_THE_WAY: "ON_THE_WAY",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BOOKING_STATUSES = Object.values(BookingStatus);

/**
 * Statuses that occupy a mechanic. The database enforces at most one booking per
 * mechanic in these states via a partial unique index (see the
 * `one_active_booking_per_mechanic` migration).
 */
export const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.ASSIGNED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.IN_PROGRESS,
] as const;

export type ActiveBookingStatus = (typeof ACTIVE_BOOKING_STATUSES)[number];

/** A booking in one of these states will never change again. */
export const TERMINAL_BOOKING_STATUSES = [
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
] as const;

/** The only status changes the domain considers legal. */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
  ASSIGNED: [BookingStatus.ON_THE_WAY, BookingStatus.CANCELLED],
  ON_THE_WAY: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  IN_PROGRESS: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export function isActiveBookingStatus(status: BookingStatus): status is ActiveBookingStatus {
  return (ACTIVE_BOOKING_STATUSES as readonly BookingStatus[]).includes(status);
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_STATUS_TRANSITIONS[from].includes(to);
}

export const ServiceCategory = {
  PERIODIC_SERVICE: "PERIODIC_SERVICE",
  BREAKDOWN_ASSISTANCE: "BREAKDOWN_ASSISTANCE",
  BATTERY: "BATTERY",
  TYRES_AND_WHEELS: "TYRES_AND_WHEELS",
  BRAKES_AND_SUSPENSION: "BRAKES_AND_SUSPENSION",
  AC_SERVICE: "AC_SERVICE",
  DENT_AND_PAINT: "DENT_AND_PAINT",
  INSPECTION: "INSPECTION",
} as const;

export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];

export const SERVICE_CATEGORIES = Object.values(ServiceCategory);

export const UserRole = {
  ADMIN: "ADMIN",
  DISPATCHER: "DISPATCHER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
