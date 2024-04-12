import { abonnementsvormen, fietsenstallingtypen, tariefcodes } from '@prisma/client';

/* This type is used when returning parking details to the client                */
/* By adding fields to this structure, it is possible to keep track which fields */
/* from the "old" database are in use                                            */
export type DayPrefix = 'ma' | 'di' | 'wo' | 'do' | 'vr' | 'za' | 'zo';

export type ParkingSectionPerBikeType = {
    Toegestaan: boolean | null,
    Capaciteit: number | null,
    fietstype: {
        Name: string // Assuming Name is of type string
    }
}

export type ParkingSection = {
    titel: string,
    secties_fietstype: ParkingSectionPerBikeType[] // base data for capacity
}

export type UpdateParkingSectionsData = {
    parkingId: string,
    sectionId: number,
    parkingSections: ParkingSections
}

export type ParkingSections = ParkingSection[];

export type ParkingDetailsType = {
    ID: string,
    Status: string,
    Title: string,
    Location: string,
    Postcode: string,
    Plaats: string,
    Type: string,
    SiteID: string,
    Description: string;
    Image: any;
    Open_ma: Date,
    Dicht_ma: Date,
    Open_di: Date,
    Dicht_di: Date,
    Open_wo: Date,
    Dicht_wo: Date,
    Open_do: Date,
    Dicht_do: Date,
    Open_vr: Date,
    Dicht_vr: Date,
    Open_za: Date,
    Dicht_za: Date,
    Open_zo: Date,
    Dicht_zo: Date,
    Openingstijden: string,
    Capacity: number,
    Coordinaten: string,
    DateCreated: Date,
    DateModified: Date,
    FMS: boolean,
    Beheerder: string,
    BeheerderContact: string,
    fietsenstalling_type: fietsenstallingtypen[],
    fietsenstalling_secties: ParkingSections,
    // abonnementen: abonnementsvorm_fietsenstalling[],
    abonnementsvorm_fietsenstalling: {
        SubscriptionTypeID: number,
        BikeparkID: string,
        abonnementsvormen: abonnementsvormen
    }[],
    // abonnementsvormen: {
    //     ID: string,
    //     naam: string,
    //     omschrijving: string,
    //     prijs: string,
    //     tijdsduur: string,
    //     conditions: string,
    //     siteID: string,
    //     bikeparkTypeID: string,
    //     isActief: string,
    //     exploitantSiteID: string,
    //     idmiddelen: string,
    //     contractID: string,
    //     paymentAuthorizationID: string,
    //     conditionsID: string
    // }[]
    // },
    ExploitantID: string,
    exploitant: {
        ID: string,
        Helpdesk: string,
        CompanyName: string,
    },
    fietsenstallingen_services:
    {
        services: {
            ID: string,
            Name: string
        }
    }[],
    tariefcode: tariefcodes
}