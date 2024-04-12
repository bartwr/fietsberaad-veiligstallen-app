import type { NextApiRequest, NextApiResponse } from "next";
import { CrudRouteHandler } from "~/backend/handlers/crud-route-handler";
import TariefcodesService from "~/backend/services/tariefcodes-service";

export default async (request: NextApiRequest, response: NextApiResponse) => {
  await CrudRouteHandler(request, response, TariefcodesService);
};
