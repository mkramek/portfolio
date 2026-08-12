import { strengthsConfig } from "@/lib/admin/route-configs";
import { moveRoutes } from "@/lib/admin/routes";

const routes = moveRoutes(strengthsConfig);

export const POST = routes.POST;
