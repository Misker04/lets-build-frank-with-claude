import { useState } from "react";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";

// The subset of JSON Schema Frank's tools actually use (ADR-002: zod schemas,
// converted to JSON Schema for MCP discovery). Extend here as new tools need
// richer shapes.
export interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
}

export interface ToolInputSchema {
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface DynamicToolFormProps {
  schema: ToolInputSchema;
  submitting: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

export function DynamicToolForm({ schema, submitting, onSubmit }: DynamicToolFormProps) {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const fieldNames = Object.keys(properties);
  const [values, setValues] = useState<Record<string, unknown>>({});

  function setField(fieldName: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  }

  const actions = (
    <Button variant="primary" loading={submitting} onClick={() => onSubmit(values)}>
      Call tool
    </Button>
  );

  if (fieldNames.length === 0) {
    return (
      <Form actions={actions}>
        <Box color="text-body-secondary">This tool takes no input.</Box>
      </Form>
    );
  }

  return (
    <Form actions={actions}>
      <SpaceBetween size="m">
        {fieldNames.map((fieldName) => {
          const field = properties[fieldName];
          const label = required.has(fieldName) ? `${fieldName} *` : fieldName;

          if (field.enum) {
            const current = values[fieldName];
            return (
              <FormField key={fieldName} label={label} description={field.description}>
                <Select
                  selectedOption={
                    current !== undefined ? { value: String(current), label: String(current) } : null
                  }
                  onChange={({ detail }) => setField(fieldName, detail.selectedOption.value)}
                  options={field.enum.map((option) => ({ value: option, label: option }))}
                  placeholder="Choose an option"
                />
              </FormField>
            );
          }

          if (field.type === "boolean") {
            return (
              <FormField key={fieldName} label={label} description={field.description}>
                <Checkbox
                  checked={Boolean(values[fieldName])}
                  onChange={({ detail }) => setField(fieldName, detail.checked)}
                />
              </FormField>
            );
          }

          if (field.type === "number" || field.type === "integer") {
            const current = values[fieldName];
            return (
              <FormField key={fieldName} label={label} description={field.description}>
                <Input
                  type="number"
                  value={current !== undefined ? String(current) : ""}
                  onChange={({ detail }) =>
                    setField(fieldName, detail.value === "" ? undefined : Number(detail.value))
                  }
                />
              </FormField>
            );
          }

          const current = values[fieldName];
          return (
            <FormField key={fieldName} label={label} description={field.description}>
              <Input
                value={current !== undefined ? String(current) : ""}
                onChange={({ detail }) => setField(fieldName, detail.value)}
              />
            </FormField>
          );
        })}
      </SpaceBetween>
    </Form>
  );
}
