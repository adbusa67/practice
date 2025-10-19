"use client";

import { Button } from "@event-ease/ui";

export type RegistrationFilterType = "all" | "registered" | "not-registered";

interface RegistrationFilterProps {
  value: RegistrationFilterType;
  onChange: (value: RegistrationFilterType) => void;
}

export function RegistrationFilter({ value, onChange }: RegistrationFilterProps) {
  const filterOptions: Array<{ value: RegistrationFilterType; label: string }> = [
    { value: "all", label: "All Events" },
    { value: "registered", label: "Registered" },
    { value: "not-registered", label: "Not Registered" },
  ];

  return (
    <div className="flex gap-2">
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "primary" : "secondary"}
          onClick={() => onChange(option.value)}
          className="text-sm"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
