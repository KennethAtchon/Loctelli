"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormAdvancedSettingsCardProps {
  requiresWakeUp: boolean;
  wakeUpInterval: number;
  onRequiresWakeUpChange: (enabled: boolean) => void;
  onWakeUpIntervalChange: (interval: number) => void;
}

export function FormAdvancedSettingsCard({
  requiresWakeUp,
  wakeUpInterval,
  onRequiresWakeUpChange,
  onWakeUpIntervalChange,
}: FormAdvancedSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>Additional configuration options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={requiresWakeUp}
            onCheckedChange={onRequiresWakeUpChange}
          />
          <Label>Enable Database Wake-up</Label>
        </div>
        {requiresWakeUp && (
          <div>
            <Label htmlFor="wakeUpInterval">Wake-up Interval (seconds)</Label>
            <Input
              id="wakeUpInterval"
              type="number"
              min="10"
              value={wakeUpInterval}
              onChange={(e) => onWakeUpIntervalChange(parseInt(e.target.value))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
