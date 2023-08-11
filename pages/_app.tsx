import Head from 'next/head';
import type { NextPage } from 'next'
import type { AppProps } from 'next/app';

import { MantineProvider, ColorSchemeProvider, ColorScheme } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';

import AppLayout from '@/components/AppLayout/AppLayout';

export type NextPageWithLayout = NextPage & {
  title?: string
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'color-scheme',
    defaultValue: 'light',
  });

  const toggleColorScheme = () => setColorScheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <>
      <Head>
        <title>{Component.title || 'Toolbox'}</title>
        <meta name="description" content="Toolbox" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider theme={{colorScheme}}
          withGlobalStyles withNormalizeCSS>
          <Notifications limit={5} autoClose={10000}/>
          <AppLayout title={Component.title}>
            <Component {...pageProps} />
          </AppLayout>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
}
