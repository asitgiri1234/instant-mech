-- Hand-written migration: Prisma's schema language cannot express a PARTIAL
-- unique index, so this is raw SQL.
--
-- Business rule: a mechanic may hold at most ONE booking that is actively
-- occupying them. ASSIGNED / ON_THE_WAY / IN_PROGRESS all mean "this mechanic is
-- currently committed to this job"; COMPLETED, CANCELLED and PENDING do not.
--
-- Enforcing this in the database rather than in application code means a race
-- between two dispatchers assigning the same mechanic fails loudly with a unique
-- violation instead of silently double-booking them.
--
-- "mechanicId" is nullable and NULLs are never equal in a unique index, so any
-- number of unassigned bookings coexist happily.

CREATE UNIQUE INDEX "bookings_one_active_per_mechanic"
    ON "bookings" ("mechanicId")
    WHERE "status" IN ('ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS');
