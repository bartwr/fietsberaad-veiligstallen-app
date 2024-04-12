import React, { useState } from "react";

// Import components
import PageTitle from "~/components/PageTitle";
import HorizontalDivider from "~/components/HorizontalDivider";
import { Button } from "~/components/Button";
import FormInput from "~/components/Form/FormInput";
import SectionBlock from "~/components/SectionBlock";
import SectionBlockEdit from "~/components/SectionBlockEdit";
import type { ParkingDetailsType, ParkingSections } from "~/types/";
import {
  getAllServices,
  generateRandomId,
  getDefaultLocation,
} from "~/utils/parkings";
import { cbsCodeFromMunicipality, getMunicipalityBasedOnCbsCode } from "~/utils/municipality";
import { Tabs, Tab, FormHelperText, Typography } from "@mui/material";

/* Use nicely formatted items for items that can not be changed yet */
import type { ServiceType } from "~/components/parking/ParkingViewServices";

import ParkingViewAbonnementen from "~/components/parking/ParkingViewAbonnementen";
import ParkingEditCapaciteit, { type CapaciteitType } from "~/components/parking/ParkingEditCapaciteit";
import ParkingEditLocation from "~/components/parking/ParkingEditLocation";
import ParkingEditAfbeelding from "~/components/parking/ParkingEditAfbeelding";
import ParkingEditOpening, { type OpeningChangedType } from "~/components/parking/ParkingEditOpening";
import { useSession } from "next-auth/react"
import ParkingViewBeheerder from "./ParkingViewBeheerder";
import { type MunicipalityType, getMunicipalityBasedOnLatLng } from "~/utils/map/active_municipality";
import { geocodeAddress, reverseGeocode } from "~/utils/nomatim";
import toast from 'react-hot-toast';
import type { tariefcodes } from "@prisma/client";

type connectFietsenstallingType = {
  connect: {
    id: string
  }
}

type connectTariefcodeType = {
  connect: {
    ID: number
  }
}

type disconnectTariefcodeType = {
  disconnect: true
}


export type ParkingEditUpdateStructure = {
  ID?: string;
  Title?: string;
  Status?: "0" | "1" | "new" | "aanm";
  Location?: string;
  Postcode?: string;
  Plaats?: string;
  Coordinaten?: string;
  DateCreated?: Date;
  DateModified?: Date;
  SiteID?: string;
  tariefcode?: connectTariefcodeType | disconnectTariefcodeType;
  Beheerder?: string,
  BeheerderContact?: string,

  // [key: string]: string | undefined;
  Openingstijden?: any; // Replace with the actual type if different
  fietsenstalling_type?: connectFietsenstallingType
}

type ChangedType = { ID: string, selected: boolean };

const NoClickOverlay = () => {
  const [didClick, setDidClick] = useState(false);

  return (
    <div data-name="no-click-overlay" className={`
      absolute top-0 right-0 bottom-0 left-0 z-10
      text-center
      flex-col justify-center
      cursor-pointer
      ${didClick ? 'hidden' : 'flex'}
    `} style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)'
      }}
      onClick={() => setDidClick(true)}
    >
      <div className="mt-16">
        Klik om de kaart te bewegen
      </div>
    </div>
  )
}

