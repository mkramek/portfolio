import { projectsConfig } from "@/lib/admin/route-configs";
import { itemRoutes } from "@/lib/admin/routes";

const routes = itemRoutes(projectsConfig);

export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
