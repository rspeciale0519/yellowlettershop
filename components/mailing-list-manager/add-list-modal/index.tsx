'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTags } from '@/hooks/use-tags';
import { FileUploadArea } from './file-upload-area';
import { ColumnMappingSection } from './column-mapping';
import { DataPreview } from './data-preview';
import { ManualEntry } from './manual-entry';
import { TagSelector } from './tag-selector';
import {
  validateFile,
  autoMatchColumns,
  generateMockPreviewData,
} from './utils';
import type { AddListModalProps, ColumnMapping, ManualRecord } from './types';

export function AddListModal({
  open,
  onOpenChange,
  onSuccess,
}: AddListModalProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [listName, setListName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnMappings, setColumnMappings] = useState<
    Record<string, ColumnMapping>
  >({});
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [manualRecords, setManualRecords] = useState<ManualRecord[]>([
    {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customFieldNames, setCustomFieldNames] = useState<
    Record<string, string>
  >({});

  const { tags } = useTags();

  const resetForm = () => {
    setListName('');
    setSelectedTags([]);
    setFile(null);
    setColumnMappings({});
    setPreviewData([]);
    setManualRecords([
      {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
      },
    ]);
    setActiveTab('upload');
    setShowPreview(false);
    setCustomFieldNames({});
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      alert(validationError);
      return;
    }

    setFile(selectedFile);

    // Generate mock preview data and auto-match columns
    const mockPreviewData = generateMockPreviewData();
    const initialMappings = autoMatchColumns(mockPreviewData[0]);

    setColumnMappings(initialMappings);
    setPreviewData(mockPreviewData);
  };

  const handleFileRemove = () => {
    setFile(null);
    setColumnMappings({});
    setPreviewData([]);
    setCustomFieldNames({});
  };

  const handleAddManualRecord = () => {
    setManualRecords([
      ...manualRecords,
      {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
      },
    ]);
  };

  const handleRemoveManualRecord = (index: number) => {
    setManualRecords(manualRecords.filter((_, i) => i !== index));
  };

  const handleManualRecordChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedRecords = [...manualRecords];
    updatedRecords[index] = { ...updatedRecords[index], [field]: value };
    setManualRecords(updatedRecords);
  };

  const handleCustomFieldNameChange = (header: string, value: string) => {
    setCustomFieldNames((prev) => ({ ...prev, [header]: value }));

    // Update the column mapping to reflect the new custom name
    setColumnMappings((prev) => ({
      ...prev,
      [header]: {
        ...prev[header],
        customName: value,
      },
    }));
  };

  const handleFieldTypeChange = (header: string, fieldId: string) => {
    setColumnMappings((prev) => {
      const newMapping = {
        ...prev[header],
        fieldId,
        // Set appropriate customName based on fieldId
        customName:
          fieldId === 'custom'
            ? customFieldNames[header] || header
            : fieldId === 'keep'
            ? header
            : undefined,
      };

      return { ...prev, [header]: newMapping };
    });

    // Initialize custom field name if switching to custom
    if (fieldId === 'custom' && !customFieldNames[header]) {
      setCustomFieldNames((prev) => ({ ...prev, [header]: header }));
    }
  };

  const handleTagAdd = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter((id) => id !== tagId));
  };

  const handleSubmit = async () => {
    if (!listName.trim()) {
      alert('Please enter a list name');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a mock list object
      const newList = {
        id: `new-${Date.now()}`,
        name: listName,
        recordCount: activeTab === 'upload' ? 5000 : manualRecords.length,
        createdAt: new Date().toISOString(),
        tags: tags?.filter((tag) => selectedTags.includes(tag.id)) || [],
        campaigns: [],
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess(newList);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden'>
        <DialogHeader>
          <DialogTitle>Add New Mailing List</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='listName'>List Name</Label>
              <Input
                id='listName'
                placeholder='Enter list name'
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className='col-span-3'
                data-testid='list-name-input'
              />
            </div>

            <div>
              <Label>Tags (Optional)</Label>
              <TagSelector
                tags={tags}
                selectedTags={selectedTags}
                onTagAdd={handleTagAdd}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false) }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Add List"}
          </Button>
        </DialogFooter>
              <TabsTrigger value='manual'>Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value='upload' className='space-y-4 pt-4'>
              <FileUploadArea
                file={file}
                isDragging={isDragging}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />

              {file && (
                <div className='space-y-4'>
                  <ColumnMappingSection
                    previewData={previewData}
                    columnMappings={columnMappings}
                    customFieldNames={customFieldNames}
                    onFieldTypeChange={handleFieldTypeChange}
                    onCustomFieldNameChange={handleCustomFieldNameChange}
                  />

                  <DataPreview
                    previewData={previewData}
                    columnMappings={columnMappings}
                    showPreview={showPreview}
                    onTogglePreview={() => setShowPreview(!showPreview)}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value='manual'>
              <ManualEntry
                manualRecords={manualRecords}
                onAddRecord={handleAddManualRecord}
                onRemoveRecord={handleRemoveManualRecord}
                onRecordChange={handleManualRecordChange}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Add List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
