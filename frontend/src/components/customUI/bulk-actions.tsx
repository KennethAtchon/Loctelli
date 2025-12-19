"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Edit, Archive, RefreshCw } from "lucide-react";

interface BulkActionsProps<T> {
  items: T[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  onBulkDelete?: (items: T[]) => Promise<void>;
  onBulkUpdate?: (
    items: T[],
    field: string,
    value: string | number | boolean,
  ) => Promise<void>;
  onBulkArchive?: (items: T[]) => Promise<void>;
  updateFields?: Array<{
    value: string;
    label: string;
    type: "text" | "select";
  }>;
  selectOptions?: Array<{ value: string; label: string }>;
  isLoading?: boolean;
}

export function BulkActions<T extends { id: number | string }>({
  items,
  selectedItems,
  onSelectionChange,
  onBulkDelete,
  onBulkUpdate,
  onBulkArchive,
  updateFields = [],
  selectOptions = [],
}: BulkActionsProps<T>) {
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [selectedField, setSelectedField] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [error, setError] = useState("");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange([...items]);
    } else {
      onSelectionChange([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedItems.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedItems.length} item(s)?`,
      )
    ) {
      return;
    }

    try {
      setIsBulkActionLoading(true);
      setError("");
      await onBulkDelete(selectedItems);
      onSelectionChange([]);
    } catch {
      setError("Failed to delete items");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (
      !onBulkUpdate ||
      selectedItems.length === 0 ||
      !selectedField ||
      !selectedValue
    )
      return;

    try {
      setIsBulkActionLoading(true);
      setError("");
      await onBulkUpdate(selectedItems, selectedField, selectedValue);
      onSelectionChange([]);
      setSelectedField("");
      setSelectedValue("");
    } catch {
      setError("Failed to update items");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!onBulkArchive || selectedItems.length === 0) return;

    try {
      setIsBulkActionLoading(true);
      setError("");
      await onBulkArchive(selectedItems);
      onSelectionChange([]);
    } catch {
      setError("Failed to archive items");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  if (items.length === 0) return null;

  const isAllSelected =
    items.length > 0 && selectedItems.length === items.length;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">
              {selectedItems.length} of {items.length} selected
            </span>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            {/* Bulk Update */}
            {onBulkUpdate && updateFields.length > 0 && (
              <div className="flex items-center space-x-2">
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {updateFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedField && (
                  <>
                    {updateFields.find((f) => f.value === selectedField)
                      ?.type === "select" ? (
                      <Select
                        value={selectedValue}
                        onValueChange={setSelectedValue}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        type="text"
                        value={selectedValue}
                        onChange={(e) => setSelectedValue(e.target.value)}
                        placeholder="Enter value"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                      />
                    )}
                    <Button
                      size="sm"
                      onClick={handleBulkUpdate}
                      disabled={!selectedValue || isBulkActionLoading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Bulk Archive */}
            {onBulkArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={isBulkActionLoading}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}

            {/* Bulk Delete */}
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkActionLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}

            {isBulkActionLoading && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
