import { Button, Mark, Text } from "@mantine/core";
import { modals } from "@mantine/modals";

type ConfirmDeletionProps = {
  count: number;
  onConfirm?: () => void;
};

export function ConfirmDeletion({ count, onConfirm }: ConfirmDeletionProps) {
  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: (
        <Text fw={700} size="xl">
          Confirm Deletion
        </Text>
      ),
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to{" "}
          <Mark fw={700} bg="none" c="red">
            {" "}
            delete {count} records
          </Mark>
          ? This action cannot be undone. This will permanently delete these records from the
          database.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "brand" },
      onCancel: () => console.log("Cancel"),
      onConfirm,
      size: "lg",
      groupProps: {
        justify: "center",
        grow: true, // each button expands
        align: "stretch",
      },
    });

  return (
    <Button onClick={openDeleteModal} color="brand" fullWidth mt="md">
      Delete
    </Button>
  );
}
