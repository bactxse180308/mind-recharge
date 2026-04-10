import { describe, expect, it } from "vitest";
import { getDailyTaskAction } from "@/lib/dailyTaskActions";

describe("getDailyTaskAction", () => {
  it("returns the journal CTA for WRITE_JOURNAL", () => {
    expect(getDailyTaskAction("WRITE_JOURNAL")).toEqual({
      label: "Viết",
      path: "/journal",
    });
  });

  it("returns the trigger CTA for DEEP_BREATH", () => {
    expect(getDailyTaskAction("DEEP_BREATH")).toEqual({
      label: "Thở ngay",
      path: "/trigger",
    });
  });

  it("returns null for codes without a configured action", () => {
    expect(getDailyTaskAction("DRINK_WATER")).toBeNull();
  });
});
