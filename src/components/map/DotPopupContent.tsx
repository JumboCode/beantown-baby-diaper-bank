// DotPopupContent.tsx
export type DotDatum = {
  cityId: string;
  cityName: string;
  lat: number;
  lng: number;
  numDiapers: number;
  partnerOrgs: string[];
};

export function DotPopupContent({
  cityName,
  numDiapers,
  partnerOrgs,
}: {
  cityName: string;
  numDiapers: number;
  partnerOrgs: string[];
}) {
  return (
    <div style={{ minWidth: 180 }}>
      <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: 4 }}>
        {cityName}
      </p>
      <p style={{ fontSize: "14px", margin: 0 }}>
        <strong>Diapers:</strong> {numDiapers.toLocaleString()}
      </p>
      <p style={{ fontSize: "14px", margin: 0 }}>
        <strong>Partners:</strong> {partnerOrgs.join(", ")}
      </p>
    </div>
  );
}
