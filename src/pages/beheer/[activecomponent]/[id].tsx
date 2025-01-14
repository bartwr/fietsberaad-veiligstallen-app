import React, { useState } from 'react';
import { GetServerSidePropsContext,GetServerSidePropsResult } from 'next';
import type { User, Session } from "next-auth";
import { getServerSession } from "next-auth/next"
import { authOptions } from '~/pages/api/auth/[...nextauth]'

import { useRouter } from "next/router";
import LeftMenu, {
  AvailableComponents,
  isAvailableComponent,
} from "../../../components/beheer/LeftMenu";
import TopBar from "../../../components/beheer/TopBar";
import { ReportBikepark } from "../../../components/beheer/reports/ReportsFilter";

import AbonnementenComponent from '../../../components/beheer/abonnementen';
import AccountsComponent from '../../../components/beheer/accounts';
import ApisComponent from '../../../components/beheer/apis';
import ArticlesComponent from '../../../components/beheer/articles';
import BarcodereeksenComponent from '../../../components/beheer/barcodereeksen';
import ContactsComponent from '../../../components/beheer/contacts';
import DocumentsComponent from '../../../components/beheer/documenten';
import ExportComponent from '../../../components/beheer/exports';
import FaqComponent from '../../../components/beheer/faq';
import HomeComponent from '../../../components/beheer/home';
import LogboekComponent from '../../../components/beheer/logboek';
import FietsenstallingenComponent from '../../../components/beheer/fietsenstallingen';
import PermitsComponent from '../../../components/beheer/permits';
import PresentationsComponent from '../../../components/beheer/presentations';
import ProductsComponent from '../../../components/beheer/producten';
import ReportComponent from '../../../components/beheer/reports';
import SettingsComponent from '../../../components/beheer/settings';
import TrekkingenComponent from '../../../components/beheer/trekkingen';
import UsersComponent from '../../../components/beheer/users';
import DatabaseComponent from '../../../components/beheer/database';

import { prisma } from '~/server/db';
import type { security_roles, fietsenstallingtypen } from '@prisma/client';
import type { VSContact, VSUserWithRoles } from "~/types/";
import { gemeenteSelect, securityUserSelect } from "~/types/";

import Styles from "~/pages/content.module.css";

export const getServerSideProps = async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<BeheerPageProps>> => {
  const session = await getServerSession(context.req, context.res, authOptions) as Session;
  // if(!session) {
  //   return { redirect: { destination: "/login?redirect=/beheer", permanent: false } };
  // }

  const currentUser = session?.user || false;

  const fietsenstallingtypen = await prisma.fietsenstallingtypen.findMany({
    select: {
      id: true,
      name: true,
      sequence: true
    }
  });

  const activeGemeenten: VSContact[] | undefined = await prisma.contacts.findMany({
    where: { ItemType: 'organizations', ID: { in: currentUser?.sites || [] } },
    select: gemeenteSelect,
  });

  const users: VSUserWithRoles[] | undefined = await prisma.security_users.findMany({
    where: { security_users_sites: { some: { SiteID: { in: currentUser?.sites || [] } } } },
    select: securityUserSelect,
  });

  if(users !== undefined && users[0] !== undefined) {
    users.sort((a, b) => (a.DisplayName || "").localeCompare(b.DisplayName || ""));
  }

  const bikeparks: ReportBikepark[] = []; // merge the ids and names for the stallingen in the gemeenten using map reduce
  if(activeGemeenten !== undefined && activeGemeenten[0]!== undefined) {
    activeGemeenten.forEach(gemeente => {
      if(gemeente.fietsenstallingen_fietsenstallingen_SiteIDTocontacts !== undefined) { 
        gemeente.fietsenstallingen_fietsenstallingen_SiteIDTocontacts
          .filter(stalling => stalling.StallingsID !== null)
          .forEach(stalling => {
            bikeparks.push({
              id: stalling.ID,
              stallingsID: stalling.StallingsID || "---",
              title: stalling.Title || `Stalling ${stalling.ID}`,
              gemeenteID: gemeente.ID,
              ZipID: gemeente.ZipID || "---",
              hasData: true,
          });
        });
      }
    });
  }

  bikeparks.sort((a, b) => a.title.localeCompare(b.title));

  const roles = await prisma.security_roles.findMany({});
  if(currentUser) {
  if(currentUser.image === undefined) {
    currentUser.image = "/images/user.png";
    }
  }else {
    console.log("no current user");
  }
  return { props: { currentUser, gemeenten: activeGemeenten, bikeparks, users, roles, fietsenstallingtypen } };
};

