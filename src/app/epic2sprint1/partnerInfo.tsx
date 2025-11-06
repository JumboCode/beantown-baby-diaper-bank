import { useState, useEffect } from "react";
import { useDisclosure } from '@mantine/hooks';
import { Drawer, Button } from '@mantine/core';

// this is the format of the data that we are retrieving using API
// one we call one index of the retrieved data as one instance of Partner
type Partner = {
	id: number;
	created_at: string;
	name: string;
	description: string | null;
	start_partner: string | null;
	waitlisted: boolean;
	address: string | null;
	coords: any;
	logo_url: string | null;
};


export default function PartnerInfo() {

	// Generic form of useState is const[state, setState] = useState<type>(initialValue);
	// state is the current value (whatever it may be), this is the variable
	// setState is the function to update the state, so whenever you call setState(newValue), it will rerender the component to update the value
	// <type> is what data type the state holds, in this case, an empty array [] of Partner types
	// initialValue is the initial value of the state, in this case the empty array [] within the parenthesis
	const [data, setData] = useState<Partner[]>([]);
	const [opened, { open, close }] = useDisclosure(false);


	//const openDrawer = (index: number) => setOpenedIndex(index);
	//const closeDrawer = () => setOpenedIndex(null);

	// use useEffect so that we fetch data after the component renders. i.e. visuals will load first, then it worries about retrieving data
	useEffect(() => {

		// async is a function that is asynchronous, it means it promises to return something and lets us use await inside it, like a place holder
		const fetchPartners = async () => {
			// using a try-catch to handle errors
			try {
				const response = await fetch('/api/partners');
				if (!response.ok) {
					console.log('Failed to fetch partners');
				}
				const result = await response.json();
				// update data to retrieved data
				setData(result.data);
			} catch (err) {
				console.log('Unexpected error:', err);
			}
		};

		// we call the function that we wrote above
		fetchPartners();

	}, []); 

  return (

    <div>
		<h2 style={{ margin: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>Partner Information</h2>

		{/* map to each index of data */}
		{data.map((partner) => (

			<div key={partner.id} style={{ display: 'inline-block', margin: '0.5rem', justifyContent: 'center' }}>

				<Drawer opened={opened} onClose={close} title="Information" overlayProps={{ opacity: 0.1}}>
					<p><strong>Name:</strong> {partner.name}</p>
					<p><strong>Description:</strong> {partner.description || 'N/A'}</p>
					<p><strong>Start Year:</strong> {partner.start_partner || 'N/A'}</p>
					<p><strong>Active:</strong> {partner.waitlisted ? "No" : "Yes"}</p>
					<p><strong>Address:</strong> {partner.address || 'N/A'}</p>
					{partner.logo_url && (
						<img src={partner.logo_url} alt={`${partner.name} logo`} style={{ maxWidth: '200px', marginTop: '1rem' }} />
					)}
				</Drawer>

				<Button 
					variant="outline" 
					size="xl" 
					radius="lg" 
					color="dark"

					leftSection= {partner.logo_url && (
						<img
							src={partner.logo_url}
							style={{ height: 30}}
						/>
					)}
				onClick={open}>

					{partner.name}

				</Button>

			</div>

		))}

    </div>
  );
}