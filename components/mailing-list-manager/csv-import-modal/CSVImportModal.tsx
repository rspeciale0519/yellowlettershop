"use client";

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { ColumnMapping } from './ColumnMapping';
import { ImportProgress } from './ImportProgress';
import { ValidationResults } from './ValidationResults';
import { FormatHelp } from './FormatHelp';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  onImportComplete?: (recordCount: number) => void;
}

interface ImportResults {
  total: number;
  imported: number;
  failed: number;
  duplicates: number;
}

interface CSVRecord {
  mailing_list_id: string;
  [key: string]: any;
}

export function CSVImportModal({
  isOpen,
  onClose,
  listId,
  listName,
  onImportComplete,
}: CSVImportModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<
    'idle' | 'parsing' | 'importing' | 'complete' | 'error'
  >('idle')
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [deduplicationField, setDeduplicationField] = useState<
    'address' | 'name' | 'phone' | 'email'
  >('address')
  const [validateData, setValidateData] = useState(true)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (
        selectedFile.type !== 'text/csv' &&
        !selectedFile.name.endsWith('.csv')
      ) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
      setImportStatus('idle')
      setImportResults(null)
    }
  }

  const parseCSV = (text: string): CSVRecord[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    const records: CSVRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const record: CSVRecord = { mailing_list_id: listId };
      headers.forEach((header, index) => {
        const fieldMap: { [key: string]: string } = {
          first_name: 'first_name',
          firstname: 'first_name',
          last_name: 'last_name',
          lastname: 'last_name',
          email: 'email',
          phone: 'phone',
          address: 'address_line1',
          address1: 'address_line1',
          address2: 'address_line2',
          city: 'city',
          state: 'state',
          zip: 'zip_code',
          zipcode: 'zip_code',
          zip_code: 'zip_code',
          property_type: 'property_type',
          bedrooms: 'bedrooms',
          bathrooms: 'bathrooms',
          square_feet: 'square_feet',
          sqft: 'square_feet',
          year_built: 'year_built',
          estimated_value: 'estimated_value',
          value: 'estimated_value',
          loan_amount: 'loan_amount',
          loan_type: 'loan_type',
          interest_rate: 'interest_rate',
          age: 'age',
          income: 'income',
          marital_status: 'marital_status',
        }

        const mappedField = fieldMap[header] || header;
        if (values[index] !== undefined && values[index] !== '') {
          if (
            [
              'bedrooms',
              'bathrooms',
              'square_feet',
              'year_built',
              'age',
            ].includes(mappedField)
          ) {
            record[mappedField] = parseInt(values[index]) || null;
          } else if (
            [
              'estimated_value',
              'loan_amount',
              'interest_rate',
              'income',
            ].includes(mappedField)
          ) {
            record[mappedField] = parseFloat(values[index]) || null;
          } else {
            record[mappedField] = values[index];
          }
        }
      });

      if (Object.keys(record).length > 1) {
        records.push(record);
      }
    }

    return records;
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true);
    setImportStatus('parsing');
    setImportProgress(10);

    try {
      const text = await file.text();
      const records = parseCSV(text);

      if (records.length === 0) {
        throw new Error('No valid records found in CSV file');
      }

      setImportStatus('importing');
      setImportProgress(50);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/mailing-lists/csv-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          listId,
          records,
          deduplicationField: skipDuplicates ? deduplicationField : undefined,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || 'Failed to import records'}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      setImportProgress(100);
      setImportStatus('complete');

      setImportResults({
        total: records.length,
        imported: result.imported,
        failed: result.failed,
        duplicates: result.duplicates,
      });

      toast({
        title: 'Import complete',
        description: `Successfully imported ${result.imported} records.`,
      });

      if (onImportComplete) {
        onImportComplete(result.imported);
      }

      if (result.failed === 0) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      const errorMessage = error instanceof Error
        ? error.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : error.message
        : 'An error occurred during import.';

      toast({
        title: 'Import failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }

  const handleReset = () => {
    setFile(null);
    setImportStatus('idle');
    setImportResults(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import CSV to {listName}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import records to your mailing list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FileUpload
            fileInputRef={fileInputRef}
            file={file}
            onFileSelect={handleFileSelect}
            isImporting={isImporting}
          />

          <ColumnMapping
            skipDuplicates={skipDuplicates}
            onSkipDuplicatesChange={setSkipDuplicates}
            deduplicationField={deduplicationField}
            onDeduplicationFieldChange={setDeduplicationField}
            validateData={validateData}
            onValidateDataChange={setValidateData}
            isImporting={isImporting}
          />

          <ImportProgress importStatus={importStatus} importProgress={importProgress} />

          <ValidationResults importResults={importResults} importStatus={importStatus} />

          <FormatHelp />
        </div>

        <DialogFooter>
          {importStatus === 'complete' || importStatus === 'error' ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import Another
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isImporting}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}