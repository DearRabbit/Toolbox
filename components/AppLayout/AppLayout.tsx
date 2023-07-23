import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ActionIcon, AppShell, Burger, Group, Header, MediaQuery, Navbar, NavLink, ScrollArea, Text } from '@mantine/core';

import { IconBrandGithub } from '@tabler/icons-react';
import ColorSchemeToggle from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import { navlinkItems } from './navlink-items';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: AppLayoutProps) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);

  const list = navlinkItems.map((item) => (
    <NavLink
      key={item.label}
      label={item.label}
      active={router.pathname === item.href}
      component={Link}
      href={item.href}
      variant="light"
      sx={(theme) => ({
        borderRadius: theme.radius.md,
        fontWeight: 500,
      })}
    />
  ));

  const navbar = (
    <Navbar hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 300 }} p="xs">
      <Navbar.Section grow component={ScrollArea}>
        {list}
      </Navbar.Section>
    </Navbar>
  );

  const header = (
    <Header height={{ base: 50 }} p="xs">
      <Group position="apart">
        <MediaQuery largerThan="sm" styles={{ visibility: 'hidden' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            size="sm"
            mr="xl"
          />
        </MediaQuery>
        <Text fw={700}> { title || 'Toolbox'} </Text>
        <Group>
          <ActionIcon variant="default" radius="xl" component={Link} href="/">
            <IconBrandGithub size="1rem" />
          </ActionIcon>
          <ColorSchemeToggle />
        </Group>
      </Group>
    </Header>
  )

  return (
    <AppShell
      navbarOffsetBreakpoint="sm"
      // navbar={navbar}
      header={header}
    >
      {children}
    </AppShell>
  );
}