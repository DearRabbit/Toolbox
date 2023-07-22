import { Group, Text, useMantineTheme } from '@mantine/core';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { IconFileExport, IconFilePlus, IconX } from '@tabler/icons-react';

type FilePickerProps = Omit<DropzoneProps, 'children'>;

export default function FilePicker({ onDrop, ...props }: FilePickerProps) {
  const theme = useMantineTheme();

  return (
    <Dropzone
      onDrop={onDrop!}
      activateOnKeyboard={false}
      {...props}
    >
      <Group position="center" my="xl">
        <Dropzone.Accept>
          <IconFileExport
            size="2rem"
            color={theme.fn.primaryColor()}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size="2rem"
            color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFilePlus size="2rem" />
        </Dropzone.Idle>
          <Text size="xl" inline>
            拖动文件/文件夹至此
          </Text>
      </Group>
    </Dropzone>
  );
}