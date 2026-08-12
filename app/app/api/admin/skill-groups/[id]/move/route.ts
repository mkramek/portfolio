import { skillGroupsConfig } from "@/lib/admin/route-configs";
import { moveRoutes } from "@/lib/admin/routes";

const routes = moveRoutes(skillGroupsConfig);

export const POST = routes.POST;
