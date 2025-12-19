"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import logger from "@/lib/logger";

interface DatabaseSchemaProps {
  className?: string;
}

export default function DatabaseSchema({ className }: DatabaseSchemaProps) {
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    initializeMermaid();
    generateSchema();
    // generateSchema is stable, but if you ever memoize it, add as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMermaid = () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      er: {
        diagramPadding: 20,
        layoutDirection: "TB",
        minEntityWidth: 100,
        minEntityHeight: 75,
        entityPadding: 15,
        stroke: "gray",
        fill: "honeydew",
        fontSize: 12,
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
    });
  };

  const generateSchema = async (): Promise<void> => {
    logger.info("generateSchema called");

    try {
      setIsLoading(true);
      setError(null);

      // Fetch schema from backend API
      const response = await api.general.getDatabaseSchema();

      // Debug: Log the response structure
      logger.info("Schema API response:", response);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch schema");
      }

      // Convert schema to Mermaid ERD
      logger.info("Converting schema data:", response.data);
      const erdCode = convertSchemaToMermaid(response.data);
      logger.info("Generated ERD code:", erdCode);
      setMermaidCode(erdCode);

      // Render the diagram
      await renderDiagram(erdCode);
    } catch (err) {
      logger.error("Failed to generate database schema:", err);
      setError("Backend server unavailable. Using fallback schema.");

      // Fallback to hardcoded schema if API fails
      const fallbackCode = generateFallbackERD();
      setMermaidCode(fallbackCode);
      await renderDiagram(fallbackCode);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackERD = (): string => {
    return `erDiagram
    AdminUser {
        int id
        string name
        string email
        string password
        string role
        boolean isActive
        json permissions
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }
    User {
        int id
        string name
        string email
        string password
        string role
        boolean isActive
        string company
        string budget
        json bookingsTime
        int bookingEnabled
        string calendarId
        string locationId
        string assignedUserId
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
        int createdByAdminId "FK -> AdminUser"
    }
    Strategy {
        int id
        int userId "FK -> User"
        string name
        string tag
        string tone
        string aiInstructions
        string objectionHandling
        string qualificationPriority
        string aiObjective
        string disqualificationCriteria
        json exampleConversation
        int delayMin
        int delayMax
        datetime createdAt
        datetime updatedAt
    }
    Lead {
        int id
        int userId "FK -> User"
        int strategyId "FK -> Strategy"
        string name
        string email
        string phone
        string company
        string position
        string customId
        json messageHistory
        string status
        string notes
        string lastMessage
        string lastMessageDate
    }
    Booking {
        int id
        int userId "FK -> User"
        int leadId "FK -> Lead"
        string bookingType
        json details
        string status
        datetime createdAt
        datetime updatedAt
    }`;
  };

  interface SchemaModelField {
    name: string;
    type: string;
    isRequired: boolean;
    isId: boolean;
    isUnique: boolean;
    isRelation: boolean;
    relationType?: string;
    relationTarget?: string;
  }

  interface SchemaModel {
    name: string;
    fields: SchemaModelField[];
  }

  interface Schema {
    models: SchemaModel[];
  }

  const convertSchemaToMermaid = (schema: Schema) => {
    let mermaid = "erDiagram\n";

    // Add entities with all fields including foreign keys
    for (const model of schema.models) {
      mermaid += `    ${model.name} {\n`;

      for (const field of model.fields) {
        const type = getMermaidType(field.type);
        // Add FK indicator for foreign key fields
        if (field.isRelation) {
          mermaid += `        ${type} ${field.name} "FK -> ${field.relationTarget}"\n`;
        } else {
          mermaid += `        ${type} ${field.name}\n`;
        }
      }

      mermaid += "    }\n";
    }

    return mermaid;
  };

  const getMermaidType = (prismaType: string): string => {
    const typeMap: Record<string, string> = {
      Int: "int",
      String: "string",
      Boolean: "boolean",
      DateTime: "datetime",
      Json: "json",
      Float: "float",
      Decimal: "decimal",
      BigInt: "bigint",
      Bytes: "bytes",
    };

    return typeMap[prismaType] || "string";
  };

  const renderDiagram = async (code: string): Promise<void> => {
    if (!containerRef.current) {
      logger.error("Container ref is not available");
      setError("Failed to render diagram: Container not ready");
      return;
    }

    // Clear previous SVG
    containerRef.current.innerHTML = "";

    try {
      // Log the generated code for debugging
      logger.info("Generated Mermaid code:", code);

      // Validate Mermaid code before rendering
      logger.info("Validating Mermaid code...");
      mermaid.parse(code);
      logger.info("Mermaid code is valid, rendering...");

      const renderId = `database-schema-${++renderIdRef.current}`;
      const { svg } = await mermaid.render(renderId, code);
      logger.info("Mermaid rendered successfully, setting innerHTML");
      containerRef.current.innerHTML = svg;
      logger.info("Diagram rendered successfully");
    } catch (err) {
      logger.error("Failed to render Mermaid diagram:", err);
      logger.error("Generated code was:", code);
      setError(
        "Failed to render database diagram: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleRefresh = () => {
    logger.info("Refresh button clicked");
    setError(null);
    generateSchema();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleDownload = () => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "database-schema.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Database Schema</CardTitle>
            <CardDescription>
              Entity Relationship Diagram showing database structure and
              relationships
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logger.info("Button clicked directly");
                handleRefresh();
              }}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">{error}</p>
            <p className="text-xs text-yellow-700 mt-1">
              Use the refresh button to retry connecting to the backend.
            </p>
          </div>
        )}

        {isLoading && !error && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading schema...</span>
          </div>
        )}

        <div className={!isLoading && !error ? "block" : "hidden"}>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Foreign Key Legend:</strong> Fields marked with "FK {"->"}{" "}
              TableName" indicate relationships between tables.
            </p>
          </div>
          <div className="overflow-auto border rounded-lg bg-white">
            <div
              ref={containerRef}
              className="p-4"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                minHeight: "400px",
              }}
            />
          </div>
        </div>

        {mermaidCode && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              View Mermaid Code
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
              <code>{mermaidCode}</code>
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
