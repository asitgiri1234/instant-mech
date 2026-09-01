/**
 * Instant Mechanic — database seed.
 *
 * Idempotent: every run TRUNCATEs the operational tables and regenerates from
 * scratch, so `pnpm db:seed` can be run repeatedly without accumulating rows.
 * Faker is given a fixed seed, so two runs on the same day produce the same data
 * (timestamps are relative to "now", so they do shift between days).
 *
 * The generated history is deliberately *not* uniform random — a dashboard built
 * on uniform noise looks plausible until you chart it, and then every series is
 * flat. See STATUS SHAPE and VOLUME SHAPE below.
 */

import { faker } from "@faker-js/faker";
import { PrismaClient, type BookingStatus, type ServiceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ACTIVE_BOOKING_STATUSES,
  canTransition,
  type BookingStatus as SharedBookingStatus,
} from "@instant-mech/shared";

import {
  EMAIL_DOMAINS,
  FIRST_NAMES,
  LAST_NAMES,
  PLATE_SERIES_LETTERS,
  PLATE_STATE_CODES,
  SERVICES,
  VEHICLE_MODELS,
} from "./data/india.js";

const prisma = new PrismaClient();

faker.seed(20260412);

// ---------------------------------------------------------------------------
// Shape of the dataset
// ---------------------------------------------------------------------------

const CUSTOMER_COUNT = 60;
const SECOND_VEHICLE_COUNT = 30; // 60 customers + 30 second cars = 90 vehicles
const MECHANIC_COUNT = 24;
const BOOKING_COUNT = 600;
const FUTURE_BOOKING_COUNT = 22; // scheduled up to 7 days out
const DAYS_BACK = 90;
const DAYS_AHEAD = 7;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const NOW = new Date();

/**
 * VOLUME SHAPE. Roadside servicing tracks the working week: Friday is the peak
 * (people prepare for weekend travel), Sunday is the trough. Without this the
 * "bookings per day" chart is indistinguishable from noise.
 * Indexed by Date#getDay(), Sunday = 0.
 */
const DAY_OF_WEEK_WEIGHT = [0.45, 1.0, 1.05, 1.0, 1.05, 1.2, 0.75];

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 20;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const pick = <T,>(items: readonly T[]): T => faker.helpers.arrayElement(items);
const randInt = (min: number, max: number): number => faker.number.int({ min, max });
const randFloat = (min: number, max: number): number =>
  faker.number.float({ min, max, fractionDigits: 2 });
const chance = (probability: number): boolean =>
  faker.number.float({ min: 0, max: 1 }) < probability;

const LETTERS = PLATE_SERIES_LETTERS.split("");

/** Indian mobile numbers are 10 digits starting 6-9, usually written with +91. */
function indianPhone(): string {
  return `+91${pick(["6", "7", "8", "9"])}${faker.string.numeric(9)}`;
}

function fullName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

/** e.g. DL8CAF5030 — state code, RTO district, series letters, 4-digit number. */
function registrationPlate(): string {
  const state = pick(PLATE_STATE_CODES);
  const district = `${randInt(1, 9)}${chance(0.45) ? pick(LETTERS) : ""}`;
  const series = Array.from({ length: randInt(1, 2) }, () => pick(LETTERS)).join("");
  return `${state}${district}${series}${faker.string.numeric(4)}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

/** Money is billed in whole rupees and rounded to the nearest ten on the invoice. */
const roundToTen = (value: number): number => Math.round(value / 10) * 10;

// ---------------------------------------------------------------------------
// Wipe
// ---------------------------------------------------------------------------

async function wipe(): Promise<void> {
  // One statement, CASCADE, RESTART IDENTITY — faster and simpler than ordering
  // deleteMany() calls by foreign key, and it leaves the schema untouched.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "booking_events", "bookings", "vehicles", "customers",
      "mechanics", "services", "users"
    RESTART IDENTITY CASCADE
  `);
}

// ---------------------------------------------------------------------------
// Reference tables
// ---------------------------------------------------------------------------

