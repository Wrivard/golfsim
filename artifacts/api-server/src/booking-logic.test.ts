import assert from "node:assert/strict";
import test from "node:test";
import { addMinutes } from "date-fns";
import { getOptimizedStartTimes, type BookingRecord, type DaySchedule, type Simulator, validateBayAssignment } from "./booking-logic";
import { originalBayScore, baselineBayForRequest } from "./booking-baseline.fixture";
import { measureFreeSegment, measurePlacement } from "./booking-scoring";

// Captured from the original booking-logic.ts before changing its scoring.
// Each ordered entry is [local start, assigned bay, original score]; valid
// entries record every valid bay, not only the selected one.
const baseline = [
  {
    name: "empty", duration: 60, bays: ["3"], bookings: [] as Array<[string, string, string]>,
    schedule: [8, 15, 16],
    valid: ["08:00:3", "08:30:3", "09:00:3", "09:30:3", "10:00:3", "10:30:3", "11:00:3", "11:30:3", "12:00:3", "12:30:3", "13:00:3", "13:30:3", "14:00:3", "14:30:3", "15:00:3"],
    ranked: ["08:00:3:5", "15:00:3:0", "09:30:3:-3", "10:00:3:-3", "13:00:3:-3", "13:30:3:-3", "08:30:3:-4", "09:00:3:-4", "14:00:3:-4", "14:30:3:-4", "10:30:3:-6", "12:30:3:-6", "11:00:3:-7", "12:00:3:-7", "11:30:3:-8"],
  },
  {
    name: "orphan", duration: 60, bays: ["3"], bookings: [["3", "10:30", "12:30"]],
    schedule: [8, 12, 13],
    valid: ["08:00:3", "08:30:3", "09:00:3", "09:30:3"],
    ranked: ["09:30:3:6", "08:00:3:4", "09:00:3:-2", "08:30:3:-3"],
  },
  {
    name: "preexisting", duration: 60, bays: ["1"], bookings: [["1", "09:30", "10:30"]],
    schedule: [8, 12, 13],
    valid: ["08:00:1", "11:00:1", "12:00:1"],
    ranked: ["12:00:1:4", "08:00:1:2", "11:00:1:-2"],
  },
  {
    name: "mixed", duration: 120, bays: ["1", "3"], bookings: [["1", "10:00", "12:00"], ["3", "08:30", "10:30"]],
    schedule: [8, 12, 13],
    valid: ["08:00:1", "10:30:3", "11:00:3"],
    ranked: ["08:00:1:9", "10:30:3:5", "11:00:3:2"],
  },
  {
    name: "improvement", duration: 180, bays: ["1", "2", "3", "4"],
    bookings: [["2", "13:30", "14:30"], ["3", "10:00", "13:00"], ["4", "10:30", "11:30"]],
    schedule: [8, 14, 15],
    valid: ["08:00:1", "08:00:2", "09:00:1", "09:00:2", "10:00:1", "10:00:2", "11:00:1", "11:30:4", "12:00:1", "12:00:4"],
    ranked: ["11:30:4:6"],
  },
] as const;

const date = new Date(2026, 5, 8);
function at(time: string): Date {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(2026, 5, 8, hour, minute);
}
function fixtures(row: typeof baseline[number]) {
  const [openHour, lastBookingHour, closeHour] = row.schedule;
  const schedule: DaySchedule = {
    openHour, openMinute: 0, lastBookingHour, lastBookingMinute: 0, closeHour, closeMinute: 0,
  };
  const bays: Simulator[] = row.bays.map(id => ({ id, name: id }));
  const bookings: BookingRecord[] = row.bookings.map(([simulatorId, start, end], index) => ({
    id: String(index), simulatorId, startTime: at(start).toISOString(),
    endTime: at(end).toISOString(), customerName: "test",
  }));
  return { schedule, bays, bookings };
}
const time = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

