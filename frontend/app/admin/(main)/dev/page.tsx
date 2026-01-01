"use client";

import { useState } from "react";
import { Play, Code, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DatabaseSchema from "@/components/admin/database-schema";
import SDKTables from "@/components/admin/sdk-tables";

export default function DevPage() {
  // Debug section state
  const [debugMethod, setDebugMethod] = useState("GET");
  const [debugUrl, setDebugUrl] = useState("");
  const [debugHeaders, setDebugHeaders] = useState(
    '{\n  "Content-Type": "application/json"\n}'
  );
  const [debugBody, setDebugBody] = useState("");
  const [debugResponse, setDebugResponse] = useState("");
  const [debugStatus, setDebugStatus] = useState<number | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugTime, setDebugTime] = useState<number | null>(null);

  const { toast } = useToast();

  // Debug section functions
  const executeApiCall = async () => {
    if (!debugUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    setDebugLoading(true);
    setDebugResponse("");
    setDebugStatus(null);
    setDebugTime(null);

    const startTime = Date.now();

    try {
      let headers: Record<string, string> = {};
      try {
        headers = JSON.parse(debugHeaders);
      } catch {
        toast({
          title: "Error",
          description: "Invalid JSON in headers",
          variant: "destructive",
        });
        return;
      }

      const options: RequestInit = {
        method: debugMethod,
        headers,
      };

      if (["POST", "PUT", "PATCH"].includes(debugMethod) && debugBody.trim()) {
        try {
          options.body = debugBody;
        } catch {
          toast({
            title: "Error",
            description: "Invalid request body",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch(debugUrl, options);
      const responseText = await response.text();

      const endTime = Date.now();
      setDebugTime(endTime - startTime);
      setDebugStatus(response.status);

      // Try to format JSON response
      try {
        const jsonResponse = JSON.parse(responseText);
        setDebugResponse(JSON.stringify(jsonResponse, null, 2));
      } catch {
        setDebugResponse(responseText);
      }
    } catch (error) {
      setDebugResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setDebugStatus(0);
    } finally {
      setDebugLoading(false);
    }
  };

  const copyResponse = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(debugResponse);
      toast({
        title: "Copied",
        description: "Response copied to clipboard",
      });
    }
  };

  const downloadResponse = () => {
    const blob = new Blob([debugResponse], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Development Tools
          </h1>
          <p className="text-gray-600">
            Database schema and development utilities.
          </p>
        </div>
      </div>

      {/* Database Schema */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Database Schema
        </h2>
        <DatabaseSchema />
      </div>

      {/* SDK Tables */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">SDK Tables</h2>
        <SDKTables />
      </div>

      {/* API Debug Console */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          API Debug Console
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Debug Console
            </CardTitle>
            <CardDescription>
              Test API calls to external services and view responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                {/* Method and URL */}
                <div className="flex gap-2">
                  <Select value={debugMethod} onValueChange={setDebugMethod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Enter URL (e.g., https://api.example.com/endpoint)"
                    value={debugUrl}
                    onChange={(e) => setDebugUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={executeApiCall}
                    disabled={debugLoading || !debugUrl.trim()}
                    className="px-6"
                  >
                    {debugLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Headers */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Headers (JSON)
                  </label>
                  <Textarea
                    placeholder="Enter headers as JSON"
                    value={debugHeaders}
                    onChange={(e) => setDebugHeaders(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Body */}
                {["POST", "PUT", "PATCH"].includes(debugMethod) && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Request Body
                    </label>
                    <Textarea
                      placeholder="Enter request body"
                      value={debugBody}
                      onChange={(e) => setDebugBody(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="response" className="space-y-4">
                {/* Response Status and Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {debugStatus !== null && (
                      <Badge
                        variant={
                          debugStatus >= 200 && debugStatus < 300
                            ? "default"
                            : "destructive"
                        }
                        className="text-sm"
                      >
                        Status: {debugStatus}
                      </Badge>
                    )}
                    {debugTime !== null && (
                      <span className="text-sm text-gray-600">
                        Time: {debugTime}ms
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyResponse}
                      disabled={!debugResponse}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadResponse}
                      disabled={!debugResponse}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Response Content */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Response
                  </label>
                  <Textarea
                    value={
                      debugResponse ||
                      "No response yet. Make a request to see the response here."
                    }
                    readOnly
                    rows={12}
                    className="font-mono text-sm bg-gray-50"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
