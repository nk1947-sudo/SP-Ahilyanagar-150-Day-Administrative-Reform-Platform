import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X } from "lucide-react";
import type { CustomFieldDefinition } from "@shared/schema";

interface DynamicFieldRendererProps {
  section: string;
  entityType?: string;
  entityId?: number;
  onFieldChange: (fieldId: number, value: any) => void;
  values?: Record<number, any>;
  className?: string;
}

interface FileUploadState {
  file: File | null;
  uploading: boolean;
  url?: string;
}

export function DynamicFieldRenderer({ 
  section, 
  entityType, 
  entityId, 
  onFieldChange, 
  values = {},
  className = ""
}: DynamicFieldRendererProps) {
  const [fileStates, setFileStates] = useState<Record<number, FileUploadState>>({});

  // Fetch custom field definitions for this section
  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ["/api/custom-fields", section],
    queryFn: () => apiRequest("GET", `/api/custom-fields?section=${section}`).then(res => res.json()),
  });

  // Fetch existing custom field values if entityType and entityId are provided
  const { data: existingValues = [] } = useQuery({
    queryKey: ["/api/custom-field-values", entityType, entityId],
    queryFn: () => apiRequest("GET", `/api/custom-field-values?entityType=${entityType}&entityId=${entityId}`).then(res => res.json()),
    enabled: !!(entityType && entityId),
  });

  // Initialize values from existing data
  useEffect(() => {
    if (existingValues.length > 0) {
      existingValues.forEach((fieldValue: any) => {
        if (!values[fieldValue.fieldDefinitionId]) {
          onFieldChange(fieldValue.fieldDefinitionId, fieldValue.value);
        }
      });
    }
  }, [existingValues, values, onFieldChange]);

  const handleFileUpload = async (fieldId: number, file: File) => {
    setFileStates(prev => ({
      ...prev,
      [fieldId]: { file, uploading: true }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId.toString());

      const response = await fetch('/api/upload-field-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fileUrl = result.url;

      setFileStates(prev => ({
        ...prev,
        [fieldId]: { file, uploading: false, url: fileUrl }
      }));

      onFieldChange(fieldId, fileUrl);
    } catch (error) {
      console.error('File upload error:', error);
      setFileStates(prev => ({
        ...prev,
        [fieldId]: { file: null, uploading: false }
      }));
    }
  };

  const renderField = (field: CustomFieldDefinition) => {
    const fieldValue = values[field.id] || field.defaultValue || "";
    const validation = field.validation ? JSON.parse(field.validation) : {};
    const isRequired = field.isRequired;

    const commonProps = {
      id: `field-${field.id}`,
      required: isRequired,
      placeholder: field.placeholder || "",
    };

    switch (field.fieldType) {
      case "text":
        return (
          <Input
            {...commonProps}
            type="text"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            minLength={validation.minLength}
            maxLength={validation.maxLength}
            pattern={validation.pattern}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            minLength={validation.minLength}
            maxLength={validation.maxLength}
            rows={validation.rows || 4}
          />
        );

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, parseFloat(e.target.value) || 0)}
            min={validation.min}
            max={validation.max}
            step={validation.step || 1}
          />
        );

      case "email":
        return (
          <Input
            {...commonProps}
            type="email"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
          />
        );

      case "phone":
        return (
          <Input
            {...commonProps}
            type="tel"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            pattern={validation.pattern || "[0-9]{10}"}
          />
        );

      case "date":
        return (
          <Input
            {...commonProps}
            type="date"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            min={validation.minDate}
            max={validation.maxDate}
          />
        );

      case "url":
        return (
          <Input
            {...commonProps}
            type="url"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
          />
        );

      case "select":
        const selectOptions = validation.options || [];
        return (
          <Select value={fieldValue} onValueChange={(value) => onFieldChange(field.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option || `option-${index}`}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const multiValues = Array.isArray(fieldValue) ? fieldValue : [];
        const multiselectOptions = validation.options || [];
        return (
          <div className="space-y-2">
            {multiselectOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={multiValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...multiValues, option]
                      : multiValues.filter((v: string) => v !== option);
                    onFieldChange(field.id, newValues);
                  }}
                />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case "radio":
        const radioOptions = validation.options || [];
        return (
          <RadioGroup value={fieldValue} onValueChange={(value) => onFieldChange(field.id, value)}>
            {radioOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`field-${field.id}`}
              checked={!!fieldValue}
              onCheckedChange={(checked) => onFieldChange(field.id, checked)}
            />
            <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
          </div>
        );

      case "file":
        const fileState = fileStates[field.id];
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                id={`field-${field.id}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(field.id, file);
                  }
                }}
                accept={validation.accept}
                disabled={fileState?.uploading}
              />
              {fileState?.uploading && (
                <div className="text-sm text-muted-foreground">Uploading...</div>
              )}
            </div>
            
            {(fileState?.url || fieldValue) && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <File className="w-4 h-4" />
                <span className="text-sm">{fileState?.file?.name || "Uploaded file"}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFileStates(prev => ({ ...prev, [field.id]: { file: null, uploading: false } }));
                    onFieldChange(field.id, "");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={fieldValue}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (customFields.length === 0) {
    return null;
  }

  // Sort fields by display order
  const sortedFields = [...customFields]
    .filter((field: CustomFieldDefinition) => field.isActive)
    .sort((a: CustomFieldDefinition, b: CustomFieldDefinition) => a.displayOrder - b.displayOrder);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Custom Fields
            <Badge variant="outline">{section}</Badge>
          </CardTitle>
          <CardDescription>
            Additional fields specific to this section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedFields.map((field: CustomFieldDefinition) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`field-${field.id}`} className="flex items-center gap-2">
                {field.label}
                {field.isRequired && <span className="text-red-500">*</span>}
              </Label>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
              {renderField(field)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}