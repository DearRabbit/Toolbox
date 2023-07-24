import { Button, ButtonProps } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';

interface ClipButtonProps extends ButtonProps {
  getValue: () => string;
  hint?: string;
};

export default function ClipButton({ getValue, hint, disabled }: ClipButtonProps) {
  const clipboard = useClipboard({ timeout: 500 });

  return (
    <Button
      color={clipboard.copied ? 'teal' : 'blue'}
      onClick={() => clipboard.copy(getValue())}
      disabled={disabled}
    >
      {clipboard.copied ? '已复制!' : (hint || '复制')}
    </Button>
  );
}