// @ts-nocheck
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react"

import Logo from './Logo';

const PrimaryMenuItem = (props: any) => {
  return <div className="
    PrimaryMenuItem
    px-5
  ">
    <a href="#" className="flex flex-col justify-center h-full">
      {props.item}
    </a>
  </div>
}

const SecundaryMenuItem = (props: any) => {
  return <div className="
    SecundaryMenuItem
    px-2
  ">
    <a href="#" className="flex flex-col justify-center h-full">
      {props.item}
    </a>
  </div>
}

function AppHeaderDesktop({
  children
}: {
  children?: any
}) {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const { data: session } = useSession()
  
  const isAuthenticated = useSelector(
    (state: AppState) => state.auth.authState
  );
  const handleLoginClick = () => {
    if(!session) {
      push('/login');
    } else {
      // sign out
      signOut();
    }
  };

  const primaryMenuItems = [
    'ICN',
    'Koop abonnement',
    'Over Utrecht Fietst!',
    'Buurtstallingen',
    'Fietstrommels'
  ];

  const secundaryMenuItems = [
    'FAQ',
    'Tips',
    'Contact'
  ];

  return (
    <>
      <div
        className="
          t-0
          fixed z-10
          flex
          w-full
          justify-between
          px-5
          py-3
          bg-white

          overflow-hidden
        "
        style={{height: '64px'}}
      >
        <Logo />
        <div className="flex-1 flex flex-start">
          {primaryMenuItems.map(x => <PrimaryMenuItem key={x} item={x} />)}
        </div>
        <div className="flex flex-end">
          {secundaryMenuItems.map(x => <SecundaryMenuItem key={x} item={x} />)}
          <button
            className="
              mx-2
              h-10
              rounded-md
              bg-blue-500
              px-4
              font-bold
              text-white
              shadow-lg
              hover:bg-blue-700
            "
            onClick={handleLoginClick}
          >
            {session ? "Logout" : "Login"}
          </button>
        </div>
      </div>

      {children}

    </>
  );
}

export default AppHeaderDesktop;
