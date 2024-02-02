interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    id: string;
    title: string;
    location: string;
    plaats: string;
    type: string;
  };
}

import { type ParkingDetailsType } from "~/types/";

const createGeoJson = (input: ParkingDetailsType[]) => {
  let features: GeoJsonFeature[] = [];

  input.forEach((x: any) => {
    if (!x.Coordinaten) return;

    const coords = x.Coordinaten.split(",").map((coord: any) => Number(coord)); // I.e.: 52.508011,5.473280;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [coords[1], coords[0]],
      },
      properties: {
        id: x.ID,
        title: (x.Title || "").toLowerCase(),
        location: (x.Location || "").toLowerCase(),
        plaats: (x.Plaats || "").toLowerCase(),
        type: x.Type || "unknown",
      },
    });
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
};

const createEditGeoJson = (Coordinaten: string) => {
  let features: GeoJsonFeature[] = [];

  const coords = Coordinaten.split(",").map((coord: any) => Number(coord)); // I.e.: 52.508011,5.473280;
  if (undefined !== coords[0] && undefined !== coords[1]) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [coords[1], coords[0]],
      },
      properties: {
        id: "",
        title: "",
        location: "",
        plaats: "",
        type: "",
      },
    });
  }

  return {
    type: "FeatureCollection",
    features: features,
  };
};

export {
  createGeoJson, createEditGeoJson
}
