import { projectsConfig } from "@/lib/admin/route-configs";
import { moveRoutes } from "@/lib/admin/routes";

const routes = moveRoutes(projectsConfig);

export const POST = routes.POST;
