import { projectsConfig } from "@/lib/admin/route-configs";
import { collectionRoutes } from "@/lib/admin/routes";

const routes = collectionRoutes(projectsConfig);

export const GET = routes.GET;
export const POST = routes.POST;
