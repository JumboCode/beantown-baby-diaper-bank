import { useState, useEffect } from "react";
import { useDisclosure } from '@mantine/hooks';
import { Drawer, Button } from '@mantine/core';



const data = [
        {
            "id": 10,
            "created_at": "2025-10-30T18:23:29.990Z",
            "name": "Baycove - HOLD",
            "description": null,
            "start_partner": "2020-11-06T00:00:00.000Z",
            "waitlisted": true,
            "address": "66 Canal St Boston, 02114",
            "coords": null,
            "logo_url": "https://p7.hiclipart.com/preview/228/114/421/cafe-starbucks-tea-coffee-starbucks.jpg",
        },
        {
            "id": 9,
            "created_at": "2025-10-30T18:23:29.990Z",
            "name": "Old Colony YMCA",
            "description": null,
            "start_partner": "2024-11-27T00:00:00.000Z",
            "waitlisted": true,
            "address": "320 Main Street Brockton. 02301",
            "coords": null,
            "logo_url": null
        },
    ];



export default function PartnerInfo() {
	const [openedIndex, setOpenedIndex] = useState<number | null>(null);

	const openDrawer = (index: number) => setOpenedIndex(index);
	const closeDrawer = () => setOpenedIndex(null);

  return (
    <div>
		<h2>Partner Information</h2>
		
		{data.map((partner, index) => (
			<div key={partner.id} style={{ marginBottom: '1rem' }}>
				<Button variant="default" onClick={() => openDrawer(index)}>
					{partner.name}
				</Button>
				
				<Drawer 
					opened={openedIndex === index} 
					onClose={closeDrawer} 
					title={partner.name}
				>
					<p><strong>Name:</strong> {partner.name}</p>
					<p><strong>Description:</strong> {partner.description || 'N/A'}</p>
					<p><strong>Start Year:</strong> {new Date(partner.start_partner).getFullYear()}</p>
					<p><strong>Active:</strong> {partner.waitlisted ? "No" : "Yes"}</p>
					<p><strong>Address:</strong> {partner.address}</p>
					{partner.logo_url && (
						<img src={partner.logo_url} alt={`${partner.name} logo`} style={{ maxWidth: '200px', marginTop: '1rem' }} />
					)}
				</Drawer>
			</div>
		))}
    </div>
  );
}