import { prisma } from "~/server/db";
import { tariefcodes } from "@prisma/client";
import { ICrudService } from "~/backend/handlers/crud-service-interface";

// inspired by https://medium.com/@brandonlostboy/build-it-better-next-js-crud-api-b45d2e923896
const TariefcodesService: ICrudService<tariefcodes> = {
  getAll: async () => {
    return await prisma.tariefcodes.findMany({});
  },
  getOne: async (id: string) => {
    throw new Error("Function not implemented.");
  },
  create: async (data: tariefcodes): Promise<tariefcodes> => {
    throw new Error("Function not implemented.");
  },
  update: async (
    id: string,
    data: tariefcodes
  ): Promise<tariefcodes> => {
    throw new Error("Function not implemented.");
  },
  delete: async (id: string): Promise<tariefcodes> => {
    throw new Error("Function not implemented.");
  },
};

export default TariefcodesService;
