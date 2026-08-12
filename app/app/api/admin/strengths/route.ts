import { strengthsConfig } from "@/lib/admin/route-configs";
import { collectionRoutes } from "@/lib/admin/routes";

const routes = collectionRoutes(strengthsConfig);

export const GET = routes.GET;
export const POST = routes.POST;
