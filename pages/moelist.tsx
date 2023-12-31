import { useRef, useState } from 'react';
import { Button, Container, Group, MultiSelect, ScrollArea } from '@mantine/core';
import { FileWithPath } from "@mantine/dropzone";

import useMountEffectOnce from '@/hooks/useMountEffectOnce';
import FilePicker from '@/components/FileUtils/FilePicker';
import ClipButton from '@/components/ClipButton/ClipButton';
import { ArchiveInfo, MoelistFormatter, ForumList } from '@/libs/moelist';
import { showError, showWarning } from '@/utils/notifications';


export default function Moelist() {
  const [loading, setLoading] = useState(false);
  const [archiveInfos, setArchiveInfos] = useState<ArchiveInfo[]>([]);

  const [forum, setForum] = useState<string[]>([]);
  const forumSelector = ForumList.map((forum) => ({ value: forum, label: forum }));

  const workerRef = useRef<Worker>()

  useMountEffectOnce(() => {
    workerRef.current = new Worker(new URL('@/libs/moelist/reader.worker', import.meta.url));

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'error') {
        showError(event.data.error);
      } else if (event.data.type === 'result') {
        let infos: ArchiveInfo[] = event.data.infos;
        setArchiveInfos(prev => [...prev, ...infos]);
        if (infos.some((info) => MoelistFormatter.hasNonImageExtention(info))) {
          showWarning('存在非图片文件');
        }
        if (!infos.every((info) => MoelistFormatter.hasProperComment(info))) {
          showWarning('不符合规则的标签');
        }
      }
      setLoading(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  });

  const onDrop = async (files: FileWithPath[]) => {
    if (files.length === 0) return;

    workerRef.current?.postMessage({ type: 'read', files });
    setLoading(true);
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
            miw={300}
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
            getValue={() => MoelistFormatter.getTableStyle(archiveInfos, forum)}
            hint='复制'
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
