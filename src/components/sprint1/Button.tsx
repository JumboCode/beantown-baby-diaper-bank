import { Button } from "@mantine/core";

export default function myButton(props: {
  label?: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Button
      variant="filled"
      color="green"
      size="sm"
      radius="lg"
      onClick={props.onClick}>
      {props.label}
    </Button>
  );
}
