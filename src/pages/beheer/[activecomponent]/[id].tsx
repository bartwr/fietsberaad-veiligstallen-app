import React, { useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next';

import { useRouter } from 'next/router';
import LeftMenu, { AvailableComponents, isAvailableComponent } from '../../../components/beheer/LeftMenu';
import TopBar from '../../../components/beheer/TopBar';
import { mockUser, mockCouncil, mockExploitant, Gemeente, User, MockUser } from '../../../utils/mock';
import { ReportBikepark } from '../../../components/beheer/reports/ReportsFilter';

import AbonnementenComponent from '../../../components/beheer/abonnementen';
import AccountsComponent from '../../../components/beheer/accounts';
import ApisComponent from '../../../components/beheer/apis';
import ArticlesComponent from '../../../components/beheer/articles';
import BarcodereeksenComponent from '../../../components/beheer/barcodereeksen';
import ContactsComponent from '../../../components/beheer/contacts';
import DocumentsComponent from '../../../components/beheer/documenten';
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
import { security_users, security_roles } from '@prisma/client';
export const getServerSideProps = async (props: GetServerSidePropsContext) => {
  const currentUser = mockUser;

  const activeGemeentes = await prisma.contacts.findMany({
    where: { ItemType: 'organizations', ID: { in: currentUser.getGemeenteIDs() } },
    select: { ID: true, CompanyName: true, fietsenstallingen_fietsenstallingen_SiteIDTocontacts: true },
  });
  const gemeentes = activeGemeentes.map((gemeente) => ({ id: gemeente.ID, title: gemeente.CompanyName } as Gemeente));

  const bikeparks: ReportBikepark[] = []; // merge the ids and names for the stallingen in the gemeentes using map reduce
  activeGemeentes.map((gemeente) => {
    gemeente.fietsenstallingen_fietsenstallingen_SiteIDTocontacts
      .filter(stalling => stalling.StallingsID !== null)
      .map((stalling) => {
        bikeparks.push({ id: stalling.ID, stallingsID: stalling.StallingsID || "---", title: stalling.Title || `Stalling ${stalling.ID}`, gemeenteID: gemeente.ID, hasData: true });
      });
  });

  bikeparks.sort((a, b) => a.title.localeCompare(b.title));

  const users = await prisma.security_users.findMany({
    select: {
      UserID: true,
      UserName: true,
      DisplayName: true,
      RoleID: true,
      Status: true,
      GroupID: true,
      security_roles: {
        select: {
          RoleID: true,
          Role: true,
          Description: true,
        }
      }
    }
  });
  users.sort((a, b) => (a.DisplayName || "").localeCompare(b.DisplayName || ""));

  const roles = await prisma.security_roles.findMany({});
  return { props: { gemeentes, bikeparks, users, roles } }
}

export type BeheerPageProps = {
  gemeentes?: Gemeente[],
  bikeparks?: ReportBikepark[],
  selectedGemeenteID?: string,
  users?: security_users[],
  roles?: security_roles[]
}

const BeheerPage: React.FC<BeheerPageProps> = ({ gemeentes, bikeparks, users, roles }) => {

  const router = useRouter();

  const [selectedGemeenteID, setSelectedGemeenteID] = useState<string | undefined>(undefined);

  const showAbonnementenRapporten = true;

  const firstDate = new Date("2018-03-01");

  const lastDate = new Date();
  lastDate.setHours(0, 0, 0, 0); // set time to midnight

  let activecomponent: AvailableComponents | undefined = "home";

  useEffect(() => {
    if (selectedGemeenteID === undefined && gemeentes && gemeentes.length > 0 && gemeentes[0] !== undefined) {
      setSelectedGemeenteID(gemeentes[0].id);
    }
  }, [gemeentes, selectedGemeenteID]);

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

  const filteredBikeparks = bikeparks?.filter((bikepark) => (selectedGemeenteID !== undefined) && (bikepark.gemeenteID === selectedGemeenteID));

  const renderComponent = () => {
    try {
      let selectedComponent = undefined;
      switch (activecomponent) {
        case "home":
          selectedComponent = <HomeComponent />;
          break;
        case "report":
          selectedComponent = <ReportComponent
            showAbonnementenRapporten={showAbonnementenRapporten}
            firstDate={firstDate}
            lastDate={lastDate}
            bikeparks={filteredBikeparks || []}
          />;
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
        case "documents":
          selectedComponent = <DocumentsComponent />;
          break;
        case "contacts":
          selectedComponent = <ContactsComponent />;
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
        user={mockUser} gemeentes={gemeentes}
        selectedGemeenteID={selectedGemeenteID}
        onGemeenteSelect={handleSelectGemeente}
      />
      <div className="flex">
        <LeftMenu
          user={mockUser}
          council={mockCouncil}
          exploitant={mockExploitant}
          activecomponent={activecomponent}
          onSelect={(componentKey: AvailableComponents) => handleSelectComponent(componentKey)} // Pass the component key
        />

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {renderComponent()}
        </div>
      </div>
    </div>
  );
};

export default BeheerPage;
