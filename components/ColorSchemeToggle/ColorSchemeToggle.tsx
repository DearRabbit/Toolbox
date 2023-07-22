import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons-react';

export default function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon variant="default" radius="xl" onClick={() => toggleColorScheme()}>
      {colorScheme === 'dark' ?
          <IconMoonStars size="1rem"/>
        : <IconSun size="1rem"/>
      }
    </ActionIcon>
  );
}