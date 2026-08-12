export type SortableModel = {
  findMany: (args?: {
    orderBy?: { sortOrder: "asc" | "desc" };
  }) => Promise<Array<{ id: string; sortOrder: number }>>;
  update: (args: { where: { id: string }; data: { sortOrder: number } }) => Promise<unknown>;
};

export async function swapSortOrder(
  model: SortableModel,
  id: string,
  dir: number,
): Promise<boolean> {
  if (dir !== -1 && dir !== 1) return false;
  const rows = await model.findMany({ orderBy: { sortOrder: "asc" } });
  const index = rows.findIndex((row) => row.id === id);
  const other = index + dir;
  if (index < 0 || other < 0 || other >= rows.length) return false;
  await model.update({ where: { id: rows[index].id }, data: { sortOrder: rows[other].sortOrder } });
  await model.update({ where: { id: rows[other].id }, data: { sortOrder: rows[index].sortOrder } });
  return true;
}
