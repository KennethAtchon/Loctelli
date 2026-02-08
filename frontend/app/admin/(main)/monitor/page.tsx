"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  RefreshCw,
  Database,
  Shield,
  Server,
  Key,
  Clock,
} from "lucide-react";

const MONITOR_STALE_MS = 30 * 1000; // 30s

function formatTime(ms: number) {
  return new Date(ms).toISOString();
}

function formatTimeAgo(ms: number) {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

export default function AdminMonitorPage() {
  const {
    data: stats,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["monitor", "stats"],
    queryFn: () => api.adminAuth.getMonitorStats(),
    staleTime: MONITOR_STALE_MS,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading monitor stats…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Monitor</h1>
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load monitor stats."}
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sys = stats.system;
  const db = stats.database;
  const dbError = "_error" in db && db._error;
  const dbCounts = dbError
    ? {}
    : {
        users: db.users,
        admins: db.admins,
        subAccounts: db.subAccounts,
        strategies: db.strategies,
        leads: db.leads,
        bookings: db.bookings,
        formTemplates: db.formTemplates,
        formSubmissions: db.formSubmissions,
      };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7" />
            Monitor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Backend stats for debugging: rate limits, DB counts, system status.
            Updated{" "}
            {stats.timestamp
              ? formatTimeAgo(new Date(stats.timestamp).getTime())
              : "—"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate limits</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  System status
                </CardTitle>
                <CardDescription>Services used by the backend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge
                    variant={
                      sys.database === "Healthy" ? "default" : "destructive"
                    }
                  >
                    {sys.database}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API server</span>
                  <Badge
                    variant={
                      sys.apiServer === "Online" ? "default" : "secondary"
                    }
                  >
                    {sys.apiServer}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Redis cache</span>
                  <Badge
                    variant={
                      sys.redisCache === "Connected" ? "default" : "destructive"
                    }
                  >
                    {sys.redisCache}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File storage</span>
                  <Badge variant="secondary">{sys.fileStorage}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database counts
                </CardTitle>
                <CardDescription>Row counts for main tables</CardDescription>
              </CardHeader>
              <CardContent>
                {dbError ? (
                  <p className="text-sm text-destructive">{db._error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(dbCounts).map(([name, count]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono">
                          {Number(count).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rate limit summary
              </CardTitle>
              <CardDescription>
                {stats.rateLimits.length} active rate-limit key(s) in Redis (per
                IP / per key)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.rateLimits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rate limit keys found.
                </p>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Top usage:{" "}
                  {stats.rateLimits.slice(0, 3).map((r) => (
                    <span key={r.key} className="font-mono mr-2">
                      {r.type}:{r.count} ({r.ipOrId})
                    </span>
                  ))}
                  — open the &quot;Rate limits&quot; tab for the full table.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                Rate limit keys (IP / key)
              </CardTitle>
              <CardDescription>
                Current usage per key. Keys are scoped by IP and endpoint type
                (login, register, form submit, etc.). Window is 15 minutes for
                auth, 1 min for track-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.rateLimits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rate limit keys in Redis.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>IP / Key</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead>Window start</TableHead>
                        <TableHead>Window end</TableHead>
                        <TableHead className="max-w-[200px] truncate">
                          Full key
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.rateLimits.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell>
                            <Badge variant="outline">{r.type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.ipOrId}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {r.count}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatTime(r.windowStart)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatTime(r.windowEnd)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs">
                            {r.key}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Table counts
              </CardTitle>
              <CardDescription>
                Approximate row counts for debugging. Not real-time write/read
                metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbError ? (
                <Alert variant="destructive">
                  <AlertDescription>{db._error}</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(dbCounts).map(([name, count]) => (
                        <TableRow key={name}>
                          <TableCell>{name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(count).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Snapshot time
              </CardTitle>
              <CardDescription>
                When this monitor data was generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">{stats.timestamp}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
