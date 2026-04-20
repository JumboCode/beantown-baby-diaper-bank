import { useRef, useState } from "react";
import { CityPercentage } from "@/components/admin/CityPercentagesForm";
import { findSimilarPartnerName } from "@/lib/util";

type AddressFields = {
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export const buildAddressString = ({ addressLine, city, state, zipCode, country }: AddressFields) =>
  [addressLine, city, state, zipCode, country].filter(Boolean).join(", ");

export type PartnerFormValues = {
  organization: string;
  description: string;
  time: Date | null;
  status: string;
  latitude: string;
  longitude: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logoFile: File | null;
  logoUrl: string;
  numBabies: number | "";
};

export function usePartnerSubmit({
  cityEntries,
  onSuccess,
  onFieldError,
}: {
  cityEntries: CityPercentage[];
  onSuccess: () => void;
  onFieldError: (field: string, message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warning, setWarning] = useState("");
  const [similarMatch, setSimilarMatch] = useState<string | null>(null);
  const pendingValuesRef = useRef<PartnerFormValues | null>(null);

  async function doSubmit(values: PartnerFormValues) {
    const cityPercentages = cityEntries.map((e) => ({
      city: e.city,
      percentage: Number((e.percent / 100).toFixed(4)),
    }));

    const partnerPayload = {
      name: values.organization,
      description: values.description,
      start_partner: values.time,
      status: values.status,
      coordinates: { lat: Number(values.latitude), lng: Number(values.longitude) },
      address: buildAddressString(values),
      logo: values.logoUrl || "",
      cities: cityPercentages,
      num_babies: values.numBabies !== "" ? Number(values.numBabies) : null,
    };

    try {
      const body = new FormData();
      body.append("partner", JSON.stringify(partnerPayload));
      body.append("logoAction", values.logoFile ? "replace" : "keep");
      if (values.logoFile) body.append("file", values.logoFile);

      const response = await fetch("/api/partners", { method: "POST", body });

      if (!response.ok) {
        const err = await response.json();
        const message = typeof err?.error === "string" ? err.error : "Unable to submit partner.";
        if (response.status === 422 || message === "Please check the entered cities.") {
          setWarning("Please check the entered cities.");
          return;
        }
        onFieldError("logoFile", message);
        setWarning(message);
        return;
      }

      setWarning("");
      onSuccess();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("partners:refresh"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit(values: PartnerFormValues) {
    setIsSubmitting(true);
    setWarning("");

    if (values.status !== "waitlisted") {
      if (cityEntries.length === 0) {
        setWarning("Please add at least one city.");
        setIsSubmitting(false);
        return;
      }
      const total = cityEntries.reduce((sum, e) => sum + e.percent, 0);
      if (Math.abs(total - 100) > 0.01) {
        setWarning(`City percentages must add up to 100% (currently ${total.toFixed(0)}%)`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const json = await res.json();
        const names: string[] = (json.data ?? [])
          .map((p: { name?: string | null }) => p.name)
          .filter((n: unknown): n is string => typeof n === "string");
        const match = findSimilarPartnerName(values.organization, names);
        if (match) {
          pendingValuesRef.current = values;
          setSimilarMatch(match);
          setIsSubmitting(false);
          return;
        }
      } else {
        console.error("Similar-name check: failed to fetch partners, proceeding without check");
      }
    } catch (err) {
      console.error("Similar-name check: fetch error, proceeding without check", err);
    }

    await doSubmit(values);
  }

  async function confirmAndSubmit() {
    if (!pendingValuesRef.current) return;
    const values = pendingValuesRef.current;
    pendingValuesRef.current = null;
    setSimilarMatch(null);
    setIsSubmitting(true);
    await doSubmit(values);
  }

  function clearSimilarMatch() {
    setSimilarMatch(null);
    pendingValuesRef.current = null;
  }

  return { submit, confirmAndSubmit, clearSimilarMatch, isSubmitting, warning, similarMatch };
}
