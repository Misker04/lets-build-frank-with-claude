import { useEffect, useState } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import { callTool, listTools } from "../api/mcpClient";
import { DynamicToolForm, type ToolInputSchema } from "../components/DynamicToolForm";

export function Tools() {
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Tool | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await listTools();
        if (!cancelled) setTools(fetched);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTool(tool: Tool) {
    setSelected(tool);
    setResult(null);
    setCallError(null);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    if (!selected) return;
    setSubmitting(true);
    setResult(null);
    setCallError(null);
    try {
      const callResult = await callTool(selected.name, values);
      if (callResult.isError) {
        setCallError("Frank reported an error running this tool.");
      }
      setResult(callResult.structuredContent ?? callResult.content);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Tools</Header>

      {loadError && (
        <Alert type="error" header="Could not list tools">
          {loadError}
        </Alert>
      )}

      <Table
        columnDefinitions={[
          { id: "name", header: "Name", cell: (tool) => tool.name },
          { id: "description", header: "Description", cell: (tool) => tool.description },
        ]}
        items={tools ?? []}
        loading={tools === null && !loadError}
        loadingText="Loading tools…"
        selectionType="single"
        selectedItems={selected ? [selected] : []}
        onSelectionChange={({ detail }) => selectTool(detail.selectedItems[0])}
        empty={<Box textAlign="center">No tools available.</Box>}
        header={<Header counter={tools ? `(${tools.length})` : undefined}>Available tools</Header>}
      />

      {selected && (
        <Container header={<Header variant="h2">{selected.name}</Header>}>
          <SpaceBetween size="m">
            <Box color="text-body-secondary">{selected.description}</Box>
            <DynamicToolForm
              schema={(selected.inputSchema ?? {}) as ToolInputSchema}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
            {callError && (
              <Alert type="error" header="Tool call failed">
                {callError}
              </Alert>
            )}
            {result !== null && (
              <SpaceBetween size="xs">
                <StatusIndicator type="success">Result</StatusIndicator>
                <Box variant="code" padding="s">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </Box>
              </SpaceBetween>
            )}
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}
