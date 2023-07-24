import { useState } from 'react';
import { Container, Group, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FileWithPath } from "@mantine/dropzone";

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
            data={[
              { value: 'A', label: '中文漫画原创区' },
              { value: 'B', label: '非单行本分享区' },
              { value: 'C', label: '自制漫画分享区' },
              { value: 'D', label: '实体首发补档区' },
              { value: 'E', label: '实体二次分流区'},
              { value: 'F', label: '繁体中文电子版' },
              { value: 'G', label: '简体中文电子版'},
              { value: 'H', label: '外文原版分享区'}
            ]}
          />
          <ClipButton
            disabled={archiveInfos.length === 0}
            value={MoelistFormatter.getCodeStyle(archiveInfos)}
            hint='代码'
          />
          <ClipButton
            disabled={archiveInfos.length === 0}
            value={MoelistFormatter.getTableStyle(archiveInfos)}
            hint='表格'
          />
        </Group>
        {archiveInfos.length > 0 &&
          <pre> {MoelistFormatter.getPreviewStyle(archiveInfos)} </pre>
        }
      </Container>
    </>
  )
}

Moelist.title = 'MoeList';
