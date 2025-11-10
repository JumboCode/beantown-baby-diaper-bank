"use client";
import { Mark, Title } from "@mantine/core";
import { useState } from "react";

// TODO: Implement the PartnerTable component to display partner organizations in a table format.
export default function PartnerTable() {
  const [partners, setPartners] = useState([]); // Placeholder for partner data state
  return (
    <Title>
      Edit{" "}
      <Mark
        c={"blue"}
        color={"clear"}>
        PartnerTable component
      </Mark>{" "}
      to display partner organizations in a table format
    </Title>
  );
}
