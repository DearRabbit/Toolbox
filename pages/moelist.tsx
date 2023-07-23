import { useState } from 'react';
import Head from 'next/head';
import { Container, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import useMountEffectOnce from '@/hooks/useMountEffectOnce';
import FilePicker from '@/components/FileUtils/FilePicker';
import ClipButton from '@/components/ClipButton/ClipButton';
import { ArchiveInfoReader, ArchiveInfo, MoelistFormatter } from '@/libs/moelist';

function showError(message: any) {
  notifications.show({
    color: 'red',
    title: 'Error',
    message: message.toString(),
  });
}

export default function Moelist() {
  const [archiveInfos, setArchiveInfos] = useState<ArchiveInfo[]>([]);

  useMountEffectOnce(() => {
    ArchiveInfoReader.init();
  });

  const onDrop = async (files: File[]) => {
    if (files.length === 0) return;

    Promise.allSettled(files.map(ArchiveInfoReader.open))
      .then((results) => {
        let infos = [];
        for (let result of results) {
          if (result.status === "fulfilled") {
            infos.push(result.value);
          } else {
            showError(result.reason);
          }
        }
        if (infos.length > 0) {
          setArchiveInfos(infos);
        }
      });
  }

  return (
    <>
      <Container size="md">
        <FilePicker
          onDrop={onDrop}
        />
        {archiveInfos.length > 0 &&(
          <>
            <Group position='center' py={10}>
              <ClipButton
                value={MoelistFormatter.getCodeStyle(archiveInfos)}
                hint='代码'
              />
              <ClipButton
                value={MoelistFormatter.getTableStyle(archiveInfos)}
                hint='表格'
              />
            </Group>
            <pre> {MoelistFormatter.getPreviewStyle(archiveInfos)} </pre>
          </>
        )}
      </Container>
    </>
  )
}

Moelist.title = 'MoeList';