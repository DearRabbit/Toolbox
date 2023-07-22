import { Button } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';

interface ClipButtonProps {
  value: string;
  hint?: string;
};

export default function ClipButton({ value, hint }: ClipButtonProps) {
  const clipboard = useClipboard({ timeout: 500 });

  return (
    <Button
      color={clipboard.copied ? 'teal' : 'blue'}
      onClick={() => clipboard.copy(value)}
    >
      {clipboard.copied ? '已复制!' : (hint || '复制')}
    </Button>
  );
}