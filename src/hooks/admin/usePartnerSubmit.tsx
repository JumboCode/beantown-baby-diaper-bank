import { useRef, useState } from "react";
import { modals } from "@mantine/modals";
import { Mark, Text } from "@mantine/core";
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
  endTime?: Date | null;
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
  partnerId,
}: {
  cityEntries: CityPercentage[];
  onSuccess: () => void;
  onFieldError: (field: string, message: string) => void;
  partnerId?: number;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warning, setWarning] = useState("");
  const pendingValuesRef = useRef<PartnerFormValues | null>(null);

  const isEdit = partnerId !== undefined;

  async function doSubmit(values: PartnerFormValues) {
    const cityPercentages = cityEntries.map((e) => ({
      city: e.city,
      percentage: Number((e.percent / 100).toFixed(4)),
    }));

    const partnerPayload = {
      ...(isEdit && { id: partnerId }),
      name: values.organization,
      description: values.description,
      start_partner: values.status !== "waitlisted" ? values.time : null,
      end_partner: values.status === "inactive" ? (values.endTime ?? null) : null,
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

      if (isEdit && values.status !== "waitlisted") {
        const percentagesRes = await fetch("/api/partners/percentages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnerId: String(partnerId),
            percentages: cityPercentages,
          }),
        });

        if (!percentagesRes.ok) {
          const err = await percentagesRes.json().catch(() => ({}));
          setWarning(err.error || "Unable to update partner percentages.");
          return;
        }
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
      // In edit mode, city entries are only required if the user has made changes.
      // If no entries were touched, we skip validation and let the server keep existing data.
      const citiesChanged = cityEntries.length > 0;
      if (!isEdit && !citiesChanged) {
        setWarning("Please add at least one city.");
        setIsSubmitting(false);
        return;
      }
      if (citiesChanged) {
        const total = cityEntries.reduce((sum, e) => sum + e.percent, 0);
        if (Math.abs(total - 100) > 0.01) {
          setWarning(`City percentages must add up to 100% (currently ${total.toFixed(0)}%)`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const json = await res.json();
        const names: string[] = (json.data ?? [])
          .map((p: { name?: string | null; id?: number }) => p.name)
          .filter((n: unknown): n is string => typeof n === "string");

        // In edit mode, exclude the partner's own current name from the similarity check
        const checkNames = isEdit
          ? names.filter((_, i) => (json.data ?? [])[i]?.id !== partnerId)
          : names;

        const match = findSimilarPartnerName(values.organization, checkNames);
        if (match) {
          pendingValuesRef.current = values;
          setIsSubmitting(false);
          modals.openConfirmModal({
            title: "Possible duplicate partner!",
            centered: true,
            size: "lg",
            children: (
              <Text size="sm">
                A partner named &quot;<Mark fw={800}>{match}</Mark>&quot; already exists with a
                similar name. Double-check this is a new organization before continuing.
              </Text>
            ),
            labels: { confirm: "Submit Anyway", cancel: "Go Back" },
            cancelProps: { variant: "outline", radius: "md" },
            onConfirm: async () => {
              const pending = pendingValuesRef.current;
              if (!pending) return;
              pendingValuesRef.current = null;
              setIsSubmitting(true);
              await doSubmit(pending);
            },
            onCancel: () => {
              pendingValuesRef.current = null;
            },
          });
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

  return { submit, isSubmitting, warning };
}