async function seedAdminUser(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@instantmechanic.in";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "InstantMech@2026";

  await prisma.user.create({
    data: {
      email,
      name: "Ops Admin",
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });
}

async function seedServices() {
  await prisma.service.createMany({
    data: SERVICES.map((s) => ({
      name: s.name,
      category: s.category as ServiceCategory,
      basePrice: s.basePrice,
      estimatedMins: s.estimatedMins,
    })),
  });
  return prisma.service.findMany();
}

async function seedMechanics() {
  const specialtyPool = SERVICES.map((s) => ({
    value: s.category as ServiceCategory,
    weight: s.weight,
  }));

  await prisma.mechanic.createMany({
    data: Array.from({ length: MECHANIC_COUNT }, () => ({
      name: fullName(),
      phone: indianPhone(),
      specialty: faker.helpers.weightedArrayElement(specialtyPool),
      // Field staff who stay on the platform sit around 4.2-4.9; a few new or
      // struggling mechanics pull the bottom of the range down.
      rating: Number(randFloat(3.4, 5.0).toFixed(1)),
      onDuty: chance(0.7),
      joinedAt: faker.date.between({ from: addDays(NOW, -3 * 365), to: addDays(NOW, -20) }),
    })),
  });
  return prisma.mechanic.findMany();
}

async function seedCustomersAndVehicles() {
  const usedEmails = new Set<string>();
  const usedPlates = new Set<string>();

  const customerData = Array.from({ length: CUSTOMER_COUNT }, () => {
    const name = fullName();
    const [first = "user", last = "x"] = name.toLowerCase().split(" ");

    let email = `${first}.${last}@${pick(EMAIL_DOMAINS)}`;
    let suffix = 1;
    while (usedEmails.has(email)) {
      suffix += 1;
      email = `${first}.${last}${suffix}@${pick(EMAIL_DOMAINS)}`;
    }
    usedEmails.add(email);

    return {
      name,
      email,
      phone: indianPhone(),
      createdAt: faker.date.between({
        from: addDays(NOW, -2 * 365),
        to: addDays(NOW, -DAYS_BACK),
      }),
    };
  });

  await prisma.customer.createMany({ data: customerData });
  const customers = await prisma.customer.findMany();

  // Every customer owns one vehicle; a subset owns a second.
  const owners = [...customers, ...faker.helpers.arrayElements(customers, SECOND_VEHICLE_COUNT)];

  const vehicleData = owners.map((customer) => {
    const spec = pick(VEHICLE_MODELS);

    let plate = registrationPlate();
    while (usedPlates.has(plate)) plate = registrationPlate();
    usedPlates.add(plate);

    return {
      customerId: customer.id,
      make: spec.make,
      model: spec.model,
      // Never older than the model's India launch year.
      year: randInt(Math.max(spec.since, 2012), 2026),
      plate,
    };
  });

  await prisma.vehicle.createMany({ data: vehicleData });
  const vehicles = await prisma.vehicle.findMany();

  return { customers, vehicles };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

/**
 * Pick the scheduled datetimes. Past bookings are allocated across the last 90
 * days proportionally to DAY_OF_WEEK_WEIGHT; the remainder are scheduled into
 * the next 7 days.
 */
function buildScheduledDates(): Date[] {
  const pastTarget = BOOKING_COUNT - FUTURE_BOOKING_COUNT;

  const days = Array.from({ length: DAYS_BACK }, (_, i) => {
    const day = startOfDay(addDays(NOW, -(DAYS_BACK - 1 - i)));
    // GROWTH TREND. The business is growing, so recent weeks carry more volume
    // than the start of the window (~2x from oldest day to newest). This is both
    // realistic and what keeps the live board populated: a flat 600/90 would put
    // barely a dozen bookings in the last 48 hours.
    const growth = 0.65 + (1.35 - 0.65) * (i / (DAYS_BACK - 1));
    return { day, weight: (DAY_OF_WEEK_WEIGHT[day.getDay()] ?? 1) * growth };
  });

  const totalWeight = days.reduce((sum, d) => sum + d.weight, 0);
  const counts = days.map((d) => Math.round((pastTarget * d.weight) / totalWeight));

  // Rounding leaves us a few bookings over or under target; nudge random days
  // until the total is exact.
  let drift = pastTarget - counts.reduce((a, b) => a + b, 0);
  while (drift !== 0) {
    const i = randInt(0, counts.length - 1);
    const current = counts[i] ?? 0;
    if (drift > 0) {
      counts[i] = current + 1;
      drift -= 1;
    } else if (current > 0) {
      counts[i] = current - 1;
      drift += 1;
    }
  }

  const dates: Date[] = [];

  days.forEach((d, i) => {
    for (let n = 0; n < (counts[i] ?? 0); n += 1) {
      const slot = new Date(d.day);
      slot.setHours(randInt(WORKDAY_START_HOUR, WORKDAY_END_HOUR - 1), randInt(0, 59), 0, 0);
      dates.push(slot);
    }
  });

  for (let n = 0; n < FUTURE_BOOKING_COUNT; n += 1) {
    const slot = startOfDay(addDays(NOW, randInt(1, DAYS_AHEAD)));
    slot.setHours(randInt(WORKDAY_START_HOUR, WORKDAY_END_HOUR - 1), randInt(0, 59), 0, 0);
    dates.push(slot);
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * STATUS SHAPE. Status is a function of how long ago the job was scheduled, not
 * a coin flip:
 *   - scheduled in the future -> always PENDING
 *   - within the last 48h     -> a live spread across PENDING / ASSIGNED /
 *                                ON_THE_WAY / IN_PROGRESS, tilting towards
 *                                finished work at the older edge of the window
 *   - older than ~2 days      -> settled: ~92% COMPLETED, ~8% CANCELLED
 */
function pickStatus(scheduledAt: Date): BookingStatus {
  const age = NOW.getTime() - scheduledAt.getTime();

  if (age < 0) return "PENDING";

  if (age < 12 * HOUR) {
    return faker.helpers.weightedArrayElement<BookingStatus>([
      { value: "PENDING", weight: 24 },
      { value: "ASSIGNED", weight: 24 },
      { value: "ON_THE_WAY", weight: 20 },
      { value: "IN_PROGRESS", weight: 24 },
      { value: "COMPLETED", weight: 5 },
      { value: "CANCELLED", weight: 3 },
    ]);
  }

  if (age < 48 * HOUR) {
    return faker.helpers.weightedArrayElement<BookingStatus>([
      { value: "PENDING", weight: 14 },
      { value: "ASSIGNED", weight: 18 },
      { value: "ON_THE_WAY", weight: 15 },
      { value: "IN_PROGRESS", weight: 18 },
      { value: "COMPLETED", weight: 28 },
      { value: "CANCELLED", weight: 7 },
    ]);
  }

  return faker.helpers.weightedArrayElement<BookingStatus>([
    { value: "COMPLETED", weight: 92 },
    { value: "CANCELLED", weight: 8 },
  ]);
}

const CANCELLATION_NOTES = [
  "Cancelled by customer - rescheduling for later",
  "Cancelled by customer - got it done at a local garage",
  "Cancelled - customer unreachable on site",
  "Cancelled - vehicle not available at the pickup address",
  "Cancelled by ops - no mechanic available in the area",
  "Cancelled - duplicate booking",
];

const CREATION_NOTES = [
  "Booking created via customer app",
  "Booking created via website",
  "Booking created by call centre agent",
  "Booking created via WhatsApp bot",
];

interface PlannedEvent {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  note: string;
  at: Date;
}

/**
 * Build the event trail that lands a booking on `status`, with strictly
 * increasing timestamps that never run past now.
 */
function buildTimeline(args: {
  status: BookingStatus;
  scheduledAt: Date;
  createdAt: Date;
  estimatedMins: number;
  mechanicName: string | null;
}): PlannedEvent[] {
  const { status, scheduledAt, createdAt, estimatedMins, mechanicName } = args;
  const mech = mechanicName ?? "a mechanic";

  const tAssigned = new Date(scheduledAt.getTime() - randInt(20, 240) * MINUTE);
  const tOnTheWay = new Date(scheduledAt.getTime() - randInt(5, 25) * MINUTE);
  const tInProgress = new Date(scheduledAt.getTime() + randInt(0, 20) * MINUTE);
  const tCompleted = new Date(
    tInProgress.getTime() + Math.round(estimatedMins * randFloat(0.8, 1.35)) * MINUTE,
  );

  const steps: PlannedEvent[] = [
    { fromStatus: null, toStatus: "PENDING", note: pick(CREATION_NOTES), at: createdAt },
  ];

  const pushAssigned = () =>
    steps.push({
      fromStatus: "PENDING",
      toStatus: "ASSIGNED",
      note: `Assigned to ${mech}`,
      at: tAssigned,
    });
  const pushOnTheWay = () =>
    steps.push({
      fromStatus: "ASSIGNED",
      toStatus: "ON_THE_WAY",
      note: `${mech} en route to the customer location`,
      at: tOnTheWay,
    });
  const pushInProgress = () =>
    steps.push({
      fromStatus: "ON_THE_WAY",
      toStatus: "IN_PROGRESS",
      note: "Mechanic on site, work started",
      at: tInProgress,
    });

  switch (status) {
    case "PENDING":
      break;
    case "ASSIGNED":
      pushAssigned();
      break;
    case "ON_THE_WAY":
      pushAssigned();
      pushOnTheWay();
      break;
    case "IN_PROGRESS":
      pushAssigned();
      pushOnTheWay();
      pushInProgress();
      break;
    case "COMPLETED":
      pushAssigned();
      pushOnTheWay();
      pushInProgress();
      steps.push({
        fromStatus: "IN_PROGRESS",
        toStatus: "COMPLETED",
        note: chance(0.6) ? "Job completed, paid online" : "Job completed, cash collected",
        at: tCompleted,
      });
      break;
    case "CANCELLED": {
      // A booking can be cancelled from any pre-terminal state. Unassigned ones
      // can only have been cancelled while still PENDING.
      const cancelledAfter = mechanicName === null ? 0 : randInt(0, 2);
      if (cancelledAfter >= 1) pushAssigned();
      if (cancelledAfter >= 2) pushOnTheWay();

      const previous = steps[steps.length - 1];
      steps.push({
        fromStatus: previous?.toStatus ?? "PENDING",
        toStatus: "CANCELLED",
        note: pick(CANCELLATION_NOTES),
        at: new Date((previous?.at.getTime() ?? createdAt.getTime()) + randInt(5, 180) * MINUTE),
      });
      break;
    }
  }

  // Force strictly increasing timestamps (the raw values above can overlap when
  // the lead time is short).
  for (let i = 1; i < steps.length; i += 1) {
    const previous = steps[i - 1]!;
    const current = steps[i]!;
    if (current.at.getTime() <= previous.at.getTime()) {
      current.at = new Date(previous.at.getTime() + randInt(2, 15) * MINUTE);
    }
  }

  // Nothing may have happened in the future. If the tail overshoots, slide the
  // whole trail back so the gaps between events are preserved.
  const last = steps[steps.length - 1]!;
  const overshoot = last.at.getTime() - (NOW.getTime() - 2 * MINUTE);
  if (overshoot > 0) {
    for (const step of steps) step.at = new Date(step.at.getTime() - overshoot);
  }

  return steps;
}

interface PlannedBooking {
  code: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  mechanicId: string | null;
  status: BookingStatus;
  amount: number;
  scheduledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  events: PlannedEvent[];
}

async function seedBookings(
  customers: { id: string }[],
  vehicles: { id: string; customerId: string }[],
  services: {
    id: string;
    name: string;
    category: ServiceCategory;
    basePrice: unknown;
    estimatedMins: number;
  }[],
  mechanics: { id: string; name: string; specialty: ServiceCategory; onDuty: boolean }[],
) {
  const vehiclesByCustomer = new Map<string, { id: string }[]>();
  for (const vehicle of vehicles) {
    const list = vehiclesByCustomer.get(vehicle.customerId) ?? [];
    list.push(vehicle);
    vehiclesByCustomer.set(vehicle.customerId, list);
  }

  const servicePool = services.map((service) => ({
    value: service,
    weight: SERVICES.find((s) => s.name === service.name)?.weight ?? 5,
  }));

  const mechanicsById = new Map(mechanics.map((m) => [m.id, m]));

  /**
   * Mechanics currently holding an ASSIGNED / ON_THE_WAY / IN_PROGRESS job. The
   * database enforces this with a partial unique index; the seed has to respect
   * it or the insert fails.
   */
  const occupied = new Set<string>();
  const activeStatuses = new Set<string>(ACTIVE_BOOKING_STATUSES);

  const bookings: PlannedBooking[] = [];
  let downgradedForCapacity = 0;

  for (const scheduledAt of buildScheduledDates()) {
    const customer = pick(customers);
    const ownedVehicles = vehiclesByCustomer.get(customer.id) ?? [];
    if (ownedVehicles.length === 0) continue;
    const vehicle = pick(ownedVehicles);

    const service = faker.helpers.weightedArrayElement(servicePool);

    // Lead time: breakdowns and flat tyres are booked minutes ahead, planned
    // servicing days ahead.
    const isUrgent =
      service.category === "BREAKDOWN_ASSISTANCE" ||
      service.category === "BATTERY" ||
      service.category === "TYRES_AND_WHEELS";
    const leadMs = isUrgent ? randInt(10, 180) * MINUTE : randInt(6 * 60, 7 * 24 * 60) * MINUTE;

    let createdAt = new Date(scheduledAt.getTime() - leadMs);
    if (createdAt > NOW) createdAt = new Date(NOW.getTime() - randInt(10, 240) * MINUTE);

    let status = pickStatus(scheduledAt);

    // --- mechanic assignment ------------------------------------------------
    let mechanicId: string | null = null;

    if (activeStatuses.has(status)) {
      // Needs a mechanic who is not already on an active job.
      const free = mechanics.filter((m) => !occupied.has(m.id));
      const preferred = free.filter((m) => m.onDuty && m.specialty === service.category);
      const onDutyFree = free.filter((m) => m.onDuty);
      const pool = preferred.length > 0 ? preferred : onDutyFree.length > 0 ? onDutyFree : free;

      if (pool.length > 0) {
        const candidate = pick(pool);
        mechanicId = candidate.id;
        occupied.add(candidate.id);
      } else {
        // Every mechanic is busy — the job realistically sits unassigned.
        status = "PENDING";
        downgradedForCapacity += 1;
      }
    } else if (status === "COMPLETED") {
      // Finished jobs occupy nobody, so the uniqueness rule does not apply here.
      const bySpecialty = mechanics.filter((m) => m.specialty === service.category);
      mechanicId = (bySpecialty.length > 0 ? pick(bySpecialty) : pick(mechanics)).id;
    } else if (status === "CANCELLED") {
      // Roughly half of cancellations happen after a mechanic was assigned.
      mechanicId = chance(0.5) ? pick(mechanics).id : null;
    }

    // --- amount snapshot ----------------------------------------------------
    // A snapshot, never a join back to Service.basePrice. Older bookings are
    // priced slightly lower because list prices drift upward over time — which is
    // exactly why historical revenue must not be recomputed from the catalogue.
    const ageDays = Math.max(0, (NOW.getTime() - scheduledAt.getTime()) / DAY);
    const priceDrift = 1 - (ageDays / DAYS_BACK) * 0.06;
    // Parts, consumables and the occasional promo push the invoice off list price.
    const invoiceVariance = randFloat(0.97, 1.2);
    const amount = roundToTen(Number(service.basePrice) * priceDrift * invoiceVariance);

    const mechanicName = mechanicId ? (mechanicsById.get(mechanicId)?.name ?? null) : null;

    const events = buildTimeline({
      status,
      scheduledAt,
      createdAt,
      estimatedMins: service.estimatedMins,
      mechanicName,
    });

    const first = events[0]!;
    const last = events[events.length - 1]!;

    bookings.push({
      code: "", // assigned below, in chronological order
      customerId: customer.id,
      vehicleId: vehicle.id,
      serviceId: service.id,
      mechanicId,
      status,
      amount,
      scheduledAt,
      completedAt: status === "COMPLETED" ? last.at : null,
      // Keep the row and its first event in agreement even if the trail was slid
      // backwards to stay out of the future.
      createdAt: first.at,
      events,
    });
  }

  // Human-readable codes, numbered in creation order within each year.
  const perYear = new Map<number, number>();
  const chronological = [...bookings].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  for (const booking of chronological) {
    const year = booking.createdAt.getFullYear();
    const next = (perYear.get(year) ?? 0) + 1;
    perYear.set(year, next);
    booking.code = `IM-${year}-${String(next).padStart(4, "0")}`;
  }

  // Sanity check: every generated trail must follow a legal status path. This
  // uses the transition table from @instant-mech/shared, so the API and the web
  // app agree on what "legal" means.
  for (const booking of bookings) {
    for (const event of booking.events) {
      if (event.fromStatus === null) continue;
      const from = event.fromStatus as SharedBookingStatus;
      const to = event.toStatus as SharedBookingStatus;
      if (!canTransition(from, to)) {
        throw new Error(`Illegal transition generated for ${booking.code}: ${from} -> ${to}`);
      }
    }
  }

  await prisma.booking.createMany({
    data: bookings.map(({ events: _events, ...row }) => row),
  });

  const persisted = await prisma.booking.findMany({ select: { id: true, code: true } });
  const idByCode = new Map(persisted.map((b) => [b.code, b.id]));

  await prisma.bookingEvent.createMany({
    data: bookings.flatMap((booking) =>
      booking.events.map((event) => ({
        bookingId: idByCode.get(booking.code)!,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        createdAt: event.at,
      })),
    ),
  });

  return { downgradedForCapacity };
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

async function printSummary(): Promise<void> {
  const [customers, vehicles, services, mechanics, bookings, events, users] = await Promise.all([
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.service.count(),
    prisma.mechanic.count(),
    prisma.booking.count(),
    prisma.bookingEvent.count(),
    prisma.user.count(),
  ]);

  const rows: [string, number][] = [
    ["customers", customers],
    ["vehicles", vehicles],
    ["services", services],
    ["mechanics", mechanics],
    ["bookings", bookings],
    ["booking_events", events],
    ["users", users],
  ];

  console.log("\nROW COUNTS");
  console.log("-".repeat(34));
  for (const [table, count] of rows) {
    console.log(`  ${table.padEnd(20)}${String(count).padStart(8)}`);
  }
  console.log("-".repeat(34));
  console.log(
    `  ${"TOTAL".padEnd(20)}${String(rows.reduce((a, [, n]) => a + n, 0)).padStart(8)}`,
  );

  const byStatus = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { amount: true },
  });

  const order: BookingStatus[] = [
    "PENDING",
    "ASSIGNED",
    "ON_THE_WAY",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  const sorted = order
    .map((status) => byStatus.find((r) => r.status === status))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  console.log("\nBOOKINGS BY STATUS");
  console.log("-".repeat(60));
  for (const row of sorted) {
    const count = row._count._all;
    const pct = ((count / bookings) * 100).toFixed(1);
    const bar = "#".repeat(Math.max(1, Math.round((count / bookings) * 40)));
    console.log(`  ${row.status.padEnd(13)}${String(count).padStart(5)}  ${pct.padStart(5)}%  ${bar}`);
  }
  console.log("-".repeat(60));

  const revenue = sorted.find((r) => r.status === "COMPLETED")?._sum.amount;
  console.log(`  Revenue booked from COMPLETED jobs: ${INR.format(Number(revenue ?? 0))}`);

  const activeWhere = { status: { in: [...ACTIVE_BOOKING_STATUSES] } };
  const activeCount = await prisma.booking.count({ where: activeWhere });
  const distinctActiveMechanics = await prisma.booking.findMany({
    where: activeWhere,
    select: { mechanicId: true },
    distinct: ["mechanicId"],
  });
  console.log(
    `  Active jobs: ${activeCount} held by ${distinctActiveMechanics.length} distinct mechanics ` +
      `(equal by construction — the partial unique index would reject anything else)`,
  );

  const last48h = await prisma.booking.count({
    where: { scheduledAt: { gte: new Date(NOW.getTime() - 48 * HOUR), lte: NOW } },
  });
  const future = await prisma.booking.count({ where: { scheduledAt: { gt: NOW } } });
  console.log(`  Scheduled in the last 48h: ${last48h}    Scheduled in the future: ${future}`);
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Seeding Instant Mechanic database...");

  await wipe();
  await seedAdminUser();

  const services = await seedServices();
  const mechanics = await seedMechanics();
  const { customers, vehicles } = await seedCustomersAndVehicles();

  const { downgradedForCapacity } = await seedBookings(customers, vehicles, services, mechanics);

  if (downgradedForCapacity > 0) {
    console.log(
      `  note: ${downgradedForCapacity} booking(s) left PENDING — every mechanic was already on an active job`,
    );
  }

  await printSummary();

  console.log(
    `\nAdmin login: ${process.env.SEED_ADMIN_EMAIL ?? "admin@instantmechanic.in"} / ` +
      `${process.env.SEED_ADMIN_PASSWORD ?? "InstantMech@2026"}   (see .env.example)`,
  );
  console.log("Seed complete.\n");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
