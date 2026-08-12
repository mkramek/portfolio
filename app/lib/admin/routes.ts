import { NextResponse } from "next/server";
import type { z } from "zod";
import { recomputeSetupState } from "@/lib/content";
import { swapSortOrder } from "@/lib/crud";
import { revalidatePublicPortfolio } from "@/lib/revalidate";

type RouteContext = { params: Promise<{ id: string }> };

export type Delegate = {
  findMany: (args?: {
    orderBy?: { sortOrder: "asc" | "desc" };
  }) => Promise<Array<{ id: string; sortOrder: number }>>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
  aggregate: (args: {
    _max: { sortOrder: true };
  }) => Promise<{ _max: { sortOrder: number | null } }>;
};

export type RouteEntityConfig = {
  name: string;
  delegate: Delegate;
  schema: z.ZodType;
  createSchema: z.ZodType;
  recompute: boolean;
  /**
   * Deletes this entity's Translation sidecar rows (keyed by (entity, entityId), no
   * DB-level FK) so removing a role/project/etc. doesn't leave orphaned translations
   * behind for an id that can never be reused (cuid). Injected rather than hardcoded
   * to a Prisma call so routes.test.ts can exercise DELETE with an in-memory fake and
   * no live database — see lib/admin/route-configs.ts for the real wiring.
   */
  deleteTranslations: (entityId: string) => Promise<unknown>;
};

export function collectionRoutes(cfg: RouteEntityConfig) {
  return {
    GET: async () => {
      const rows = await cfg.delegate.findMany({ orderBy: { sortOrder: "asc" } });
      return NextResponse.json(rows);
    },
    POST: async (request: Request) => {
      const parsed = cfg.createSchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json({ message: `Invalid ${cfg.name}` }, { status: 400 });
      }
      const aggregate = await cfg.delegate.aggregate({ _max: { sortOrder: true } });
      const sortOrder = (aggregate._max.sortOrder ?? -1) + 1;
      await cfg.delegate.create({
        data: { ...(parsed.data as Record<string, unknown>), sortOrder },
      });
      const isComplete = cfg.recompute ? await recomputeSetupState() : undefined;
      revalidatePublicPortfolio();
      return NextResponse.json({ isComplete });
    },
  };
}

export function itemRoutes(cfg: RouteEntityConfig) {
  return {
    PATCH: async (request: Request, { params }: RouteContext) => {
      const { id } = await params;
      const parsed = cfg.schema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json({ message: `Invalid ${cfg.name}` }, { status: 400 });
      }
      await cfg.delegate.update({ where: { id }, data: parsed.data as Record<string, unknown> });
      const isComplete = cfg.recompute ? await recomputeSetupState() : undefined;
      revalidatePublicPortfolio();
      return NextResponse.json({ isComplete });
    },
    DELETE: async (_request: Request, { params }: RouteContext) => {
      const { id } = await params;
      await cfg.deleteTranslations(id);
      await cfg.delegate.delete({ where: { id } });
      const isComplete = cfg.recompute ? await recomputeSetupState() : undefined;
      revalidatePublicPortfolio();
      return NextResponse.json({ isComplete });
    },
  };
}

export function moveRoutes(cfg: RouteEntityConfig) {
  return {
    POST: async (request: Request, { params }: RouteContext) => {
      const { id } = await params;
      const body = (await request.json().catch(() => ({}))) as { dir?: number };
      const moved = await swapSortOrder(cfg.delegate, id, body.dir ?? 0);
      if (!moved) {
        return NextResponse.json({ message: "Cannot move entry" }, { status: 400 });
      }
      revalidatePublicPortfolio();
      return NextResponse.json({});
    },
  };
}
