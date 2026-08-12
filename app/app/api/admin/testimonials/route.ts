import { testimonialsConfig } from "@/lib/admin/route-configs";
import { collectionRoutes } from "@/lib/admin/routes";

const routes = collectionRoutes(testimonialsConfig);

export const GET = routes.GET;
export const POST = routes.POST;
