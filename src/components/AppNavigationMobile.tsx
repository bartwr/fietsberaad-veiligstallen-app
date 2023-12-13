import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import {
  setIsFilterBoxVisible,
  setIsMobileNavigationVisible,
  setIsParkingListVisible,
} from "~/store/appSlice";

import {
  getNavigationItemsForMunicipality,
  filterNavItemsBasedOnMapZoom,
  getPrimary,
  getSecundary,
  getFooter,
} from "~/utils/navigation";

import PageTitle from "~/components/PageTitle";

const NavSection = ({ children }: { children: any }) => {
  return (
    <div
      className="
		border-t-solid
		my-3
		border-t-2
		pb-0
		pt-3
	"
    >
      {children}
    </div>
  );
};

// If it has an icon: Show bold text
const NavItem = ({ title, icon, onClick }) => {
  return (
    <a
      className={`
		my-2
		flex
		cursor-pointer
		text-lg
		${icon ? "font-bold" : ""}
	`}
      onClick={onClick}
    >
      {icon ? (
        <div className="flex flex-col justify-center">
          <img
            src={`/images/${icon}`}
            alt={icon}
            className="
				mr-3 h-4 w-4
			"
          />
        </div>
      ) : (
        ""
      )}
      {title}
    </a>
  );
};

const AppNavigationMobile = ({
  activeMunicipalityInfo,
  mapZoom,
}: {
  activeMunicipalityInfo?: any;
  mapZoom?: number;
}) => {
  const { push } = useRouter();
  const dispatch = useDispatch();

  const [articles, setArticles] = useState([]);
  const [fietsberaadArticles, setFietsberaadArticles] = useState([]);

  // Get menu items based on active municipality
  useEffect(() => {
    // Get menu items from SiteID 1 OR SiteID of the municipality
    let SiteIdToGetArticlesFrom;
    if (mapZoom >= 12 && activeMunicipalityInfo && activeMunicipalityInfo.ID) {
      SiteIdToGetArticlesFrom = activeMunicipalityInfo.ID;
    } else {
      SiteIdToGetArticlesFrom = "1";
    }

    (async () => {
      const response = await getNavigationItemsForMunicipality(
        SiteIdToGetArticlesFrom
      );
      setArticles(response);
    })();
  }, [activeMunicipalityInfo]);

  // Get menu items for siteId 1 (Fietsberaad)
  useEffect(() => {
    (async () => {
      const response = await getNavigationItemsForMunicipality(1);
      setFietsberaadArticles(response);
    })();
  }, []);

  const clickItem = (url: string) => {
    console.log("sure");
    dispatch(setIsMobileNavigationVisible(false));
    dispatch(setIsParkingListVisible(false));
    push(url);
  };

  const title =
    mapZoom >= 12 &&
    activeMunicipalityInfo &&
    activeMunicipalityInfo.CompanyName
      ? `Welkom in ${activeMunicipalityInfo.CompanyName}`
      : `Welkom bij VeiligStallen`;

  const allMenuItems = filterNavItemsBasedOnMapZoom(articles, mapZoom);
  const primaryMenuItems = getPrimary(allMenuItems);
  const secundaryMenuItems = getSecundary(allMenuItems);
  const footerMenuItems = getFooter(fietsberaadArticles);

  return (
    <div
      className="
			px-5
			py-8
		"
    >
      <header>
        <PageTitle
          className="
					mb-2 text-2xl text-red-600
				"
          style={{
            maxWidth: "90%",
          }}
        >
          {title}
        </PageTitle>
        <p
          style={{
            maxWidth: "70%",
          }}
        >
          De kortste weg naar een veilige plek voor je fiets{" "}
          {mapZoom >= 12 ? "in Utrecht" : ""}
        </p>
      </header>

      <nav>
        <NavSection>
          <NavItem
            title="Kaart"
            icon="icon-map.png"
            onClick={(e) => {
              e.preventDefault();

              clickItem("/");
            }}
          />
          <NavItem
            title="Lijst"
            icon="icon-list.png"
            onClick={(e) => {
              e.preventDefault();

              push("/");
              dispatch(setIsMobileNavigationVisible(false));
              dispatch(setIsParkingListVisible(true));
            }}
          />
        </NavSection>

        {/* Primary Nav Items */}
        {primaryMenuItems && primaryMenuItems.length > 0 && (
          <NavSection>
            {primaryMenuItems.map((x, xidx) => (
              <NavItem
                key={"pmi-" + xidx}
                title={x.DisplayTitle ? x.DisplayTitle : x.Title ? x.Title : ""}
                onClick={(e) => {
                  e.preventDefault();
                  clickItem(
                    `/${
                      mapZoom >= 12 && activeMunicipalityInfo
                        ? activeMunicipalityInfo.UrlName
                        : "fietsberaad"
                    }/${x.Title ? x.Title : ""}`
                  );
                }}
              />
            ))}
          </NavSection>
        )}

        {/* Secundary Nav Items */}
        {secundaryMenuItems && secundaryMenuItems.length > 0 && (
          <NavSection>
            {secundaryMenuItems.map((x, xidx) => (
              <NavItem
                key={"pmi-" + xidx}
                title={x.DisplayTitle ? x.DisplayTitle : x.Title ? x.Title : ""}
                onClick={(e) => {
                  e.preventDefault();
                  clickItem(
                    `/${
                      mapZoom >= 12 && activeMunicipalityInfo
                        ? activeMunicipalityInfo.UrlName
                        : "fietsberaad"
                    }/${x.Title ? x.Title : ""}`
                  );
                }}
              />
            ))}
          </NavSection>
        )}
        <NavSection>
          {/*<NavItem title="Over VeiligStallen" />*/}
          {footerMenuItems.map((x, xidx) => (
            <NavItem
              key={"pmi-" + xidx}
              title={x.DisplayTitle ? x.DisplayTitle : x.Title ? x.Title : ""}
              onClick={(e) => {
                e.preventDefault();
                clickItem(`/fietsberaad/${x.Title ? x.Title : ""}`);
              }}
            />
          ))}
        </NavSection>
      </nav>
    </div>
  );
};

export default AppNavigationMobile;