const ParkingEdit = ({ parkingdata, onClose, onChange }: { parkingdata: ParkingDetailsType, onClose: (closeModal: boolean) => void, onChange: Function }) => {

  const [selectedTab, setSelectedTab] = React.useState<string>('tab-algemeen');
  // const [waarschuwing, setWaarschuwing] = React.useState<string>('');
  // const [allowSave, setAllowSave] = React.useState<boolean>(true);
  const allowSave = true;

  const [newSiteID, setNewSiteID] = React.useState<string | undefined>(undefined);
  const [newTitle, setNewTitle] = React.useState<string | undefined>(undefined);
  // 
  const [newLocation, setNewLocation] = React.useState<string | undefined>(undefined);
  const [newPostcode, setNewPostcode] = React.useState<string | undefined>(undefined);
  const [newPlaats, setNewPlaats] = React.useState<string | undefined>(undefined);
  const [newCoordinaten, setNewCoordinaten] = React.useState<string | undefined>(undefined);
  const [newTariefcode, setNewTariefcode] = React.useState<number | undefined>(undefined); // -1 -> don't show

  // used for map recenter when coordinates are manually changed
  const [centerCoords, setCenterCoords] = React.useState<string | undefined>(undefined);

  // beheerder
  const [newBeheerder, setNewBeheerder] = React.useState<string | undefined>(undefined);
  const [newBeheerderContact, setNewBeheerderContact] = React.useState<string | undefined>(undefined);

  // type FietsenstallingSectiesType = { [key: string]: Array[] }

  const [allServices, setAllServices] = React.useState<ServiceType[]>([]);
  const [newServices, setNewServices] = React.useState<ChangedType[]>([]);

  const [newCapaciteit, setNewCapaciteit] = React.useState<ParkingSections>([]); // capaciteitschema
  const [newOpening, setNewOpening] = React.useState<any>(undefined); // openingstijdenschema
  const [newOpeningstijden, setNewOpeningstijden] = React.useState<string | undefined>(undefined); // textveld afwijkende openingstijden

  type StallingType = { id: string, name: string, sequence: number };
  const [allTypes, setAllTypes] = React.useState<StallingType[]>([]);
  const [allTariefcodes, setAllTariefcodes] = React.useState<tariefcodes[]>([]);
  const [newStallingType, setNewStallingType] = React.useState<string | undefined>(undefined);

  const [currentMunicipality, setCurrentMunicipality] = React.useState<MunicipalityType | undefined>(undefined);

  const { data: session } = useSession()

  // Set 'allServices' variable in local state
  React.useEffect(() => {
    (async () => {
      const result = await getAllServices();
      setAllServices(result);
    })();
  }, [])

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `/api/fietsenstallingtypen/`
        );
        const json = await response.json();
        if (!json) return;

        setAllTypes(json);
      } catch (err) {
        console.error("get all types error", err);
      }
    })();
  }, [])

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `/api/tariefcodes/`
        );
        const json = await response.json();
        if (!json) return;

        setAllTariefcodes(json);
      } catch (err) {
        console.error("get all tariefcodes error", err);
      }
    })();
  }, [])

  React.useEffect(() => {
    updateSiteID();
  }, [parkingdata.Location, newCoordinaten]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  }

  type checkInfo = {
    type: "string" | "coordinaten",
    text: string,
    value: any,
    newvalue: any
  }

  const updateSiteID = () => {

    const currentll = undefined !== newCoordinaten ? newCoordinaten : parkingdata.Coordinaten;
    getMunicipalityBasedOnLatLng(currentll.split(",")).then(async (result) => {
      if (result !== false) {

        // Set municipality in state
        setCurrentMunicipality(result);

        // Find CBS code of this municipality
        const cbsCode = cbsCodeFromMunicipality(result);
        // Reset newSiteID if no cbsCode was found
        if (!cbsCode) {
          setNewSiteID(undefined);
          return;
        }

        // Find municipality row in database based on cbsCode
        const municipality = await getMunicipalityBasedOnCbsCode(cbsCode)
        // Reset newSiteID if no municipality row was found
        if (!municipality) {
          setNewSiteID(undefined);
          return;
        }

        if (municipality.ID !== parkingdata.SiteID) {
          setNewSiteID(municipality.ID);
        } else {
          setNewSiteID(undefined);
        }
      } else {
        setCurrentMunicipality(undefined);
        setNewSiteID(undefined);
      }
    }).catch((err) => {
      console.error('municipality based on latlng error', err);
    })
  }

  const validateParkingData = (): boolean => {
    const checkStringType = (check: checkInfo): string => {
      if ((check.value === "" || check.value === null) && check.newvalue === undefined) {
        return `invoer van ${check.text} is verplicht`;
      } else {
        return "";
      }
    }

    const checkCoordinatenType = (check: checkInfo): string => {
      if (check.value === getDefaultLocation && check.newvalue === undefined) {
        return `${check.text} is verplicht`;
      } else {
        return "";
      }
    }

    let checks: checkInfo[] = [
      { type: "string", text: "invoer van de titel", value: parkingdata.Title, newvalue: newTitle },
      { type: "string", text: "invoer van de straat en huisnummer", value: parkingdata.Location, newvalue: newLocation },
      { type: "string", text: "invoer van de plaats", value: parkingdata.Plaats, newvalue: newPlaats },
      { type: "string", text: "selectie van de gemeente", value: parkingdata.SiteID, newvalue: newSiteID },
      { type: "coordinaten", text: "instellen van de locatie op de kaart", value: parkingdata.Coordinaten, newvalue: newCoordinaten },
      { type: "string", text: "invoer van het stallingstarief", value: parkingdata.tariefcode?.ID || -1, newvalue: newTariefcode },
    ]
    // parkingdata.Postcode is optional

    // FMS & ExploitantID cannot be changed for now, so no need to check those for changes
    if (parkingdata.FMS !== true && parkingdata.ExploitantID === null) {
      checks.push({ type: "string", text: "invoer van de contactgegevens van de beheerder", value: parkingdata.Beheerder, newvalue: newBeheerder });
      if (parkingdata.Beheerder !== "NS") {
        checks.push({ type: "string", text: "invoer van de contactgegevens van de beheerder", value: parkingdata.BeheerderContact, newvalue: newBeheerderContact });
      }
    }

    // Not checked / check not required
    // Type, Image, Openingstijden, Capacity, FMS, Beheerder, BeheerderContact, fietsenstalling_type, fietsenstalling_secties, abonnementsvorm_fietsenstalling, exploitant, fietsenstallingen_services

    let message = "";
    for (const check of checks) {
      switch (check.type) {
        case "string":
          message = checkStringType(check);
          break;
        case "coordinaten":
          message = checkCoordinatenType(check);
          break;
        default:
          break;
      }

      if (message !== "") {
        alert(message);
        return false;
      }
    };

    return true;
  }

  const getUpdate = () => {
    let update: ParkingEditUpdateStructure = {};

    update.ID = parkingdata.ID;

    if (newTitle !== undefined) { update.Title = newTitle; }
    if (newLocation !== undefined) { update.Location = newLocation; }
    if (newPostcode !== undefined) { update.Postcode = newPostcode; }
    if (newPlaats !== undefined) { update.Plaats = newPlaats; }
    if (newCoordinaten !== undefined) { update.Coordinaten = newCoordinaten; }
    if (newSiteID !== undefined) { update.SiteID = newSiteID; }

    if (newBeheerder !== undefined) { update.Beheerder = newBeheerder; }
    if (newBeheerderContact !== undefined) { update.BeheerderContact = newBeheerderContact; }

    if (newStallingType !== undefined) { update.fietsenstalling_type = { connect: { id: newStallingType.toString() } }; }
    let currentCode = parkingdata.tariefcode && parkingdata.tariefcode.ID ? parkingdata.tariefcode.ID : -1; // -1 -> don't show
    if (undefined !== newTariefcode) {
      if (newTariefcode !== currentCode) {
        if (newTariefcode === -1) {
          update.tariefcode = { disconnect: true };
        } else {
          update.tariefcode = { connect: { ID: newTariefcode } };
        }
      }
    }

    if (undefined !== newOpening) {
      for (const keystr in newOpening) {
        const key = keystr as keyof ParkingEditUpdateStructure;
        update[key] = new Date(newOpening[key]).toISOString();
      }
    }

    // COULDDO: Save data in update object only, to update parkingdata as 1 full object
    // if(undefined!==newCapaciteit) {
    //   update.fietsenstalling_sectie = newCapaciteit as FietsenstallingSectiesType
    // }

    if (undefined !== newOpeningstijden) {
      if (newOpeningstijden !== parkingdata.Openingstijden) {
        update.Openingstijden = newOpeningstijden;
      }
    }

    // Set DateCreated and DateModified
    const today = new Date();
    if (!parkingdata.DateCreated) {
      update.DateCreated = today;
    }

    update.DateModified = today;

    // update.fietsenstalling_secties = [];

    return update;
  }

  const updateServices = async (parkingdata: ParkingDetailsType, newServices: ChangedType[]) => {
    try {
      // Delete existing services for this parking
      await fetch(
        "/api/fietsenstallingen_services/deleteForParking?fietsenstallingId=" + parkingdata.ID,
        { method: "DELETE" }
      );
      // Create servicesToSave object
      const servicesToSave: {}[] = [];
      // - First, add existing services
      parkingdata.fietsenstallingen_services && parkingdata.fietsenstallingen_services.forEach(x => {
        // To be removed?
        const doRemove = newServices.filter(s => s.ID === x.services.ID && !s.selected).pop();
        if (!doRemove) {
          servicesToSave.push({
            ServiceID: x.services.ID,
            FietsenstallingID: parkingdata.ID,
          });
        }
      })
      // - Second, add new services
      newServices.forEach(s => {
        // Don't add if service is not selected
        if (!s.selected) return;

        servicesToSave.push({
          ServiceID: s.ID,
          FietsenstallingID: parkingdata.ID,
        });
      });
      // Create parking services in database
      await fetch(
        "/api/fietsenstallingen_services/create",
        {
          method: "POST",
          body: JSON.stringify(servicesToSave),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  const updateCapaciteit = async (parkingdata: ParkingDetailsType, newCapaciteit: ParkingSections): Promise<void> => {
    if (!newCapaciteit || newCapaciteit.length <= 0) return;

    try {
      // Get section to save
      const sectionToSaveResponse = await fetch('/api/fietsenstalling_sectie/findFirstByFietsenstallingsId?ID=' + parkingdata.ID);
      let sectionId = undefined;
      const sectionToSave = await sectionToSaveResponse.json();
      if (null !== sectionToSave) {
        sectionId = sectionToSave.sectieId;
      } else {
        let result = await fetch('/api/fietsenstalling_sectie/getNewSectieId');
        sectionId = (await result.json()).sectieId;
      }

      // Save capaciteit
      await fetch('/api/fietsenstalling_sectie/saveManyFromFullObject', {
        method: 'POST',
        body: JSON.stringify({
          parkingId: parkingdata.ID,
          sectionId: sectionId,
          parkingSections: newCapaciteit
        }),
        headers: {
          "Content-Type": "application/json",
        }
      })
    } catch (err) {
      console.error(err);
    }
  }

  const parkingChanged = (update: ParkingEditUpdateStructure) => {
    try {
      const isChanged =
        Object.keys(update).length !== 0 ||
        newServices.length > 0 ||
        newCapaciteit && newCapaciteit.length > 0 ||
        newOpening !== undefined ||
        newOpeningstijden !== undefined

      return isChanged;
    } catch (ex) {
      console.error("ParkingEdit - unable to determine if parking data has changed");
      return false;
    }
  }

  const handleRemoveParking = async (message: string = ''): Promise<boolean> => {
    try {
      if (parkingdata.Status !== 'aanm' && parkingdata.Status !== 'new') {
        // Update logic for derived tables is not fully implemented!
        throw Error('Het is niet toegestaan om een goedgekeurde stalling te verwijderen. Gebruik de knop verbergen om deze onzichtbaar te maken.')
      }

      if (message !== '') {
        if (!confirm(message)) return false;
      }

      const result1 = await fetch(
        "/api/fietsenstallingen_services/deleteForParking?fietsenstallingId=" + parkingdata.ID,
        { method: "DELETE" }
      );

      const result2 = await fetch(
        "/api/fietsenstallingen?id=" + parkingdata.ID,
        { method: "DELETE" }
      );

      if (false === result1.ok || false === result2.ok) {
        toast("De stalling kon niet worden verwijderd.")
      } else {
        toast("De stalling is verwijderd.")
      }

      onChange();
      onClose(true);

      return true;
    } catch (ex) {
      console.error("ParkingEdit - unable to remove parking record");
      return false;
    }
  }

  const handleUpdateParking = async () => {
    try {
      if (!parkingdata) return;

      if (!validateParkingData()) {
        console.warn("ParkingEdit - invalid data: update cancelled");
        return;
      }

      // Check if parking was changed
      const update = getUpdate();

      if (parkingdata.Status === "aanm") {
        update.Status = "new"
      } else if (parkingdata.Status === "new") {
        update.Status = "1"
      }

      if (false === parkingChanged(update)) {
        onChange();
        onClose(session === null);
        return;
      }

      const result = await fetch(
        "/api/fietsenstallingen?id=" + parkingdata.ID,
        {
          method: "PUT",
          body: JSON.stringify(update),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!result.ok) {
        throw Error('Er ging iets fout bij het opslaan. Controleer of de gegevens kloppen. Is de postcode bijvoorbeeld juist, en niet te lang?')
      }

      // If services are updated: Update services
      if (newServices.length > 0) {
        await updateServices(parkingdata, newServices);
      }

      // If capaciteit is updated: Update capaciteit
      if (newCapaciteit && newCapaciteit.length > 0) {
        await updateCapaciteit(parkingdata, newCapaciteit);
      }

      if (session === null) {
        toast(`Uw voorstel wordt aangemeld bij gemeente ${currentMunicipality?.name}.`, { duration: 15000, style: { minWidth: '40vw' } })
      } else {
        toast(`De stallingsgegevens zijn opgeslagen`);
      }

      onChange();
      onClose(session === null);
    } catch (err: any) {
      if (err.message) alert(err.message);
      else alert(err);
    }
  };

  const update: ParkingEditUpdateStructure = getUpdate()
  const isVoorstel = parkingdata?.Status === 'new'
  const showUpdateButtons = isVoorstel || parkingChanged(update)

  const updateCoordinatesFromMap = (lat: number, lng: number) => {
    const latlngstring = `${lat},${lng}`;
    if (latlngstring !== parkingdata.Coordinaten) {
      setNewCoordinaten(latlngstring);
    } else {
      setNewCoordinaten(undefined);
    }
    setCenterCoords(undefined);
  }

  const updateCoordinatesFromForm = (isLat: boolean) => (e: { target: { value: string; }; }) => {
    try {
      const latlng = parkingdata.Coordinaten.split(",");
      if (isLat) {
        latlng[0] = e.target.value;
      } else {
        latlng[1] = e.target.value;
      }
      setNewCoordinaten(latlng.join(","));
      setCenterCoords(latlng.join(","));
    } catch (ex: any) {
      if (ex.message) {
        console.warn('ParkingEditLocation - unable to set coordinates from form: ', ex.message());
      } else {
        console.warn('ParkingEditLocation - unable to set coordinates from form');
      }
    }
  }

  const getCoordinate = (isLat: boolean): string => {
    let coords = parkingdata.Coordinaten;
    if (newCoordinaten !== undefined) {
      coords = newCoordinaten;

    }
    if (coords === "") return "";

    const latlng = coords.split(",");
    if (isLat) {
      return latlng[0]?.toString() || '';
    } else {
      return latlng[1]?.toString() || '';
    }
  }

  const renderTabAlgemeen = (visible: boolean = false) => {
    const serviceIsActive = (ID: string): boolean => {
      const change = newServices.find(s => (s.ID === ID));
      if (change !== undefined) {
        return change.selected;
      }

      if (undefined === parkingdata.fietsenstallingen_services) {
        return false;
      }

      for (const item of parkingdata.fietsenstallingen_services) {
        if (item.services.ID === ID) {
          return true;
        }
      }

      return false;
    }

    const handleSelectService = (ID: string, checked: boolean) => {
      const index = newServices.findIndex(s => s.ID === ID);
      if (index !== -1) {
        newServices.splice(index, 1);
      } else {
        newServices.push({ ID: ID, selected: checked });
      }

      setNewServices([...newServices]);
    }

    const addressValid = () => {
      return ((parkingdata.Location !== "" || newLocation !== undefined) && (parkingdata.Plaats !== "" || newPlaats !== undefined)) ||
        (parkingdata.Postcode !== "" || newPostcode !== undefined)
    }

    const handleAddressLookup = async () => {
      let latlng = await geocodeAddress(
        newLocation !== undefined ? newLocation : parkingdata.Location,
        newPostcode !== undefined ? newPostcode : parkingdata.Postcode,
        newPlaats !== undefined ? newPlaats : parkingdata.Plaats
      );
      if (false !== latlng) {
        setNewCoordinaten(latlng.lat + "," + latlng.lon);
        setCenterCoords(latlng.lat + "," + latlng.lon);
      } else {
        alert("Er is geen locatie beschikbaar voor dit adres. U kunt de locatie handmatig aanpassen.");
      }
    }

    const handleCoordinatesLookup = async () => {
      let address = await reverseGeocode(newCoordinaten !== undefined ? newCoordinaten : parkingdata.Coordinaten);
      if (address && address.address) {
        let location = ((address.address.road || "---") + " " + (address.address.house_number || "")).trim();
        setNewLocation(location);
        setNewPostcode(address.address.postcode);
        const plaats = address.address.city || address.address.town || address.address.village || address.address.quarter;
        setNewPlaats(plaats);

        if ((parkingdata.Title === "" && (newTitle === "" || newTitle === undefined)) ||
          (newTitle && newTitle.startsWith("Nieuwe stalling")) ||
          (!newTitle && parkingdata.Title.startsWith("Nieuwe stalling"))) {
          setNewTitle("Nieuwe stalling " + (location + " " + plaats).trim());
        }
      } else {
        alert("Er is geen locatie beschikbaar voor dit adres. U kunt de locatie handmatig aanpassen.");
      }
    }

    const statusTypes = [
      { id: "0", name: "Verborgen" },
      { id: "1", name: "Actief" },
      { id: "new", name: "Voorstel" },
      { id: "aanm", name: "Voorstel" },
    ]

    return (
      <div className="flex justify-between" style={{ display: visible ? "flex" : "none" }}>
        <div data-name="content-left" className="sm:mr-12">
          <SectionBlockEdit>
            <div className="w-full mt-4">
              <FormInput
                key='i-title'
                label="Titel"
                className="border-2 border-black mb-1 w-full"
                placeholder="titel"
                onChange={e => { setNewTitle(e.target.value) }} value={newTitle !== undefined ? newTitle : parkingdata.Title}
              />
              <br />
              <FormInput
                key='i-location'
                label="Straat en huisnummer"
                className="border-2 border-black mb-1 w-full"
                placeholder="adres"
                onChange={e => { setNewLocation(e.target.value) }} value={newLocation !== undefined ? newLocation : parkingdata.Location}
              />
              <br />
              <>
                <FormInput key='i-postcode' label="Postcode" className="border-2 border-black mb-1 w-full" placeholder="postcode" onChange={e => { setNewPostcode(e.target.value) }} value={newPostcode !== undefined ? newPostcode : parkingdata.Postcode} />
                <FormInput key='i-plaats' label="Plaats" className="border-2 border-black mb-1 w-full" placeholder="plaats" onChange={e => { setNewPlaats(e.target.value) }} value={newPlaats !== undefined ? newPlaats : parkingdata.Plaats} />
                {addressValid() &&
                  <Button className="mr-4 mt-4" onClick={handleAddressLookup}>Toon op kaart</Button>}
              </>
              <br />
            </div>
          </SectionBlockEdit>

          <HorizontalDivider className="my-4" />

          <SectionBlock heading="Services">
            <div className="flex-1">
              <div>
                {allServices && allServices.map(service => (
                  <div key={service.ID}>
                    <label className="cursor-pointer hover:bg-gray-100 py-1 block">
                      <input
                        type="checkbox"
                        className="inline-block mr-2"
                        checked={serviceIsActive(service.ID)}
                        onChange={e => handleSelectService(service.ID, e.target.checked)}
                      />
                      {service.Name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </SectionBlock>

          <HorizontalDivider className="my-4" />

          <SectionBlock heading="Soort stalling">
            <select value={newStallingType !== undefined ? newStallingType : parkingdata.fietsenstalling_type[0]?.id} onChange={(event) => { setNewStallingType(event.target.value) }}>
              {allTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </SectionBlock>

          <HorizontalDivider className="my-4" />

          <SectionBlock heading="Tarief">
            <select value={newTariefcode !== undefined ? newTariefcode : parkingdata.tariefcode?.ID || -1} onChange={(event) => { setNewTariefcode(Number(event.target.value)) }}>
              <option key={'not-shown'} value={-1}>
                Wordt niet getoond
              </option>
              {allTariefcodes.map(code => (
                <option key={code.ID} value={code.ID}>
                  {code.Omschrijving}
                </option>
              ))}
            </select>
          </SectionBlock>
          <HorizontalDivider className="my-4" />

          <SectionBlock heading="Status">
            {/* <select value={parkingdata.Status} onChange={() => { }} disabled>
              {statusTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select> */}
            <label>{statusTypes.find(t => t.id === parkingdata.Status)?.name}</label>
          </SectionBlock>


          <p className="mb-10">{/*Some spacing*/}</p>

          {/*<button>Breng mij hier naartoe</button>*/}
        </div>

        <div data-name="content-right" className="ml-12 hidden sm:block relative">
          <div className="relative">
            <NoClickOverlay />
            <ParkingEditLocation parkingCoords={newCoordinaten !== undefined ? newCoordinaten : parkingdata.Coordinaten} centerCoords={centerCoords} onPan={updateCoordinatesFromMap} />
          </div>
          <FormHelperText className="w-full pb-2">
            <Typography className="py-2 text-center" variant="h6">Verschuif de kaart om de coordinaten aan te passen</Typography>
          </FormHelperText>
          <FormInput
            key='i-lat'
            label="Latitude"
            type="number"
            className="border-2 border-black pt-2 w-full"
            placeholder="latitude"
            onChange={updateCoordinatesFromForm(true)}
            value={getCoordinate(true)}
          />
          <FormInput
            key='i-lng'
            label="Longitude"
            type="number"
            className="border-2 border-black pt-2 w-full"
            placeholder="longitude"
            onChange={updateCoordinatesFromForm(false)}
            value={getCoordinate(false)}
          />
          {(newCoordinaten || !addressValid()) &&
            <Button className="mt-4" onClick={handleCoordinatesLookup}>Adres opzoeken</Button>}

          {<FormInput
            key='i-gemeente'
            label="Gemeente"
            type="text"
            className="border-2 border-black pt-2 w-full"
            placeholder=""
            value={currentMunicipality ? currentMunicipality.name : ""}
            disabled={true}
          />}
        </div>
      </div>
    );
  }

  const renderTabAfbeelding = (visible: boolean = false) => {
    return (
      <div className="flex justify-between w-full mt-10 - h-full" style={{ display: visible ? "flex" : "none" }}>
        <ParkingEditAfbeelding parkingdata={parkingdata} onUpdateAfbeelding={onChange} />
      </div>);
  }

  const renderTabOpeningstijden = (visible: boolean = false) => {
    const handlerSetNewOpening = (tijden: OpeningChangedType, Openingstijden: string): void => {
      setNewOpening(tijden);
      setNewOpeningstijden(Openingstijden);
      return;
    }
    return (
      <div className="flex justify-between w-full mt-10" style={{ display: visible ? "flex" : "none" }}>
        <ParkingEditOpening
          parkingdata={parkingdata}
          openingChanged={handlerSetNewOpening}
        />
      </div>);
  }

  const renderTabCapaciteit = (visible: boolean = false) => {
    const handlerSetNewCapaciteit = (capaciteit: ParkingSections): void => {
      setNewCapaciteit([...capaciteit]);
      return;
    }

    return (
      <div className="flex justify-between w-full mt-10" style={{ display: visible ? "flex" : "none" }}>
        <SectionBlockEdit>
          <ParkingEditCapaciteit
            parkingdata={parkingdata}
            update={newCapaciteit}
            capaciteitChanged={handlerSetNewCapaciteit}
          />
        </SectionBlockEdit>
      </div>
    );
  }

  const renderTabAbonnementen = (visible: boolean = false) => {
    return (
      <div className="flex justify-between w-full mt-10" style={{ display: visible ? "flex" : "none" }}>
        <ParkingViewAbonnementen parkingdata={parkingdata} />
      </div>);
    return (
      <div className="flex justify-between w-full mt-10">
        <SectionBlockEdit>
          <div className="ml-2 grid grid-cols-3">
            <div className="col-span-2">Jaarbonnement fiets</div>
            <div className="text-right sm:text-center">&euro;80,90</div>
            <div className="col-span-2">Jaarabonnement bromfiets</div>
            <div className="text-right sm:text-center">&euro;262.97</div>
          </div>
        </SectionBlockEdit>

        {/*<button>Koop abonnement</button>*/}
      </div>
    );
  }

  const renderTabBeheerder = (visible: boolean = false) => {
    // TODO: uitzoeken & implementeren FMS / ExploitantID logica
    if (parkingdata.FMS === true || !(parkingdata.ExploitantID === undefined || parkingdata.ExploitantID == null)) {
      return (
        <div className="flex justify-between" style={{ display: visible ? "flex" : "none" }}>
          <div data-name="content-left" className="sm:mr-12">
            <br />
            <ParkingViewBeheerder parkingdata={parkingdata} />
            <br />
            <h1>Wijzigen van de beheerder is op dit moment alleen mogelijk via het <a href="https://fms.veiligstallen.nl/" target="_blank" className="underline">FMS</a></h1>
          </div>
        </div>
      )
    }

    return (
      <div className="flex justify-between" style={{ display: visible ? "flex" : "none" }}>
        <div data-name="content-left" className="sm:mr-12">
          <SectionBlockEdit>
            <div className="w-full mt-4">
              <FormInput key='i-beheerder' label="Beheerder" className="border-2 border-black mb-1 w-full" placeholder="beheerder" onChange={e => { setNewBeheerder(e.target.value) }} value={newBeheerder !== undefined ? newBeheerder : parkingdata.Beheerder} />
              <FormInput key='i-beheerdercontact' label="Contactgegevens Beheerder" className="border-2 border-black mb-1 w-full" placeholder="contactgegevens" onChange={e => { setNewBeheerderContact(e.target.value) }} value={newBeheerderContact !== undefined ? newBeheerderContact : parkingdata.BeheerderContact} />
            </div>
          </SectionBlockEdit>
        </div>
      </div>
    )
  }

  let parkingTitle = parkingdata.Title;
  if (parkingdata.ID.substring(0, 8) === 'VOORSTEL') {
    parkingTitle += " (voorstel)";
  }

  const isLoggedIn = (session !== null);
  const hasID = (parkingdata.ID !== "");

  return (
    <div
      className="" style={{ minHeight: '65vh' }}
    >
      <div
        className="
          sm:mr-8 flex
          justify-between
        "
      >
        <PageTitle className="flex w-full justify-center sm:justify-start">
          <div className="mr-4 hidden sm:block">{parkingTitle || newTitle || "Nieuwe Stalling"}</div>
          {showUpdateButtons === true && allowSave && <Button
            key="b-1"
            className="mt-3 sm:mt-0"
            onClick={(e: any) => {
              if (e) e.preventDefault();
              handleUpdateParking();
            }}
          >
            {isVoorstel ? "Accepteer voorstel" : "Opslaan"}
          </Button>}
          {isVoorstel && <Button
            key="b-2"
            className="ml-6 mt-3 sm:mt-0"
            onClick={(e: any) => {
              if (e) e.preventDefault();
              handleRemoveParking("Weet u zeker dat u deze stalling wilt verwijderen? Dit kan niet ongedaan worden gemaakt!");
            }}
          >
            Verwijder
          </Button>}
          {showUpdateButtons === true && <Button
            key="b-3"
            className="mt-3 ml-2 sm:mt-0"
            variant="secundary"
            onClick={(e: MouseEvent) => {
              if (e) e.preventDefault();

              if (parkingdata?.Status === "aanm") {
                handleRemoveParking("Weet u zeker dat u de invoer wilt afbreken? De ingevoerde gegevens worden niet opgeslagen.");
              } else {
                if (confirm('Wil je het bewerkformulier verlaten?')) {
                  onClose(false);
                }
              }
            }}
          >
            Annuleer
          </Button>}
          {showUpdateButtons === false && <Button
            key="b-4"
            className="ml-2 mt-3 sm:mt-0"
            onClick={(e: any) => {
              if (e) e.preventDefault();
              onClose(false);
            }}
          >
            Terug
          </Button>}
        </PageTitle>
      </div>

      <Tabs value={selectedTab} onChange={handleChange} aria-label="simple tabs example">
        <Tab label="Algemeen" value='tab-algemeen' />
        {hasID && <Tab label="Afbeelding" value='tab-afbeelding' />}
        <Tab label="Openingstijden" value='tab-openingstijden' />

        {hasID && isLoggedIn && <Tab label="Capaciteit" value='tab-capaciteit' />}
        {hasID && isLoggedIn && <Tab label="Abonnementen" value='tab-abonnementen' />}
        {isLoggedIn && <Tab label="Beheerder" value='tab-beheerder' />}
      </Tabs>

      {renderTabAlgemeen(selectedTab === 'tab-algemeen')}
      {renderTabAfbeelding(selectedTab === 'tab-afbeelding' && hasID)}
      {renderTabOpeningstijden(selectedTab === 'tab-openingstijden')}
      {renderTabCapaciteit(selectedTab === 'tab-capaciteit' && hasID && isLoggedIn)}
      {renderTabAbonnementen(selectedTab === 'tab-abonnementen' && hasID && isLoggedIn)}
      {renderTabBeheerder(selectedTab === 'tab-beheerder' && isLoggedIn)}
    </div>
  );
};

export default ParkingEdit;
