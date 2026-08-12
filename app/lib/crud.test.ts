import { describe, expect, test } from "bun:test";
import { swapSortOrder } from "./crud";

type Row = { id: string; sortOrder: number };

function makeModel(records: Row[]) {
  return {
    async findMany(): Promise<Row[]> {
      return [...records].sort((a, b) => a.sortOrder - b.sortOrder).map((row) => ({ ...row }));
    },
    async update(args: { where: { id: string }; data: { sortOrder: number } }): Promise<void> {
      const row = records.find((record) => record.id === args.where.id);
      if (row) row.sortOrder = args.data.sortOrder;
    },
  };
}

describe("swapSortOrder", () => {
  test("swaps the target with the row below it", async () => {
    const model = makeModel([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
      { id: "c", sortOrder: 2 },
    ]);
    const moved = await swapSortOrder(model, "a", 1);
    expect(moved).toBe(true);
    expect(model.findMany().then((rows) => rows.map((row) => row.id))).resolves.toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  test("swaps the target with the row above it", async () => {
    const model = makeModel([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    const moved = await swapSortOrder(model, "b", -1);
    expect(moved).toBe(true);
    expect(model.findMany().then((rows) => rows.map((row) => row.id))).resolves.toEqual(["b", "a"]);
  });

  test("refuses to move the first row up", async () => {
    const model = makeModel([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    const moved = await swapSortOrder(model, "a", -1);
    expect(moved).toBe(false);
    expect(model.findMany().then((rows) => rows.map((row) => row.id))).resolves.toEqual(["a", "b"]);
  });

  test("refuses to move the last row down", async () => {
    const model = makeModel([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    const moved = await swapSortOrder(model, "b", 1);
    expect(moved).toBe(false);
    expect(model.findMany().then((rows) => rows.map((row) => row.id))).resolves.toEqual(["a", "b"]);
  });

  test("rejects any direction other than -1 or 1 without touching the rows", async () => {
    const model = makeModel([{ id: "a", sortOrder: 0 }]);
    expect(await swapSortOrder(model, "a", 2)).toBe(false);
    expect(await swapSortOrder(model, "a", 0)).toBe(false);
  });

  test("returns false for an unknown id", async () => {
    const model = makeModel([{ id: "a", sortOrder: 0 }]);
    expect(await swapSortOrder(model, "missing", 1)).toBe(false);
  });
});
