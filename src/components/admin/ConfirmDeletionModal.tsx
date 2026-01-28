import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

type ConfirmDeletionProps = {
  count: number;
  onConfirm?: () => void;
};

export function ConfirmDeletion({ count, onConfirm }: ConfirmDeletionProps) {
  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: `Are you sure you want to delete ${count} records?`,
      centered: true,
      children: (
        <Text size="sm">
          This action cannot be undone. This will permanently delete {count} records from the database.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: "Cancel" },
      confirmProps: { color: 'blue' },
      onCancel: () => console.log('Cancel'),
      onConfirm,
    });

  return <Button onClick={openDeleteModal} color="#053766">Delete</Button>;
}