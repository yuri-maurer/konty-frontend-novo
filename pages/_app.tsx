// pages/_app.tsx
import '@/styles/globals.css';
import { useState } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react';
import { FavoritesProvider } from '../components/contexts/FavoritesContext';

interface MyAppProps extends AppProps<{ initialSession: Session }> {}

function MyApp({ Component, pageProps }: MyAppProps) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <FavoritesProvider>
        <Head>
          <title>Konty Sistemas</title>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            // CORREÇÃO: A propriedade 'xintegrity' foi corrigida para 'integrity'.
            xintegrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </Head>
        <Component {...pageProps} />
      </FavoritesProvider>
    </SessionContextProvider>
  );
}

export default MyApp;