test("original valid slot/bay sets remain identical; baseline vs new deterministic rankings", () => {
  let baselineWaste = 0;
  let newWaste = 0;
  for (const row of baseline) {
    const { schedule, bays, bookings } = fixtures(row);
    const slots = getOptimizedStartTimes(date, row.duration, bookings, bays, schedule);
    assert.deepEqual(slots.flatMap(s => s.allBays!.filter(b => b.isValid).map(b => `${time(s.time)}:${b.bayId}`)), row.valid, row.name);
    const ranked = slots.slice().sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
    for (const entry of row.ranked) {
      const [h, m, bayId, rawScore] = entry.split(":");
      const fixtureSlot = slots.find(s => time(s.time) === `${h}:${m}`)!;
      const evaluation = fixtureSlot.allBays!.find(b => b.bayId === bayId)!;
      assert.equal(originalBayScore(new Date(fixtureSlot.time), row.duration, bayId, evaluation.debug!.gapBefore, evaluation.debug!.gapAfter, bookings), Number(rawScore), `${row.name} ${entry}`);
    }
    const [hour, minute, oldBay] = row.ranked[0].split(":");
    const old = slots.find(s => time(s.time) === `${hour}:${minute}`)!;
    const oldEval = old.allBays!.find(b => b.bayId === oldBay)!;
    baselineWaste += oldEval.metrics!.newlyUnsellableMinutes;
    newWaste += ranked[0].allBays!.find(b => b.bayId === ranked[0].assignedBayId)!.metrics!.newlyUnsellableMinutes;
    for (const slot of slots) {
      assert.equal(slot.score, slot.breakdown!.total);
      assert.equal(Boolean(slot.label), slot.score === ranked[0].score);
    }
  }
  assert.equal(baselineWaste, 30);
  assert.equal(newWaste, 0);
  console.log(`Captured baseline top choices: ${baseline.map(b => b.ranked[0]).join(", ")}; newly unsellable minutes: baseline=${baselineWaste}, new=${newWaste}`);
});

test("30-minute orphan loses to a sellable remainder even with booking proximity", () => {
  const { schedule, bays, bookings } = fixtures(baseline[1]);
  const slots = getOptimizedStartTimes(date, 60, bookings, bays, schedule);
  const byTime = (t: string) => slots.find(s => time(s.time) === t)!;
  assert.equal(byTime("09:00").allBays![0].metrics!.newlyUnsellableMinutes, 30);
  assert.equal(byTime("09:30").allBays![0].metrics!.newlyUnsellableMinutes, 0);
  assert.ok(byTime("09:30").score > byTime("09:00").score);
});

test("30-minute orphan determines the chosen bay at the same requested time", () => {
  const bays = [{ id: "3", name: "3" }, { id: "4", name: "4" }];
  const bookings: BookingRecord[] = [{
    id: "a", simulatorId: "3", startTime: at("10:30").toISOString(),
    endTime: at("12:30").toISOString(), customerName: "test",
  }];
  const schedule = fixtures(baseline[1]).schedule;
  const slot = getOptimizedStartTimes(date, 60, bookings, bays, schedule)
    .find(s => time(s.time) === "09:00")!;
  // Bay 3's remaining 09:00-10:30 gap would become a 30m orphan;
  // bay 4's open stretch remains usable.
  assert.equal(slot.allBays!.find(b => b.bayId === "3")!.metrics!.newlyUnsellableMinutes, 30);
  assert.equal(slot.allBays!.find(b => b.bayId === "4")!.metrics!.newlyUnsellableMinutes, 0);
  assert.equal(slot.assignedBayId, "4");
});

test("preexisting waste is not charged as newly created", () => {
  const { schedule, bays, bookings } = fixtures(baseline[2]);
  const slot = getOptimizedStartTimes(date, 60, bookings, bays, schedule).find(s => time(s.time) === "08:00")!;
  assert.equal(slot.allBays![0].metrics!.existingUnsellableMinutes, 30);
  assert.equal(slot.allBays![0].metrics!.remainingUnsellableMinutes, 30);
  assert.equal(slot.allBays![0].metrics!.newlyUnsellableMinutes, 0);
});

test("start grid distinguishes hourly and half-hour bays, including sellable minutes", () => {
  const start = at("08:30"), end = at("09:30");
  const args = [start, end, at("08:00"), at("11:00"), at("08:00"), at("12:00"), at("13:00")] as const;
  const hourly = measurePlacement(...args, 60);
  const halfHourly = measurePlacement(...args, 30);
  assert.equal(hourly.existingUnsellableMinutes, 0);
  assert.equal(hourly.newlyUnsellableMinutes, 60);
  assert.equal(halfHourly.newlyUnsellableMinutes, 30);
  const slots = getOptimizedStartTimes(date, 60, [], [{ id: "1", name: "1" }, { id: "3", name: "3" }]);
  assert.deepEqual(slots.find(s => time(s.time) === "08:30")!.allBays!.map(b => b.bayId), ["3"]);
  assert.equal(validateBayAssignment(date, "08:30", 60, "1", [], [{ id: "1", name: "1" }, { id: "3", name: "3" }]).valid, false);
});

