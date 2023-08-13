import { useState } from 'react';
import { Button, Container, Group, MultiSelect, ScrollArea, Select } from '@mantine/core';
import { FileWithPath } from "@mantine/dropzone";

import useMountEffectOnce from '@/hooks/useMountEffectOnce';
import FilePicker from '@/components/FileUtils/FilePicker';
import ClipButton from '@/components/ClipButton/ClipButton';
import { ArchiveInfoReader, ArchiveInfo, MoelistFormatter, ForumList } from '@/libs/moelist';
import { showError, showWarning } from '@/utils/notifications';


export default function Moelist() {
  const [loading, setLoading] = useState(false);
  const [archiveInfos, setArchiveInfos] = useState<ArchiveInfo[]>([]);

  const [forum, setForum] = useState<string[]>([]);
  const forumSelector = ForumList.map((forum) => ({ value: forum, label: forum }));

  useMountEffectOnce(() => {
    ArchiveInfoReader.init();
  });

  const onDrop = async (files: FileWithPath[]) => {
    if (files.length === 0) return;
    setLoading(true);

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
      setArchiveInfos([...archiveInfos, ...infos]);
      if (infos.some((info) => MoelistFormatter.hasNonImageExtention(info))) {
        showWarning('存在非图片文件');
      }
      if (!infos.every((info) => MoelistFormatter.hasProperComment(info))) {
        showWarning('不符合规则的标签');
      }
    }
    setLoading(false);
  }

  return (
    <>
      <Container size="lg">
        <FilePicker
          loading={loading}
          onDrop={onDrop}
        />
        <Group position='center' py={20}>
          <MultiSelect
            clearable
            placeholder="版块 (Preview)"
            value={forum}
            onChange={setForum}
            data={forumSelector}
          />
          <Button
            color='red'
            onClick={() => {
              setArchiveInfos([]);
              setForum([]);
            }}
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
        <ScrollArea type="auto">
          {archiveInfos.length > 0 &&
            <pre>{MoelistFormatter.getPreviewStyle(archiveInfos, forum)}</pre>
          }
        </ScrollArea>
      </Container>
    </>
  )
}

Moelist.title = 'MoeList';
