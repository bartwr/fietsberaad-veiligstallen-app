import { prisma } from "~/server/db";
import type { fietsenstallingen, fietsenstalling_sectie, sectie_fietstype } from "@prisma/client";
import type { ICrudService } from "~/backend/handlers/crud-service-interface";

BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

const include = {
  fietsenstalling_type: true,
  fietsenstalling_secties: {
    include: {
      secties_fietstype: {
        include: {
          fietstype: true
        }
      }
    }
  },
  fietsenstallingen_services: {
    include: {
      services: true
    }
  },
  abonnementsvorm_fietsenstalling: {
    include: {
      abonnementsvormen: true
    }
  },
  tariefcode: true
}

// inspired by https://medium.com/@brandonlostboy/build-it-better-next-js-crud-api-b45d2e923896
const FietsenstallingenService: ICrudService<fietsenstallingen> = {
  getAll: async () => {
    return await prisma.fietsenstallingen.findMany({
      include: {
        fietsenstalling_secties: true,
      }
    });
  },
  getOne: async (id: string) => {
    const item = await prisma.fietsenstallingen.findFirst({
      where: { ID: id },
      include
    });

    return item;
  },
  create: async (_data: Partial<fietsenstallingen>): Promise<fietsenstallingen> => {
    try {
      const createresult = await prisma.fietsenstallingen.create({ data: _data });

      if (createresult) {
        const newSectieIdResult = await prisma.fietsenstalling_sectie.aggregate({
          _max: {
            sectieId: true
          }
        });
        const sectieId = newSectieIdResult._max.sectieId !== null ? newSectieIdResult._max.sectieId + 1 : 1;
        const sectiedata: fietsenstalling_sectie = {
          fietsenstallingsId: createresult.ID,
          sectieId,
          titel: 'sectie 1',
          isactief: true,
          externalId: null,
          omschrijving: null,
          capaciteit: null,
          CapaciteitBromfiets: null,
          kleur: "",
          isKluis: false,
          reserveringskostenPerDag: null,
          urlwebservice: null,
          Reservable: false,
          NotaVerwijssysteem: null,
          Bezetting: 0,
          qualificatie: null
        }

        await prisma.fietsenstalling_sectie.create({ data: sectiedata });
        const allTypes = await prisma.fietstypen.findMany();
        for (let typedata of allTypes) {
          const newSubSectieIdResult = await prisma.sectie_fietstype.aggregate({
            _max: {
              SectionBiketypeID: true
            }
          });
          const subSectieId = newSubSectieIdResult._max.SectionBiketypeID !== null ? newSubSectieIdResult._max.SectionBiketypeID + 1 : 1;
          const subsectiedata: sectie_fietstype = {
            SectionBiketypeID: subSectieId,
            Capaciteit: 0,
            Toegestaan: true,
            sectieID: sectieId,
            StallingsID: createresult.ID,
            BikeTypeID: typedata.ID
          }
          await prisma.sectie_fietstype.create({ data: subsectiedata });
        };
      }

      return createresult;
    } catch (error) {
      console.error("### create error", error);
      throw new Error("Create failed");
    }
  },
  update: async (
    _id: string,
    _data: fietsenstallingen
  ): Promise<fietsenstallingen> => {
    try {
      const result = await prisma.fietsenstallingen.update({
        where: { ID: _id },
        data: _data,
      });

      return result;
    } catch (error) {
      console.error("### update error", error);
      throw new Error("Update failed");
    }
    // throw new Error("Function not implemented.");
  },
  delete: async (_id: string): Promise<fietsenstallingen> => {
    try {
      return await prisma.fietsenstallingen.delete({ where: { ID: _id } });
    } catch (error) {
      console.error("### delete error", error);
      throw new Error("Function not implemented.");
    }
  },
};

export default FietsenstallingenService;
