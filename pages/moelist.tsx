import { useState } from 'react';
import { Button, Container, Group, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FileWithPath } from "@mantine/dropzone";

import useMountEffectOnce from '@/hooks/useMountEffectOnce';
import FilePicker from '@/components/FileUtils/FilePicker';
import ClipButton from '@/components/ClipButton/ClipButton';
import { ArchiveInfoReader, ArchiveInfo, MoelistFormatter, ForumList } from '@/libs/moelist';

function showError(message: any) {
  console.error(message);
  notifications.show({
    color: 'red',
    title: 'Error',
    message: message.toString(),
  });
}

export default function Moelist() {
  const [archiveInfos, setArchiveInfos] = useState<ArchiveInfo[]>([]);
  const [forum, setForum] = useState<string>('');
  const forumSelector = ForumList.map((forum) => ({ value: forum, label: forum }));

  useMountEffectOnce(() => {
    ArchiveInfoReader.init();
  });

  const onDrop = async (files: FileWithPath[]) => {
    if (files.length === 0) return;

    let infos = [];
    let archives = await ArchiveInfoReader.preprocess(files);
    let results = await Promise.allSettled(archives.map(ArchiveInfoReader.open));
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
  }

  return (
    <>
      <Container size="md">
        <FilePicker
          onDrop={onDrop}
        />
        <Group position='center' py={20}>
          <Select
            clearable
            placeholder="版块 (Preview)"
            onChange={(value) => setForum(value || '')}
            data={forumSelector}
          />
          <Button
            disabled={archiveInfos.length === 0}
            onClick={() => setArchiveInfos([])}
          >
            重置
          </Button>
          <ClipButton
            disabled={archiveInfos.length === 0}
            getValue={() => MoelistFormatter.getCodeStyle(archiveInfos, forum)}
            hint='代码'
          />
          <ClipButton
            disabled={archiveInfos.length === 0}
            getValue={() => MoelistFormatter.getTableStyle(archiveInfos, forum)}
            hint='表格'
          />
        </Group>
        {archiveInfos.length > 0 &&
          <pre>{MoelistFormatter.getPreviewStyle(archiveInfos, forum)}</pre>
        }
      </Container>
    </>
  )
}

Moelist.title = 'MoeList';
