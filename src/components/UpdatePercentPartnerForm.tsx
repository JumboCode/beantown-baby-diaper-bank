import { Partner } from "./admin/PartnerTable";
import { PartnerRegion } from "@/generated/prisma/client";

export default function UpdatePercentPartnerForm({partners, percentages}: {partners: Partner[], percentages: PartnerRegion[]}) {
  
  const editPartnerPercentages = (partnerId: number, cityId: number, newPercentage: number) => {
    
  }

  return <div>
    {partners.map((partner) => {
      return <div>
          <h1>{partner.name}</h1>
          <span>{percentages.filter(percentage => Number(percentage.partnerId) == partner.id)
            .map((percentage, index, arr) => {
              if (percentage.percentage) {
                return <div className="inline">
                    <p>{percentage.cityId}</p>
                    <input placeholder={String(percentage.percentage)}></input>
                  </div>
              }
            })}</span>
        </div>
    })}
  </div>;
}
