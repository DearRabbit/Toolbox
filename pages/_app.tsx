import Head from 'next/head';
import type { AppProps } from 'next/app';

import { MantineProvider, ColorSchemeProvider, ColorScheme } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';

import AppLayout from '@/components/AppLayout/AppLayout';

export default function App({ Component, pageProps }: AppProps) {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'color-scheme',
    defaultValue: 'light',
  });

  const toggleColorScheme = () => setColorScheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <>
      <Head>
        <title>Toolbox</title>
        <meta name="description" content="Toolbox" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider theme={{
            colorScheme,
            spacing: {
              tiny: '0.25rem',
            }
          }}
          withGlobalStyles withNormalizeCSS>
          <Notifications limit={5}/>
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
}
