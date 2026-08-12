import { testimonialsConfig } from "@/lib/admin/route-configs";
import { moveRoutes } from "@/lib/admin/routes";

const routes = moveRoutes(testimonialsConfig);

export const POST = routes.POST;
