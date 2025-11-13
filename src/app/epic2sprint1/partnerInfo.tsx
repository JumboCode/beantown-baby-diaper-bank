import { useState, useEffect } from "react";
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
	coords: { lat: number; lng: number };
	logo_url: string | null;
};

type PartnerInfoProps = {
	name?: string[] | undefined;
	fromMarker?: boolean;
}


export default function PartnerInfo({ name, fromMarker = false } : PartnerInfoProps) {

	// Generic form of useState is const[state, setState] = useState<type>(initialValue);
	// state is the current value (whatever it may be), this is the variable
	// setState is the function to update the state, so whenever you call setState(newValue), it will rerender the component to update the value
	// <type> is what data type the state holds, in this case, an empty array [] of Partner types
	// initialValue is the initial value of the state, in this case the empty array [] within the parenthesis
	const [data, setData] = useState<Partner[]>([]);
	//changed this b/c disclosure was only showing info for one partner
	const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

	// use useEffect so that we fetch data after the component renders. i.e. visuals will load first, then it worries about retrieving data
	useEffect(() => {
		// async is a function that is asynchronous, it means it promises to return something and lets us use await inside it, like a place holder
		let ignore = false;

		const fetchPartner = async (partnerName? : string) => {
			try {
				const url = partnerName ? `/api/partners?search=${partnerName}` : `/api/partners`;
				const response = await fetch(url);
				if (!response.ok) {
					console.log(`Failed to fetch partner: ${partnerName}`);
					return [];
				}
				const result = await response.json() as { data: Partner[] };
				return result.data;
			} catch (err) {
				console.log('Unexpected error:', err);
				return [];
			}
		}
		
		const loadSelectedPartners = async() => {
			const fetchPromises = name!.map((name) => fetchPartner(name));
			const allPartners = await Promise.all(fetchPromises);
			const flatData = allPartners.flat();
			if (!ignore) {
				setData(flatData);
			}
		}

		if (name && name.length > 0) {
			loadSelectedPartners();
		} else {
			fetchPartner().then((data) => setData(data));
		}

		return () => {
			ignore = true;
		}
	}, [name]); 

  return (

    <div>
			{fromMarker ? 
				<p>Partner Information</p>
			: 
				<h2 style={{ margin: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
					Partner Information
				</h2> 
			}

			<div 
				style={{ 
					display: 'flex', 
					flexWrap: 'wrap', 
					gap: '0.5rem', 
					justifyContent: 'center',
					flexDirection: fromMarker ? 'column' : 'row', 
				}}
			>
				{data.map((partner) => {
					return (
					<Button
						key={partner.id}
						variant="outline" 
						size={ fromMarker ? "sm" : "xl"}
						radius="lg" 
						color="dark"
						leftSection={partner.logo_url && (
							<img
								src={partner.logo_url}
								style={{ height: 30 }}
							/>
						)}
						onClick={() => setSelectedPartner(partner)}
					>
						<span
							style={{ 
								display: 'inline-block', 
								overflow: 'hidden', 
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap'
							}} 
						>
							{partner.name}
						</span>
					</Button>)
				})}
			</div>

			{/* drawer info changes depending on what partner is selected*/}
			<Drawer 
				opened={selectedPartner !== null} 
				onClose={() => setSelectedPartner(null)} 
				title={selectedPartner?.name || "Information"} 
				overlayProps={{ opacity: 0.1 }}
			>
				{selectedPartner && (
					<>
						<p><strong>Name:</strong> {selectedPartner.name}</p>
						<p><strong>Description:</strong> {selectedPartner.description || 'N/A'}</p>
						<p><strong>Start Year:</strong> {selectedPartner.start_partner || 'N/A'}</p>
						<p><strong>Active:</strong> {selectedPartner.waitlisted ? "No" : "Yes"}</p>
						<p><strong>Address:</strong> {selectedPartner.address || 'N/A'}</p>
						{selectedPartner.logo_url && (
							<img src={selectedPartner.logo_url} alt={`${selectedPartner.name} logo`} style={{ maxWidth: '200px', marginTop: '1rem' }} />
						)}
					</>
				)}
			</Drawer>

    </div>
  );
}