"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  date: string;
  slots: string[];
}

interface BookingsTimeEditorProps {
  value: TimeSlot[] | string | Record<string, string[]> | null | undefined;
  onChange: (value: TimeSlot[]) => void;
  className?: string;
}

export function BookingsTimeEditor({
  value,
  onChange,
  className,
}: BookingsTimeEditorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // Parse the value into our internal format
  useEffect(() => {
    if (!value) {
      setTimeSlots([]);
      return;
    }

    try {
      let parsedValue = value;
      if (typeof value === "string") {
        parsedValue = JSON.parse(value);
      }

      let slots: TimeSlot[] = [];

      if (Array.isArray(parsedValue)) {
        // Format 1: Array of date objects
        slots = parsedValue.filter((item) => item.date && item.slots);
      } else if (parsedValue && typeof parsedValue === "object") {
        // Format 2: Direct date keys
        slots = Object.entries(parsedValue)
          .filter(([, value]) => Array.isArray(value))
          .map(([date, times]) => ({
            date,
            slots: times as unknown as string[],
          }));

        // Format 3: Nested structures
        if (parsedValue.dates && Array.isArray(parsedValue.dates)) {
          slots = parsedValue.dates
            .filter(
              (item: unknown) =>
                typeof item === "object" &&
                item !== null &&
                "date" in item &&
                "slots" in item
            )
            .map((item: unknown) => item as TimeSlot);
        }
      }

      setTimeSlots(slots.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error("Error parsing bookingsTime:", error);
      setTimeSlots([]);
    }
  }, [value]);

  // Update the parent when our data changes
  const updateParent = (newSlots: TimeSlot[]) => {
    const formatted = newSlots.map((slot) => ({
      date: slot.date,
      slots: slot.slots.sort(),
    }));
    onChange(formatted);
  };

  const addDate = () => {
    if (!newDate) {
      toast.error("Please select a date");
      return;
    }

    if (timeSlots.some((slot) => slot.date === newDate)) {
      toast.error("Date already exists");
      return;
    }

    const newSlots = [...timeSlots, { date: newDate, slots: [] }];
    setTimeSlots(newSlots.sort((a, b) => a.date.localeCompare(b.date)));
    updateParent(newSlots);
    setNewDate("");
  };

  const removeDate = (dateToRemove: string) => {
    const newSlots = timeSlots.filter((slot) => slot.date !== dateToRemove);
    setTimeSlots(newSlots);
    updateParent(newSlots);
  };

  const addTimeSlot = (date: string) => {
    if (!newTime) {
      toast.error("Please enter a time");
      return;
    }

    // Validate time format
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      toast.error("Please enter time in HH:MM format");
      return;
    }

    const newSlots = timeSlots.map((slot) => {
      if (slot.date === date) {
        if (slot.slots.includes(newTime)) {
          toast.error("Time slot already exists");
          return slot;
        }
        return {
          ...slot,
          slots: [...slot.slots, newTime].sort(),
        };
      }
      return slot;
    });

    setTimeSlots(newSlots);
    updateParent(newSlots);
    setNewTime("");
  };

  const removeTimeSlot = (date: string, timeToRemove: string) => {
    const newSlots = timeSlots.map((slot) => {
      if (slot.date === date) {
        return {
          ...slot,
          slots: slot.slots.filter((time) => time !== timeToRemove),
        };
      }
      return slot;
    });

    setTimeSlots(newSlots);
    updateParent(newSlots);
  };

  const generateBusinessHours = (date: string) => {
    const businessSlots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      businessSlots.push(`${hour.toString().padStart(2, "0")}:00`);
      businessSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    const newSlots = timeSlots.map((slot) => {
      if (slot.date === date) {
        return {
          ...slot,
          slots: businessSlots,
        };
      }
      return slot;
    });

    setTimeSlots(newSlots);
    updateParent(newSlots);
    toast.success("Business hours (9 AM - 5 PM) generated");
  };

  const copyFromPrevious = (currentDate: string) => {
    const currentIndex = timeSlots.findIndex(
      (slot) => slot.date === currentDate
    );
    if (currentIndex <= 0) {
      toast.error("No previous date to copy from");
      return;
    }

    const previousSlots = timeSlots[currentIndex - 1].slots;
    const newSlots = timeSlots.map((slot) => {
      if (slot.date === currentDate) {
        return {
          ...slot,
          slots: [...previousSlots],
        };
      }
      return slot;
    });

    setTimeSlots(newSlots);
    updateParent(newSlots);
    toast.success("Copied from previous date");
  };

  const generateNextWeek = () => {
    const today = new Date();
    const nextWeek: TimeSlot[] = [];

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      if (!timeSlots.some((slot) => slot.date === dateStr)) {
        const businessSlots: string[] = [];
        for (let hour = 9; hour < 17; hour++) {
          businessSlots.push(`${hour.toString().padStart(2, "0")}:00`);
          businessSlots.push(`${hour.toString().padStart(2, "0")}:30`);
        }

        nextWeek.push({
          date: dateStr,
          slots: businessSlots,
        });
      }
    }

    if (nextWeek.length > 0) {
      const newSlots = [...timeSlots, ...nextWeek].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      setTimeSlots(newSlots);
      updateParent(newSlots);
      toast.success(`Generated availability for ${nextWeek.length} days`);
    } else {
      toast.info("Next week already has availability data");
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Availability
          </CardTitle>
          <CardDescription>
            Manage available time slots for booking appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateNextWeek}
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate Next Week
            </Button>
          </div>

          {/* Add New Date */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-date">Add Date</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder="Select date"
              />
            </div>
            <Button type="button" onClick={addDate} className="mt-6" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing Dates */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {timeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No availability set</p>
                <p className="text-sm">
                  Add dates and time slots to manage booking availability
                </p>
              </div>
            ) : (
              timeSlots.map((slot) => (
                <Card key={slot.date} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {new Date(slot.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFromPrevious(slot.date)}
                          title="Copy from previous date"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => generateBusinessHours(slot.date)}
                          title="Generate business hours"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDate(slot.date)}
                          className="text-red-600 hover:text-red-700"
                          title="Remove date"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Add Time Slot */}
                    <div className="flex gap-2 mb-3">
                      <Input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        placeholder="HH:MM"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => addTimeSlot(slot.date)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Time Slots */}
                    <div className="flex flex-wrap gap-2">
                      {slot.slots.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No time slots
                        </p>
                      ) : (
                        slot.slots.map((time) => (
                          <Badge
                            key={time}
                            variant="secondary"
                            className="flex items-center gap-1 cursor-pointer hover:bg-red-100"
                            onClick={() => removeTimeSlot(slot.date, time)}
                            title="Click to remove"
                          >
                            {time}
                            <Trash2 className="h-3 w-3" />
                          </Badge>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
