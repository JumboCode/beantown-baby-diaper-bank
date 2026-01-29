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
      confirmProps: { color: '#053766' },
      onCancel: () => console.log('Cancel'),
      onConfirm,
      groupProps: {
        justify: 'center',
        grow: true,      // each button expands
        align: 'stretch'
      },
    });

  return (
    <Button onClick={openDeleteModal} color="#053766" fullWidth 
    style={{marginTop: "5px"}}>
      Delete
    </Button>
  );
}