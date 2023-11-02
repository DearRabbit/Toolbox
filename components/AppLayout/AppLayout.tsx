import Link from 'next/link';
import { ActionIcon, AppShell, Box, Group, Header, Text } from '@mantine/core';

import { IconQuestionMark } from '@tabler/icons-react';
import ColorSchemeToggle from '@/components/ColorSchemeToggle/ColorSchemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: AppLayoutProps) {
  const header = (
    <Header height={{ base: 50 }} p="xs">
      <Group position="apart">
        <Box/>
        <Text fw={700}> { title || 'Toolbox'} </Text>
        <Group>
          <ActionIcon
            variant="default"
            radius="xl"
            component="a"
            href="https://moeshare.cc/read-htm-tid-279823.html#3753382"
            target="_blank"
          >
            <IconQuestionMark size="1rem" />
          </ActionIcon>
          <ColorSchemeToggle />
        </Group>
      </Group>
    </Header>
  )

  return (
    <AppShell
      header={header}
    >
      {children}
    </AppShell>
  );
}