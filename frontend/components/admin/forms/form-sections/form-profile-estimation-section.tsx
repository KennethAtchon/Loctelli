"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileEstimationSetup } from "../profile-estimation/setup-wizard";
import type { FormField } from "@/lib/forms/types";

interface FormProfileEstimationSectionProps {
  fields: FormField[];
}

/**
 * Profile Estimation section. Must be rendered inside the parent form's FormProvider
 * so that ProfileEstimationSetup can use useFormContext to read/write profileEstimation.
 */
export function FormProfileEstimationSection({
  fields,
}: FormProfileEstimationSectionProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeader>
          <CardTitle>Profile Estimation</CardTitle>
          <CardDescription>
            Configure personalized results based on user answers. Hover over the
            info icons (?) for guidance on each part.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEstimationSetup fields={fields} />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
