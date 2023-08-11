import { notifications } from '@mantine/notifications';

export function showError(message: any) {
  console.error(message);
  notifications.show({
    color: 'red',
    title: 'Error',
    message: message.toString(),
  });
}

export function showWarning(message: any) {
  notifications.show({
    color: 'yellow',
    title: 'Warning',
    message: message.toString(),
  })
}