"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileEstimationSetup } from "../profile-estimation/setup-wizard";
import type { FormField, ProfileEstimation } from "@/lib/api/endpoints/forms";

interface FormProfileEstimationSectionProps {
  value?: ProfileEstimation;
  fields: FormField[];
  onChange: (config: ProfileEstimation | undefined) => void;
}

export function FormProfileEstimationSection({
  value,
  fields,
  onChange,
}: FormProfileEstimationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Estimation</CardTitle>
        <CardDescription>
          Configure personalized results based on user answers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileEstimationSetup
          value={value}
          fields={fields}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
}