test("240-minute offers retain bay grids, last-start and closing boundaries", () => {
  const bays = [{ id: "2", name: "2" }, { id: "4", name: "4" }];
  const slots = getOptimizedStartTimes(date, 240, [], bays);
  assert.deepEqual(slots.find(s => time(s.time) === "08:30")!.allBays!.map(b => b.bayId), ["4"]);
  assert.deepEqual(slots.find(s => time(s.time) === "19:00")!.allBays!.map(b => b.bayId), ["2", "4"]);
  assert.equal(slots.some(s => time(s.time) === "19:30"), false);
  assert.equal(validateBayAssignment(date, "19:00", 240, "2", [], bays).valid, true);
});

test("nonzero opening minute preserves original wall-clock eligibility quirk", () => {
  const bays: Simulator[] = [1, 2, 3, 4].map(n => ({ id: String(n), name: String(n) }));
  const schedule: DaySchedule = {
    openHour: 8, openMinute: 30, lastBookingHour: 11, lastBookingMinute: 30,
    closeHour: 12, closeMinute: 30,
  };
  const bookings: BookingRecord[] = [{
    id: "a", simulatorId: "3", startTime: at("09:00").toISOString(),
    endTime: at("10:00").toISOString(), customerName: "test",
  }];
  const slots = getOptimizedStartTimes(date, 60, bookings, bays, schedule);
  assert.deepEqual(slots.map(s => `${time(s.time)}:${s.allBays!.filter(b => b.isValid).map(b => b.bayId).join(",")}`), [
    "08:30:4", "09:00:1,2,4", "09:30:4", "10:00:1,2,3,4",
    "10:30:3,4", "11:00:1,2,3,4", "11:30:3,4",
  ]);
  assert.deepEqual(slots.map(s => s.allBays!.map(b => b.bayId).join(",")), [
    "3,4", "1,2,3,4", "3,4", "1,2,3,4", "3,4", "1,2,3,4", "3,4",
  ]);
  assert.equal(validateBayAssignment(date, "08:30", 60, "1", bookings, bays, schedule).valid, false);
  assert.equal(validateBayAssignment(date, "09:00", 60, "1", bookings, bays, schedule).valid, true);
  const gridArgs = [at("08:30"), at("12:30"), at("08:30"), at("11:30"), at("12:30"), 60] as const;
  assert.equal(measureFreeSegment(...gridArgs).startsByDuration[0], 0);
  assert.equal(measureFreeSegment(...gridArgs, [60, 30]).startsByDuration[0], 3);
});

test("Meilleur choix labels the relative best even when every score is poor", () => {
  const schedule: DaySchedule = {
    openHour: 8, openMinute: 0, lastBookingHour: 8, lastBookingMinute: 30,
    closeHour: 9, closeMinute: 30,
  };
  const slots = getOptimizedStartTimes(date, 60, [], [{ id: "3", name: "3" }], schedule);
  assert.deepEqual(slots.map(s => time(s.time)), ["08:00", "08:30"]);
  assert.ok(slots.every(s => s.score < 0));
  const bestScore = Math.max(...slots.map(s => s.score));
  assert.ok(slots.some(s => s.label === "Meilleur choix"));
  assert.ok(slots.every(s => (s.label === "Meilleur choix") === (s.score === bestScore)));
});

test("when waste and adjacency tie, protect longer usable stretches", () => {
  const a = measurePlacement(at("08:00"), at("09:00"), at("08:00"), at("16:00"), at("08:00"), at("15:00"), at("16:00"), 30);
  const b = measurePlacement(at("11:00"), at("12:00"), at("08:00"), at("16:00"), at("08:00"), at("15:00"), at("16:00"), 30);
  assert.equal(a.newlyUnsellableMinutes, b.newlyUnsellableMinutes);
  assert.ok(a.longStartsLost < b.longStartsLost);
  const slots = getOptimizedStartTimes(date, 60, [], [{ id: "3", name: "3" }], fixtures(baseline[0]).schedule);
  assert.ok(slots.find(s => time(s.time) === "08:00")!.score > slots.find(s => time(s.time) === "11:00")!.score);
});

type Inventory = {
  accepted: number;
  unsellableMinutes: number;
  bookableCoverageMinutes: number;
  remainingStarts: [number, number, number, number];
};