export type BeheerPageProps = {
  currentUser?: User;
  gemeenten?: VSContact[];
  bikeparks?: ReportBikepark[];
  selectedGemeenteID?: string;
  users?: VSUserWithRoles[];
  roles?: security_roles[];
  fietsenstallingtypen?: fietsenstallingtypen[];
};

const BeheerPage: React.FC<BeheerPageProps> = ({ 
  currentUser, 
  gemeenten, 
  bikeparks, 
  users, 
  roles, 
  fietsenstallingtypen }) => {

  const router = useRouter();

  const [selectedGemeenteID, setSelectedGemeenteID] = useState<string>("");

  const showAbonnementenRapporten = true;

  const firstDate = new Date("2018-03-01");

  const lastDate = new Date();
  lastDate.setHours(0, 0, 0, 0); // set time to midnight

  let activecomponent: AvailableComponents | undefined = "home";

  // useEffect(() => {
  //   if (selectedGemeenteID === "" && gemeenten && gemeenten.length > 0 && gemeenten[0] !== undefined) {
  //     setSelectedGemeenteID(gemeenten[0].ID);
  //   }
  // }, [gemeenten, selectedGemeenteID]);

  const activeComponentQuery = router.query.activecomponent;
  if (
    activeComponentQuery &&
    typeof activeComponentQuery === 'string' &&
    isAvailableComponent(activeComponentQuery)
  ) {
    activecomponent = activeComponentQuery as AvailableComponents;
  }

  const activeIDQuery = router.query.id;
  const activeId = typeof activeIDQuery === 'string' ? router.query.id as string : undefined;


  const handleSelectComponent = (componentKey: AvailableComponents) => {
    try {
      router.push(`/beheer/${componentKey}`); // this returns a promise!
    } catch (error) {
      console.error("Error in handleSelectComponent:", error);
    }
  };

  const handleSelectGemeente = (gemeenteID: string) => {
    try {
      setSelectedGemeenteID(gemeenteID);
    } catch (error) {
      console.error("Error in handleSelectComponent:", error);
    }
  };

  const filteredBikeparks = bikeparks?.filter((bikepark) => (selectedGemeenteID !== "") && (bikepark.gemeenteID === selectedGemeenteID));

  const filteredUsers = users?.filter((user) => (selectedGemeenteID !== "") && (user.security_users_sites.some(site => site.SiteID === selectedGemeenteID)));

  const renderComponent = () => {
    try {
      let selectedComponent = undefined;
      switch (activecomponent) {
        case "home":
          selectedComponent = <HomeComponent />;
          break;
        case "report":
          { selectedGemeenteID!=="" ? (
            selectedComponent = <ReportComponent
              showAbonnementenRapporten={showAbonnementenRapporten}
              firstDate={firstDate}
              lastDate={lastDate}
              bikeparks={filteredBikeparks || []}
            />
          ) : (
            selectedComponent = <div className="text-center text-gray-500 mt-10 text-xl" >Selecteer een gemeente om rapportages te bekijken</div>
          )}
          break;
        case "articles-pages":
          selectedComponent = <ArticlesComponent type="pages" />;
          break;
        case "faq":
          selectedComponent = <FaqComponent />;
          break;
        case "database":
          selectedComponent = <DatabaseComponent bikeparks={bikeparks} firstDate={firstDate} lastDate={lastDate} />;
          break;
        case "export":
          selectedComponent = <ExportComponent
              gemeenteID={selectedGemeenteID}
              gemeenteName={gemeenten?.find(gemeente => gemeente.ID === selectedGemeenteID)?.CompanyName || ""}
              firstDate={firstDate}
              lastDate={lastDate}
              bikeparks={filteredBikeparks || []}
          />; 
          break;
        case "documents":
          selectedComponent = <DocumentsComponent />;
          break;
        case "contacts-gemeenten":
          selectedComponent = (
            <ContactsComponent
              contacts={gemeenten || []}
              users={users || []}
              fietsenstallingtypen={fietsenstallingtypen || []}
              type="organizations"
            />
          );
          break;
        case "products":
          selectedComponent = <ProductsComponent />;
          break;
        case "logboek":
          selectedComponent = <LogboekComponent />;
          break;
        case "users-gebruikersbeheer":
          selectedComponent = <UsersComponent type="gebruiker" users={users || []} roles={roles || []} id={activeId} />;
          break;
        case "users-exploitanten":
          selectedComponent = <UsersComponent type="exploitant" users={users || []} roles={roles || []} id={activeId} />;
          break;
        case "users-beheerders":
          selectedComponent = <UsersComponent type="beheerder" users={users || []} roles={roles || []} id={activeId} />;
          break;
        case "fietsenstallingen":
          selectedComponent = <FietsenstallingenComponent type="fietsenstallingen" />;
          break;
        case "fietskluizen":
          selectedComponent = <FietsenstallingenComponent type="fietskluizen" />;
          break;
        case "buurtstallingen":
          selectedComponent = <FietsenstallingenComponent type="buurtstallingen" />;
          break;
        case "barcodereeksen-uitgifte-barcodes":
          selectedComponent = <BarcodereeksenComponent type="uitgifte-barcodes" />;
          break;
        case "barcodereeksen-sleutelhangers":
          selectedComponent = <BarcodereeksenComponent type="sleutelhangers" />;
          break;
        case "barcodereeksen-fietsstickers":
          selectedComponent = <BarcodereeksenComponent type="fietsstickers" />;
          break;
        case "permits":
          selectedComponent = <PermitsComponent />;
          break;
        case "presentations":
          selectedComponent = <PresentationsComponent />;
          break;
        case "settings":
          selectedComponent = <SettingsComponent />;
          break;
        case "trekkingen":
          selectedComponent = <TrekkingenComponent type="trekkingen" />;
          break;
        case "trekkingenprijzen":
          selectedComponent = <TrekkingenComponent type="prijzen" />;
          break;
        case "abonnementen":
          selectedComponent = <AbonnementenComponent type="abonnementen" />;
          break;
        case "abonnementsvormen":
          selectedComponent = <AbonnementenComponent type="abonnementsvormen" />;
          break;
        case "accounts":
          selectedComponent = <AccountsComponent />;
          break;
        case "apis-gekoppelde-locaties":
          selectedComponent = <ApisComponent type="gekoppelde-locaties" />;
          break;
        case "apis-overzicht":
          selectedComponent = <ApisComponent type="overzicht" />;
          break;
        case "articles-abonnementen":
          selectedComponent = <ArticlesComponent type="abonnementen" />;
          break;
        case "articles-articles":
          selectedComponent = <ArticlesComponent type="articles" />;
          break;
        case "articles-buurtstallingen":
          selectedComponent = <ArticlesComponent type="buurtstallingen" />;
          break;
        case "articles-fietskluizen":
          selectedComponent = <ArticlesComponent type="fietskluizen" />;
          break;
        // case "stalling-info":
        //   selectedComponent = <StallingInfoComponent />;
        //   break;
        default:
          console.warn("unknown component", activecomponent);
          selectedComponent = undefined;
          break;
      }

      return selectedComponent;
    } catch (error) {
      console.error("Error rendering component:", error);
      return <div>Error loading component</div>;
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        title="Veiligstallen Beheer Dashboard"
        currentComponent={activecomponent || "home"}
        user={currentUser} gemeenten={gemeenten}
        selectedGemeenteID={selectedGemeenteID}
        onGemeenteSelect={handleSelectGemeente}
      />
        <div className="flex">
        <LeftMenu
          user={currentUser}
          activecontact={gemeenten?.find(gemeente => gemeente.ID === selectedGemeenteID) || undefined}
          activecomponent={activecomponent}
          onSelect={(componentKey: AvailableComponents) => handleSelectComponent(componentKey)} // Pass the component key
        />

        {/* Main Content */}
        <div className={`flex-1 p-4 overflow-auto ${Styles.ContentPage_Body}`} style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {renderComponent()}
        </div>
      </div>
    </div>
  );
};

export default BeheerPage;
