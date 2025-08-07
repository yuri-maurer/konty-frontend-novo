// pages/_app.tsx
import '@/styles/globals.css';
import { useState } from 'react';
import type { AppProps } from 'next/app';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react';

// Adiciona a propriedade initialSession ao AppProps
interface MyAppProps extends AppProps<{ initialSession: Session }> {}

function MyApp({ Component, pageProps }: MyAppProps) {
  // Cria um cliente Supabase uma única vez e o armazena no estado.
  // Isto evita a recriação do cliente a cada renderização.
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    // O SessionContextProvider envolve toda a aplicação,
    // fornecendo um estado de sessão centralizado.
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}

export default MyApp;