const simulationSchedule: DaySchedule = {
  openHour: 8, openMinute: 0, lastBookingHour: 14, lastBookingMinute: 0,
  closeHour: 15, closeMinute: 0,
};
const simulationBays: Simulator[] = [1, 2, 3, 4].map(n => ({ id: String(n), name: String(n) }));

function inventory(bookings: BookingRecord[], day: Date): Omit<Inventory, "accepted"> {
  const open = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8);
  const last = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 14);
  const close = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 15);
  const result = {
    unsellableMinutes: 0, bookableCoverageMinutes: 0,
    remainingStarts: [0, 0, 0, 0] as [number, number, number, number],
  };
  for (const bay of simulationBays) {
    const ordered = bookings.filter(b => b.simulatorId === bay.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    let cursor = open;
    for (const next of [...ordered, null]) {
      const boundary = next ? new Date(next.startTime) : close;
      assert.ok(cursor <= boundary, "simulation must not overlap reservations");
      const free = measureFreeSegment(cursor, boundary, open, last, close, Number(bay.id) <= 2 ? 60 : 30);
      result.unsellableMinutes += free.unsellable;
      result.bookableCoverageMinutes += (boundary.getTime() - cursor.getTime()) / 60000 - free.unsellable;
      free.startsByDuration.forEach((count, index) => result.remainingStarts[index] += count);
      if (next) cursor = new Date(next.endTime);
    }
  }
  return result;
}

function deterministicRequests(seed: number): Array<{ minute: number; duration: number }> {
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 16;
  };
  return Array.from({ length: 24 }, () => ({
    minute: 8 * 60 + random() % 13 * 30,
    duration: [60, 120, 180, 240][random() % 4],
  }));
}

test("identical seeded sequential requests compare baseline and new bay choices", () => {
  const aggregate = (): Inventory => ({
    accepted: 0, unsellableMinutes: 0, bookableCoverageMinutes: 0,
    remainingStarts: [0, 0, 0, 0],
  });
  const baselineTotal = aggregate();
  const newTotal = aggregate();
  let divergentAssignments = 0;
  let divergentAcceptance = 0;
  const seeds = [7, 19, 41, 73, 127, 211, 307, 509];

  for (const seed of seeds) {
    const day = new Date(2026, 5, 8 + seeds.indexOf(seed));
    const requests = deterministicRequests(seed); // Generated once, independent of either algorithm's availability.
    const oldBookings: BookingRecord[] = [];
    const newBookings: BookingRecord[] = [];
    for (const [index, request] of requests.entries()) {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, request.minute);
      const process = (bookings: BookingRecord[], old: boolean) => {
        const slot = getOptimizedStartTimes(day, request.duration, bookings, simulationBays, simulationSchedule)
          .find(s => s.time === start.toISOString());
        if (!slot) return undefined;
        const bayId = old ? baselineBayForRequest(slot, request.duration, bookings) : slot.assignedBayId;
        bookings.push({
          id: `${seed}-${index}`, simulatorId: bayId, startTime: start.toISOString(),
          endTime: addMinutes(start, request.duration).toISOString(), customerName: "simulation",
        });
        return bayId;
      };
      const oldBay = process(oldBookings, true);
      const newBay = process(newBookings, false);
      if (Boolean(oldBay) !== Boolean(newBay)) divergentAcceptance++;
      if (oldBay && newBay && oldBay !== newBay) divergentAssignments++;
    }
    for (const [total, bookings] of [[baselineTotal, oldBookings], [newTotal, newBookings]] as const) {
      const summary = inventory(bookings, day);
      total.accepted += bookings.length;
      total.unsellableMinutes += summary.unsellableMinutes;
      total.bookableCoverageMinutes += summary.bookableCoverageMinutes;
      summary.remainingStarts.forEach((count, index) => total.remainingStarts[index] += count);
    }
  }
  assert.ok(baselineTotal.accepted <= seeds.length * 24);
  assert.ok(newTotal.accepted <= seeds.length * 24);
  assert.equal(baselineTotal.remainingStarts.length, 4);
  assert.equal(newTotal.remainingStarts.length, 4);
  console.log(JSON.stringify({
    simulation: { seeds, requestsPerSeed: 24, divergentAssignments, divergentAcceptance },
    baseline: baselineTotal, new: newTotal,
    // Coverage counts the union of minutes included in at least one remaining
    // valid start, not the sum of mutually overlapping booking opportunities.
    startsOrderHours: [1, 2, 3, 4],
  }));
});