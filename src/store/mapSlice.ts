import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { MapGeoJSONFeature } from 'maplibre-gl';


const INITIAL_ZOOM = 10;

// Type for our state
export interface MapState {
  extent: Number[];
  zoom: number;
  visibleFeatures: MapGeoJSONFeature[];
  selectedParkingId: string | undefined;
  activeMunicipality: any;
  activeMunicipalityInfo: any;
  initialLatLng: Array<Number> | undefined;
}

// Initial state
const initialState: MapState = {
  extent: [],
  zoom: INITIAL_ZOOM,
  visibleFeatures: [],
  selectedParkingId: undefined,
  activeMunicipality: undefined,
  activeMunicipalityInfo: undefined,
  initialLatLng: undefined
};

// Actual Slice
export const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    // Action to set the map extent (boundaries)
    setMapExtent(state, action) {
      state.extent = action.payload;
    },
    // Action to set the map zoom level
    setMapZoom(state, action) {
      state.zoom = action.payload;
    },
    // Action to set visible features
    setMapVisibleFeatures(state, action) {
      state.visibleFeatures = action.payload;
    },
    // Set selectedParkingId
    setSelectedParkingId(state, action) {
      state.selectedParkingId = action.payload;
    },
    // setActiveMunicipality
    setActiveMunicipality(state, action) {
      state.activeMunicipality = action.payload;
    },
    // setActiveMunicipalityInfo
    setActiveMunicipalityInfo(state, action) {
      state.activeMunicipalityInfo = action.payload;
    },
    // setInitialLatLng
    setInitialLatLng(state, action) {
      state.initialLatLng = action.payload;
    },
  },

  // Special reducer for hydrating the state. Special case for next-redux-wrapper
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.map,
      };
    },
  },
});

export const {
  setMapExtent,
  setMapZoom,
  setMapVisibleFeatures,
  setSelectedParkingId,
  setActiveMunicipality,
  setActiveMunicipalityInfo,
  setInitialLatLng
} = mapSlice.actions;
