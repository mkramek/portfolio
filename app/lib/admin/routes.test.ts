import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { collectionRoutes, type Delegate, itemRoutes, moveRoutes } from "./routes";

type Row = { id: string; name: string; sortOrder: number };

function makeDelegate(rows: Row[]) {
  return {
    async findMany(args?: { orderBy?: { sortOrder: "asc" | "desc" } }): Promise<Row[]> {
      const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder).map((row) => ({ ...row }));
      if (args?.orderBy?.sortOrder === "desc") sorted.reverse();
      return sorted;
    },
    async create(args: { data: Record<string, unknown> }): Promise<Row> {
      const row = args.data as unknown as Row;
      rows.push({ ...row });
      return row;
    },
    async update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown> {
      const row = rows.find((record) => record.id === args.where.id);
      if (row) Object.assign(row, args.data);
      return row;
    },
    async delete(args: { where: { id: string } }): Promise<unknown> {
      const index = rows.findIndex((record) => record.id === args.where.id);
      if (index >= 0) rows.splice(index, 1);
      return undefined;
    },
    async aggregate(_args: {
      _max: { sortOrder: true };
    }): Promise<{ _max: { sortOrder: number | null } }> {
      const max = rows.reduce((acc, row) => Math.max(acc, row.sortOrder), -1);
      return { _max: { sortOrder: max } };
    },
  } satisfies Delegate;
}

const itemSchema = z.object({ name: z.string().min(1), sortOrder: z.number().int() });

function config(delegate: Delegate, onDeleteTranslations?: (id: string) => void) {
  return {
    name: "entry",
    delegate,
    schema: itemSchema,
    createSchema: itemSchema.omit({ sortOrder: true }),
    recompute: false,
    deleteTranslations: async (id: string) => {
      onDeleteTranslations?.(id);
    },
  };
}

function jsonRequest(method: string, body: unknown): Request {
  return new Request("http://localhost/api/admin/entries", {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("collectionRoutes", () => {
  test("GET returns rows ordered by sortOrder ascending", async () => {
    const rows: Row[] = [
      { id: "a", name: "A", sortOrder: 1 },
      { id: "b", name: "B", sortOrder: 0 },
    ];
    const routes = collectionRoutes(config(makeDelegate(rows)));
    const response = await routes.GET();
    const body = (await response.json()) as Row[];
    expect(response.status).toBe(200);
    expect(body.map((row) => row.id)).toEqual(["b", "a"]);
  });

  test("POST assigns the next sortOrder and creates the row", async () => {
    const rows: Row[] = [
      { id: "a", name: "A", sortOrder: 0 },
      { id: "b", name: "B", sortOrder: 1 },
    ];
    const routes = collectionRoutes(config(makeDelegate(rows)));
    const response = await routes.POST(jsonRequest("POST", { name: "C" }));
    expect(response.status).toBe(200);
    const created = rows.find((row) => row.name === "C");
    expect(created).toBeDefined();
    expect(created?.sortOrder).toBe(2);
  });

  test("POST with an invalid body returns 400 and creates nothing", async () => {
    const rows: Row[] = [];
    const routes = collectionRoutes(config(makeDelegate(rows)));
    const response = await routes.POST(jsonRequest("POST", { name: "" }));
    expect(response.status).toBe(400);
    expect(rows).toHaveLength(0);
  });
});

describe("itemRoutes", () => {
  test("PATCH updates the target row", async () => {
    const rows: Row[] = [{ id: "a", name: "A", sortOrder: 0 }];
    const routes = itemRoutes(config(makeDelegate(rows)));
    const response = await routes.PATCH(
      jsonRequest("PATCH", { name: "Renamed", sortOrder: 0 }),
      context("a"),
    );
    expect(response.status).toBe(200);
    expect(rows[0]?.name).toBe("Renamed");
  });

  test("PATCH with an invalid body returns 400", async () => {
    const rows: Row[] = [{ id: "a", name: "A", sortOrder: 0 }];
    const routes = itemRoutes(config(makeDelegate(rows)));
    const response = await routes.PATCH(
      jsonRequest("PATCH", { name: "x", sortOrder: 1.5 }),
      context("a"),
    );
    expect(response.status).toBe(400);
    expect(rows[0]?.name).toBe("A");
  });

  test("DELETE removes the target row", async () => {
    const rows: Row[] = [
      { id: "a", name: "A", sortOrder: 0 },
      { id: "b", name: "B", sortOrder: 1 },
    ];
    const routes = itemRoutes(config(makeDelegate(rows)));
    const response = await routes.DELETE(jsonRequest("DELETE", {}), context("a"));
    expect(response.status).toBe(200);
    expect(rows.map((row) => row.id)).toEqual(["b"]);
  });

  test("DELETE also cascades to that entry's translations", async () => {
    const rows: Row[] = [{ id: "a", name: "A", sortOrder: 0 }];
    const deletedTranslationIds: string[] = [];
    const routes = itemRoutes(config(makeDelegate(rows), (id) => deletedTranslationIds.push(id)));
    await routes.DELETE(jsonRequest("DELETE", {}), context("a"));
    expect(deletedTranslationIds).toEqual(["a"]);
  });
});

describe("moveRoutes", () => {
  test("POST swaps the target with a neighbour", async () => {
    const rows: Row[] = [
      { id: "a", name: "A", sortOrder: 0 },
      { id: "b", name: "B", sortOrder: 1 },
    ];
    const routes = moveRoutes(config(makeDelegate(rows)));
    const response = await routes.POST(jsonRequest("POST", { dir: 1 }), context("a"));
    expect(response.status).toBe(200);
    expect(rows.find((row) => row.id === "a")?.sortOrder).toBe(1);
    expect(rows.find((row) => row.id === "b")?.sortOrder).toBe(0);
  });

  test("POST at a boundary or with a bad direction returns 400", async () => {
    const rows: Row[] = [{ id: "a", name: "A", sortOrder: 0 }];
    const routes = moveRoutes(config(makeDelegate(rows)));
    expect((await routes.POST(jsonRequest("POST", { dir: -1 }), context("a"))).status).toBe(400);
    expect((await routes.POST(jsonRequest("POST", { dir: 2 }), context("a"))).status).toBe(400);
    expect((await routes.POST(jsonRequest("POST", { dir: 1 }), context("missing"))).status).toBe(
      400,
    );
  });
});
