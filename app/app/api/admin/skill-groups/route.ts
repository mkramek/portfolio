import { skillGroupsConfig } from "@/lib/admin/route-configs";
import { collectionRoutes } from "@/lib/admin/routes";

const routes = collectionRoutes(skillGroupsConfig);

export const GET = routes.GET;
export const POST = routes.POST;
