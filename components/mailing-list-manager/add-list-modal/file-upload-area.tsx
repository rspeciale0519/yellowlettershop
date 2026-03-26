"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadAreaProps {
  file: File | null;
  isDragging: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function FileUploadArea({
  file,
  isDragging,
  onFileSelect,
  onFileRemove,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (file) {
    return (
      <div
        className="flex items-center justify-between bg-muted p-3 rounded-md"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{file.name}</span>
          <Badge variant="outline">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onFileRemove}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-[#F6CF62] bg-[#F6CF62]/10" : "border-muted-foreground/20"
      } cursor-pointer hover:border-[#F6CF62] hover:bg-[#F6CF62]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6CF62]`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDragLeave={() => { onDragLeave(); }}
      onDrop={(e) => { e.preventDefault(); onDrop?.(e); }}
      onClick={triggerFileInput}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerFileInput();
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.xls,.xlsx"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <Upload className="h-10 w-10 text-muted-foreground" />
        <h3 className="font-medium text-lg">Drag & Drop File</h3>
        <p className="text-sm text-muted-foreground mb-4">Supported formats: CSV, Excel (.xls, .xlsx)</p>
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            triggerFileInput();
          }}
        >
          Select File
        </Button>
      </div>
    </div>
  );
}
