"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ColumnMapping } from "./types";
import { PREDEFINED_FIELDS } from "./types";

interface DataPreviewProps {
  previewData: string[][];
  columnMappings: Record<string, ColumnMapping>;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export function DataPreview({ previewData, columnMappings, showPreview, onTogglePreview }: DataPreviewProps) {
  const getEffectiveFieldName = (header: string) => {
    const mapping = columnMappings[header];
    if (!mapping) return header;

    if (mapping.fieldId === "ignore") return "Ignored";
    if (mapping.fieldId === "custom") return mapping.customName || header;
    if (mapping.fieldId === "keep") return header;

    const field = PREDEFINED_FIELDS.find((f) => f.id === mapping.fieldId);
    return field ? field.label : header;
  };

  if (!previewData[0]) return null;

  return (
    <div>
      <Button variant="outline" onClick={onTogglePreview} className="w-full">
        {showPreview ? "Hide Preview" : "Show Preview"}
      </Button>

      {showPreview && (
        <div className="mt-4 space-y-2">
          <h3 className="font-medium">Preview</h3>
          <p className="text-sm text-muted-foreground">
            First 5 rows of your data with current mappings
          </p>

          <div className="border rounded-md">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-sm min-w-full table-auto">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    {previewData[0].map((header, index) => {
                      const mapping = columnMappings[header];
                      const isIgnored = mapping?.fieldId === "ignore";
                      const isCustom = mapping?.fieldId === "custom";
                      const isKeep = mapping?.fieldId === "keep";

                      return (
                        <th
                          key={index}
                          scope="col"
                          className={`px-4 py-2 text-left font-medium whitespace-nowrap ${
                            isIgnored ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {header}
                            {isIgnored && <X className="h-3 w-3 text-red-500" aria-hidden="true" />}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              isIgnored
                                ? "text-muted-foreground"
                                : isCustom
                                  ? "text-blue-500"
                                  : isKeep
                                    ? "text-green-500"
                                    : "text-primary"
                            }`}
                          >
                            {isIgnored ? "Excluded" : <>↓ {getEffectiveFieldName(header)}</>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.slice(1, 6).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => {
                        const header = previewData[0][cellIndex];
                        const mapping = columnMappings[header];
                        const isIgnored = mapping?.fieldId === "ignore";

                        return (
                          <td
                            key={cellIndex}
                            className={`px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis ${
                              isIgnored ? "text-muted-foreground line-through" : ""
                            }`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
