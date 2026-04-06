// import { Button, Text } from "@mantine/core";
// import { modals } from "@mantine/modals";

// type ConfirmUploadProps = {
//   onConfirm?: () => void;
// };

// export function ConfirmUpload({ onConfirm }: ConfirmUploadProps) {
//   const openConfirmUploadModal = () =>
//     modals.openConfirmModal({
//       title: (
//         <Text fw={700} size="xl">
//           Confirm Upload
//         </Text>
//       ),
//       centered: true,
//       children: (
//         <Text size="sm">
//           Data for this month already exists. Are you sure you want to reupload? This action
//           cannot be undone.
//         </Text>
//       ),
//       labels: { confirm: "Upload", cancel: "Cancel" },
//       confirmProps: { color: "#163663" },
//       onCancel: () => console.log("Upload canceled"),
//       onConfirm,
//       groupProps: {
//         justify: "center",
//         grow: true,
//         align: "stretch",
//       },
//     });

//   return (
//     // <Button onClick={openConfirmUploadModal} color="#163663" fullWidth mt="md">
//     //   Delete
//     // </Button>
//   );
// }
