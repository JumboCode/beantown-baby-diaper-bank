"use client";

import { useState } from "react";
import { Button, NumberInput } from "@mantine/core";
import { CollapsibleSection } from "./CollapsibleSection";

interface EditableDistributionRowProps {
  title: string;
  displayDiapers: number;
  onSave: (val: number) => Promise<void>;
  children?: React.ReactNode;
}

export function EditableDistributionRow({
  title,
  displayDiapers,
  onSave,
  children,
}: EditableDistributionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (typeof inputValue !== "number") return;
    setIsSaving(true);
    try {
      await onSave(inputValue);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const right = (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <NumberInput
            value={inputValue}
            onChange={(val) => setInputValue(val === "" ? "" : Number(val))}
            min={0}
            className="w-32"
            allowDecimal={false}
            allowNegative={false}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              }
              if (e.key === "Escape") {
                setIsEditing(false);
              }
            }}
          />
          <Button size="xs" loading={isSaving} onClick={() => void handleSave()}>
            Save
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium text-[var(--color-brand)]">
            {displayDiapers.toLocaleString()} diapers
          </span>
          <Button
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue(displayDiapers);
              setIsEditing(true);
            }}
          >
            Edit
          </Button>
        </>
      )}
    </div>
  );

  return (
    <CollapsibleSection title={title} right={right}>
      {children}
    </CollapsibleSection>
  );
}
