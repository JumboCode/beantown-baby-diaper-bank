"use client"
import { Partner } from "./admin/PartnerTable";
import { PartnerRegion } from "@/generated/prisma/client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Paper, Stack, Text, Button, Group, SegmentedControl, Select, NumberInput, ActionIcon, Table } from '@mantine/core';

export default function UpdatePercentPartnerForm ({
  partners, percentages }: {
    partners: Partner[], percentages: PartnerRegion[]
}) {
   const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    partners.length > 0 ? partners[0].id : null
  );
  const [updateType, setUpdateType] = useState('one-time');
  //const [selectedMonth, setSelectedMonth] = useState(null);
  const [newPercentages, setNewPercentages] = useState<PartnerRegion[]>([]);
  useEffect(() => { 
    setNewPercentages(percentages);
  }, [percentages]);

  const partnerRows = useMemo(() => {
    if (selectedPartnerId == null) return [];
    return newPercentages.filter(
      (p) => Number(p.partnerId) === selectedPartnerId
    );
  }, [newPercentages, selectedPartnerId]);

  const updatePercentages = (
    partnerId: number, 
    cityId: number, 
    newPercentage: number
  ) => {
    const db = newPercentage/100; 

    setNewPercentages((prev) => 
      prev.map((p) =>
        Number(p.partnerId) === partnerId && Number(p.cityId) === cityId 
        ? {...p, percentage: db} : p
    ))
  };

  const calculateTotal = (partnerId: number | null) => {
    if(partnerId === null) {
      return 0;
    }
    const partnerPercentage = newPercentages.filter(
      (p) => Number(p.partnerId) === partnerId
    );
    return partnerPercentage.reduce((sum, p) => {
      const current = Number(p.percentage) * 100; 
      return sum + current;
    }, 0);
  };

  const calculateSelected = calculateTotal(selectedPartnerId);

  const handleSaved = async () => {
    if(selectedPartnerId === null) return; 
    
    const body: PartnerRegion[] = newPercentages.filter(
      (p) => Number(p.partnerId) === selectedPartnerId
    );

    try{
      const res = await fetch("/api/partners/percentages", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if(!res.ok) {
        console.log("Failed to update percentages");
      }else{
        console.log("All good!");
      }
    } catch (err) {
      console.log("Error updating percentages", err);
    }
  }

  const handleCancel = () => {
      setNewPercentages(percentages);
  };

  //hard coded cities 
  const cityOptions = [
      { value: "1", label: "Boston" },
      { value: "2", label: "Medford" },
      { value: "3", label: "Somerville" },
      { value: "4", label: "Arlington" },
      { value: "5", label: "Lexington" },
  ];

  const [newCityId, setNewCityId] = useState<string | null>(null);
  const [newCityPercentage, setNewCityPercentage] = useState<number | "">("");

  const availableCityOptions = useMemo(() => {
    const used = new Set(partnerRows.map((p) => String(p.cityId)));
    return cityOptions.filter((c) => !used.has(c.value));
  }, [partnerRows]);

  const handleAddCity = () => {
    if (
      selectedPartnerId === null ||
      !newCityId ||
      newCityPercentage === ""
    ) {
      return;
    }

    const cityIdNum = Number(newCityId);
    const db = Number(newCityPercentage) / 100;

    setNewPercentages((prev) => [
      ...prev,
      {
        partnerId: selectedPartnerId as any,
        cityId: cityIdNum as any,
        percentage: db,
      } as PartnerRegion,
    ]);

    setNewCityId(null);
    setNewCityPercentage("");
  };

  const handleRemoveRow = (partnerId: number, cityId: number) => {
    setNewPercentages((prev) =>
      prev.filter(
        (p) =>
          !(
            Number(p.partnerId) === partnerId &&
            Number(p.cityId) === cityId
          )
      )
    );
  };

  const labelForCity = (cityId: number | bigint) => {
    const opt = cityOptions.find((c) => c.value === String(cityId));
    return opt ? opt.label : `${cityId}`;
  };

return (
   <Paper>
    <Group align="flex-start" >
      <Text size="lg" fw={600}>Update City Distribution</Text>
      {/* Update Type Selection */}
      <Group style={{ marginLeft: '50%' }}>
          <Paper
            p="md"
            withBorder
            style={{
              cursor: 'pointer',
              borderColor: updateType === 'one-time' ? '#339AF0' : '#dee2e6',
              borderWidth: updateType === 'one-time' ? 2 : 1,
              backgroundColor: updateType === 'one-time' ? '#E7F5FF' : 'white'
            }}
            onClick={() => setUpdateType('one-time')}
          >
            <Stack gap="xs" align="center">
              <Text size="24px"></Text>
              <Text fw={600} size="sm">One-Time Update</Text>
              <Text size="xs" c="dimmed" ta="center">Update a specific month only</Text>
            </Stack>
          </Paper>

          <Paper
            p="md"
            withBorder
            style={{
              cursor: 'pointer',
              borderColor: updateType === 'continuous' ? '#339AF0' : '#dee2e6',
              borderWidth: updateType === 'continuous' ? 2 : 1,
              backgroundColor: updateType === 'continuous' ? '#E7F5FF' : 'white'
            }}
            onClick={() => setUpdateType('continuous')}
          >
            <Stack gap="xs" align="center">
              <Text size="24px"></Text>
              <Text fw={600} size="sm">Continuous Update</Text>
              <Text size="xs" c="dimmed" ta="center">Apply to all future distributions</Text>
            </Stack>
          </Paper>
        </Group>
    </Group>
   </Paper>
);
};






// export default function UpdatePercentPartnerForm({
//   partners, percentages
// }: {
//   partners: Partner[], percentages: PartnerRegion[]
// }) {

//   const [newPercentages, setNewPercentages] = useState<PartnerRegion[]>([]);

//   useEffect(() => {
//     setNewPercentages(percentages);
//   }, [percentages]);

//   const updateNewPercentages = (partnerId: number, cityId: number, percentage: number) => {
//     setNewPercentages(prev =>
//     prev.map(p =>
//       Number(p.partnerId) === partnerId && Number(p.cityId) === cityId
//         ? { ...p, percentage }
//         : p
//       )
//     );
//   }

//   //calculates the total sum for a partner
//   const calculateTotal = (partnerId: number) => {
//     const partnerPercentage = percentages.filter(
//       (p) => Number(p.partnerId) == partnerId);
    
//       return partnerPercentage.reduce((sum, p) => {
//         const current = p.percentage;
//         return Number(sum) + Number(current); 
//       })
//   }
  
//   const saveEdit = async () => {
//     await fetch("/api/partners/percentages", {
//       method: "POST", 
//       headers: { 'Content-Type': 'application/json'},
//       body: JSON.stringify(newPercentages)
//     })
//   }

//   return <div>
//     {partners.map((partner) => {
//       return <div>
//           <h1>{partner.name}</h1>
//           <span>{newPercentages.filter(percentage => Number(percentage.partnerId) == partner.id)
//             .map((percentage, index, arr) => {
//               if (percentage.percentage != null) {
//                 return <div key={index} className="inline">
//                     <p>{percentage.cityId}</p>
//                     <input value={String(percentage.percentage)} onChange={(e) => 
//                       updateNewPercentages(
//                         partner.id, 
//                         Number(percentage.cityId), 
//                         Number(e.target.value))}
//                     ></input>
//                   </div>
//               }
//             })}</span>
            
//             <button onClick={saveEdit}>Save</button>
//         </div>
//     })}
//   </div>;
// }
