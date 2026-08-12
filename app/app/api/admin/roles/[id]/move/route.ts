import { rolesConfig } from "@/lib/admin/route-configs";
import { moveRoutes } from "@/lib/admin/routes";

const routes = moveRoutes(rolesConfig);

export const POST = routes.POST;
