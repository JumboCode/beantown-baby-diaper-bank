import { useDisclosure } from "@mantine/hooks";
import { Popover } from "@mantine/core";
import { CircleDot } from "lucide-react";
import React from "react";
import PartnerInfo from "@/app/epic2sprint1/partnerInfo";

const dotData = [
  {
    title: "Dot 1",
    cityName: "Boston",
    numDiapers: 42,
    partnerOrgs: ["A", "B", "C"],
  },
  {
    title: "Dot 2",
    cityName: "Medford",
    numDiapers: 99,
    partnerOrgs: ["A", "D"],
  },
  {
    title: "Dot 3",
    cityName: "Somerville",
    numDiapers: 17,
    partnerOrgs: ["B", "C"],
  },
  {
    title: "Dot 4",
    cityName: "Cambridge",
    numDiapers: 63,
    partnerOrgs: ["A"],
  },
];

export default function DotPopUps() {
  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {dotData.map((dot, index) => (
        <SinglePopUp
          key={index}
          cityName={dot.cityName}
          numDiapers={dot.numDiapers}
        />
      ))}
    </div>
  );
}

type InfoDisplayerProps = {
  cityName: string | null | undefined;
  numDiapers: number | null;
  childrenHelped?: number | null;
};

export const InfoDisplayer = ({
  cityName,
  numDiapers,
  childrenHelped,
}: InfoDisplayerProps) => {
  return (
    <div>
      <p style={{ fontSize: "20px", fontWeight: "bold" }}> City: {cityName}</p>
      <p> Diapers Distributed: {numDiapers?.toString()} </p>
      <p> Children helped: {childrenHelped} </p>
      <PartnerInfo name={"test"} fromMarker={true} />
    </div>
  );
};

export const SinglePopUp = ({
  cityName,
  numDiapers,
  childrenHelped,
}: InfoDisplayerProps) => {
  const [opened, { close, open }] = useDisclosure(false);

  return (
    <Popover width={200} position="top" withArrow shadow="md" opened={opened}>
      <Popover.Target>
        <CircleDot
          style={{ color: "blue" }}
          onMouseEnter={open}
          onMouseLeave={close}
        ></CircleDot>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: "none" }}>
        <InfoDisplayer
          cityName={cityName}
          numDiapers={numDiapers}
          childrenHelped={childrenHelped}
        />
      </Popover.Dropdown>
    </Popover>
  );
};
