import {
  BOOKING_STATUSES,
  BookingStatus,
  type BookingWithRelations,
} from "@instant-mech/shared";

/**
 * Placeholder home page. The dashboard UI lands in a later task — this exists
 * only to prove that apps/web resolves and typechecks against packages/shared.
 */

// Type-only import used for real, so `tsc --noEmit` would fail if the workspace
// link or the generated .d.ts were broken.
const EXAMPLE_COLUMNS: ReadonlyArray<keyof BookingWithRelations> = [
  "code",
  "status",
  "amount",
  "scheduledAt",
];

export default function Home() {
  const defaultStatus: BookingStatus = BookingStatus.PENDING;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Instant Mechanic</h1>
      <p className="text-muted-foreground text-sm">
        Live service operations dashboard — scaffold only. Database is seeded; API and UI
        are not built yet.
      </p>
      <dl className="text-sm">
        <dt className="font-medium">Statuses from @instant-mech/shared</dt>
        <dd className="text-muted-foreground">{BOOKING_STATUSES.join(" → ")}</dd>
        <dt className="mt-2 font-medium">Default status</dt>
        <dd className="text-muted-foreground">{defaultStatus}</dd>
        <dt className="mt-2 font-medium">Planned booking columns</dt>
        <dd className="text-muted-foreground">{EXAMPLE_COLUMNS.join(", ")}</dd>
      </dl>
    </main>
  );
}
