import { useEffect, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { callTool } from "../api/mcpClient";

interface Status {
  summary: string;
  version: string;
  uptimeSeconds: number;
  greeting: string;
}

type ConnectionState = "loading" | "success" | "error";

export function Overview() {
  const [state, setState] = useState<ConnectionState>("loading");
  const [status, setStatus] = useState<Status | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await callTool("get_status", {});
        if (cancelled) return;
        if (result.isError) {
          setState("error");
          setErrorMessage("Frank reported an error calling get_status.");
          return;
        }
        setStatus(result.structuredContent as unknown as Status);
        setState("success");
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Overview</Header>

      <Container header={<Header variant="h2">Connection</Header>}>
        {state === "loading" && <StatusIndicator type="loading">Connecting to Frank…</StatusIndicator>}
        {state === "success" && <StatusIndicator type="success">Connected</StatusIndicator>}
        {state === "error" && <StatusIndicator type="error">Not connected</StatusIndicator>}
        {state === "error" && errorMessage && (
          <Box padding={{ top: "s" }}>
            <Alert type="error" header="Could not reach Frank">
              {errorMessage}
            </Alert>
          </Box>
        )}
      </Container>

      {status && (
        <Container header={<Header variant="h2">Status</Header>}>
          <KeyValuePairs
            columns={2}
            items={[
              { label: "Summary", value: status.summary },
              { label: "Version", value: status.version },
              { label: "Uptime (s)", value: String(status.uptimeSeconds) },
              { label: "Greeting", value: status.greeting },
            ]}
          />
        </Container>
      )}
    </SpaceBetween>
  );
}
