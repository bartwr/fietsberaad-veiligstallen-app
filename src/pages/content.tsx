import React, { useRef, useState, useEffect } from "react";
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from "react-redux";
import useQueryParam from '../hooks/useQueryParam';
import { getServerSession } from "next-auth/next"
import { authOptions } from '~/pages/api/auth/[...nextauth]'
import { signIn } from "next-auth/react";
import Head from "next/head";
import { usePathname } from 'next/navigation';

// Import components
import PageTitle from "~/components/PageTitle";
import FormInput from "~/components/Form/FormInput";
import FormCheckbox from "~/components/Form/FormCheckbox";
import AppHeader from "~/components/AppHeader";
import ParkingFacilityBrowser from "~/components/ParkingFacilityBrowser";
import { Button } from "~/components/Button";
import Modal from "src/components/Modal";
import Overlay from "src/components/Overlay";
import Parking from "~/components/Parking";
import Faq from "~/components/Faq";
import FooterNav from "~/components/FooterNav";

import Styles from "./content.module.css";

import { articles } from '@prisma/client'

import {
  getMunicipalityBasedOnUrlName
} from "~/utils/municipality";

import { getParkingsFromDatabase } from "~/utils/prisma";

import {
  setActiveMunicipalityInfo,
} from "~/store/mapSlice";
import { GetServerSidePropsContext } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const session = await getServerSession(context.req, context.res, authOptions) as vssession;
    const sites = session?.user?.sites || [];
    const fietsenstallingen = await getParkingsFromDatabase(sites);

    return {
      props: {
        fietsenstallingen: fietsenstallingen,
      },
    };
  } catch (ex: any) {
    // console.error("index.getStaticProps - error: ", ex.message);
    return {
      props: {
        fietsenstallingen: [],
      },
    };
  }
}

const Content: NextPage = ({ fietsenstallingen }) => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const pathName = usePathname();

  const [currentStallingId, setCurrentStallingId] = useState(undefined);
  const [pageContent, setPageContent] = useState({});

  const currentStalling = fietsenstallingen.find((stalling: any) => {
    return stalling.ID === currentStallingId;
  });

  const activeMunicipalityInfo = useSelector(
    (state: AppState) => state.map.activeMunicipalityInfo
  );

  // Do things is municipality if municipality is given by URL
  useEffect(() => {
    const municipalitySlug = pathName.split('/')[pathName.split('/').length - 2];
    if (!municipalitySlug) return;

    // Get municipality based on urlName
    (async () => {
      // Get municipality
      const municipality = await getMunicipalityBasedOnUrlName(municipalitySlug);
      // Set municipality info in redux
      dispatch(setActiveMunicipalityInfo(municipality));
    })();
  }, [
    pathName
  ]);

  // Get article content based on slug
  useEffect(() => {
    if (!pathName) return;
    if (!activeMunicipalityInfo || !activeMunicipalityInfo.ID) return;
    const pageSlug = pathName.split('/')[pathName.split('/').length - 1];
    if (!pageSlug) return;

    (async () => {
      try {
        const response = await fetch(
          `/api/articles/?Title=${pageSlug}&SiteID=${activeMunicipalityInfo.ID}&findFirst=true`
        );
        const json = await response.json();
        if (!json) return;
        // If result is an array with 1 node: Get node only
        const pageContentToSet: articles = json && json.SiteID ? json : json[0];
        setPageContent(pageContentToSet);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [
    pathName,
    activeMunicipalityInfo
  ]);

  const isSm = typeof window !== "undefined" && window.innerWidth < 640;
  const isLg = typeof window !== "undefined" && window.innerWidth < 768;

  if (!pageContent) {
    return (<div className="p-10">
      Geen pagina-inhoud gevonden. <a href="javascript:history.back();" className="underline">Ga terug</a>
    </div>);
  }

  const isFaq = pageContent.Title === 'FAQ';

  // Decide on what parkings to show on this page, if any
  let parkingTypesToFilterOn;
  if (pageContent && pageContent.Title === 'Stallingen') {
    parkingTypesToFilterOn = ['bewaakt', 'geautomatiseerd', 'onbewaakt', 'toezicht'];
  }
  else if (pageContent && pageContent.Title === 'Buurtstallingen') {
    parkingTypesToFilterOn = ['buurtstalling'];
  }
  else if (pageContent && (pageContent.Title === 'Fietstrommels' || pageContent.Title === 'fietstrommels')) {
    parkingTypesToFilterOn = ['fietstrommel'];
  }
  else if (pageContent && pageContent.Title === 'Fietskluizen') {
    parkingTypesToFilterOn = ['fietskluizen'];
  }

  return (
    <>
      <Head>
        <title>
          {activeMunicipalityInfo
            ? `${activeMunicipalityInfo.CompanyName} - VeiligStallen`
            : 'VeiligStallen'}
        </title>
      </Head>

      <AppHeader />

      <div className={`
				lg:mt-16
				p-4
				sm:pt-20
				container
				mx-auto

			 flex-wrap lg:flex justify-between lg:flex-nowrap

				${Styles.ContentPage_Body}
			`}>
        <div className="
					flex-1
					lg:mr-24
				">
          {(pageContent.DisplayTitle || pageContent.Title) ? <PageTitle>
            {pageContent.DisplayTitle ? pageContent.DisplayTitle : pageContent.Title}
          </PageTitle> : ''}
          {pageContent.Abstract ? <div className="
						text-lg
						my-4
					"
            dangerouslySetInnerHTML={{ __html: pageContent.Abstract }}
          /> : ''}

          {pageContent.Article ? <div className="
						my-4
						mt-12
					"
            dangerouslySetInnerHTML={{ __html: pageContent.Article }}
          /> : ''}

          {isFaq && <>
            <Faq />
          </>}
        </div>
        <div className="
					mt-10
					p-4
					max-w-full
				"
          style={{
            width: '414px'
          }}
        >
          {parkingTypesToFilterOn && <ParkingFacilityBrowser
            customFilter={(x) => {
              return parkingTypesToFilterOn.indexOf(x.Type) > -1 && activeMunicipalityInfo.CompanyName?.toLowerCase().indexOf(x.Plaats?.toLowerCase()) > -1;
            }}
            onShowStallingDetails={(id: any) => setCurrentStallingId(id)}
            fietsenstallingen={fietsenstallingen}
          />}
        </div>
      </div>

      {undefined !== currentStallingId && isSm && (<>
        <Overlay
          title={currentStalling.Title}
          onClose={() => setCurrentStallingId(undefined)}
        >
          <Parking
            key={currentStallingId}
            parkingID={currentStalling}
            startInEditMode={false}
          />
        </Overlay>
      </>)}

      {undefined !== currentStallingId && !isSm && (<>
        <Modal
          onClose={() => setCurrentStallingId(undefined)}
          clickOutsideClosesDialog={false}
        >
          <Parking
            key={currentStallingId}
            parkingID={currentStallingId}
            startInEditMode={false}
          />
        </Modal>
      </>)}

      <FooterNav />
    </>
  );
};

export default Content;
