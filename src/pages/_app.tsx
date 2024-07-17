import { SessionProvider } from "next-auth/react"
import { Toaster } from 'react-hot-toast';
import { type AppType } from "next/app";
import { wrapper } from "../store/store";
import Head from "next/head";

import { api } from "~/utils/api";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "~/styles/globals.css";

import '~/styles/components/AppHeader.css';

const MyApp: AppType = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <>
      <Head>
        <meta
          name='viewport'
          content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
        />
        <script dangerouslySetInnerHTML={{
          __html: `
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:3621445,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `}} />
        <title>VeiligStallen</title>
      </Head>
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 5000,
          }}
        />
      </SessionProvider>
    </>)
};

export default api.withTRPC(wrapper.withRedux(MyApp));
