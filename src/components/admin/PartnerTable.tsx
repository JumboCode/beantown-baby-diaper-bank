"use client";

import { useState, useEffect } from 'react';
import { Table, TableData } from '@mantine/core';

type Partner = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  start_partner: string | null;
  waitlisted: boolean;
  address: string | null;
  coords: { lat: number; lng: number } | null;
  logo_url: string | null;
};

export default function PartnerInfo() {
  const [data, setData] = useState<Partner[]>([]);

  useEffect(() => {
    const fetchAndStoreData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/partners');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchAndStoreData();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[95%] mx-auto">
        <PartnerTable partners={data} />
      </div>
    </div>
  );
}

function PartnerTable({ partners }: { partners: Partner[] }) {
  const tableData: TableData = {
    head: ['Name', 'Description', 'Partner Since', 'Status', 'Coordinates', 'Address'],
    body: partners.map((partner) => [
      <div key={partner.id} className="flex items-center gap-3">
        {partner.logo_url && (
          <img
            src={partner.logo_url}
            alt={partner.name}
            className="h-10 w-10 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <span className="font-bold text-gray-900">{partner.name}</span>
        </div>,
        <div key={partner.id} className="text-sm text-gray-600 max-w-md">
          {partner.description || <span className="text-gray-400 italic">No description</span>}
        </div>,
        <span key={partner.id} className="text-sm text-gray-600">
          {partner.start_partner ? 
            new Date(partner.start_partner).toLocaleDateString() : 
            <span className="text-gray-400 italic">N/A</span>
          }
        </span>,
        partner.waitlisted ? (
          <span key={partner.id} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
            Waitlisted
          </span>
        ) : (
          <span key={partner.id} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        ),
        <span key={partner.id} className="text-xs text-gray-500">
          {partner.coords ? 
            `${partner.coords.lat.toFixed(4)}, ${partner.coords.lng.toFixed(4)}` : 
            <span className="text-gray-400 italic">N/A</span>
          }
        </span>,
        <span key={partner.id} className="text-sm text-gray-600">
          {partner.address || <span className="text-gray-400 italic">N/A</span>}
        </span>,
      ]
    )
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <Table data={tableData} highlightOnHover withTableBorder styles={{th:{color: '#667085', backgroundColor: '#F9FAFB'}}} />
      </div>
    </div>
  );
}