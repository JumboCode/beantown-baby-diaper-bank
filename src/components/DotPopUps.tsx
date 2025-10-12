import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Popover, Text, Button } from '@mantine/core';

const DotPopUps = () => {
  const dotData = [
    { title: "Dot 1", cityName: "Boston", numDiapers: 42, partnerOrgs: ["A", "B", "C"] },
    { title: "Dot 2", cityName: "Medford", numDiapers: 99, partnerOrgs: ["A", "D"], },
    { title: "Dot 3", cityName: "Somerville", numDiapers: 17, partnerOrgs: ["B", "C"], },
    { title: "Dot 4", cityName: "Cambridge", numDiapers: 63, partnerOrgs: ["A"] },
  ];

  return (
    <div>
      {dotData.map((dot, index) => (
        <SinglePopUp 
          key={index} 
          title={dot.title}
          cityName={dot.cityName} 
          numDiapers={dot.numDiapers} 
          partnerOrgs={dot.partnerOrgs} 
        /> 
      ))}
    </div>
  )
}

type SinglePopUpProps = {
  title: string,
  cityName: string,
  numDiapers: Number,
  partnerOrgs: string[],
};

const SinglePopUp = ({ title, cityName, numDiapers, partnerOrgs}: SinglePopUpProps ) => {
  const [opened, { close, open }] = useDisclosure(false);
  return (
    <Popover width={200} position="bottom" withArrow shadow="md" opened={opened}>
      <Popover.Target>
        <Button onMouseEnter={open} onMouseLeave={close}>
          {title}
        </Button>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
      <div>
        <p> City: {cityName}</p>
        <p> Diapers Distributed: {numDiapers.toString()} </p>
        <p> Parters: {partnerOrgs.join(', ')} </p>
      </div>    
      </Popover.Dropdown>
    </Popover>
  )
}

export default DotPopUps;