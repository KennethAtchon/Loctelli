"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Target,
  Loader2,
  User,
  Building2,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  BookOpen,
  Shield,
  Clock,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Strategy } from "@/types";
import logger from "@/lib/logger";

export default function StrategyDetailsPage() {
  const router = useRouter();
  const params = useParams();

  // Early return if params are not available yet
  if (!params || !params.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  const strategyId = parseInt(params.id as string);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  // Load strategy data
  useEffect(() => {
    const loadStrategy = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const strategyData = await api.strategies.getStrategy(strategyId);
        setStrategy(strategyData);
      } catch (error) {
        logger.error("Failed to load strategy:", error);
        setError("Failed to load strategy");
      } finally {
        setIsLoading(false);
      }
    };

    if (strategyId && !isNaN(strategyId)) {
      loadStrategy();
    } else {
      setError("Invalid strategy ID");
      setIsLoading(false);
    }
  }, [strategyId]);

  const handleDelete = async () => {
    if (
      !strategy ||
      !confirm(
        "Are you sure you want to delete this strategy? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await api.strategies.deleteStrategy(strategy.id);
      router.push("/admin/strategies");
    } catch (error) {
      logger.error("Failed to delete strategy:", error);
      setError("Failed to delete strategy. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!strategy) return;

    try {
      // Navigate to create page with duplicate data in query params
      const duplicateData = {
        ...strategy,
        name: `${strategy.name} (Copy)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      // Store in sessionStorage for the create page to pick up
      sessionStorage.setItem(
        "duplicateStrategy",
        JSON.stringify(duplicateData)
      );
      router.push("/admin/strategies/new");
    } catch (error) {
      logger.error("Failed to duplicate strategy:", error);
      setError("Failed to duplicate strategy");
    }
  };

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/strategies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Strategies
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error || "Strategy not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Link href="/admin/strategies">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Strategies
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Strategy Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            View and manage strategy configuration
          </p>
        </div>

        <div className="flex gap-3 justify-start lg:justify-end">
          <Link href={`/admin/strategies/${strategy.id}/edit`}>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Strategy Overview - Core Identity */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {strategy.name}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                  {strategy.description || "No description provided"}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {strategy.tag && (
                <Badge variant="outline" className="text-sm capitalize">
                  {strategy.tag}
                </Badge>
              )}
              <Badge
                variant={strategy.isActive ? "default" : "secondary"}
                className="text-sm"
              >
                {strategy.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Industry Context
              </p>
              <p className="text-base text-gray-900 dark:text-gray-100">
                {strategy.industryContext || "Not specified"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Created
              </p>
              <p className="text-base text-gray-900 dark:text-gray-100">
                {formatDate(strategy.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persona Details */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            Persona Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              AI Name
            </p>
            <p className="text-gray-900 dark:text-gray-100 font-semibold text-xl">
              {strategy.aiName}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              AI Role
            </p>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {strategy.aiRole}
              </p>
            </div>
          </div>
          {strategy.companyBackground && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Company Background
                </p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {strategy.companyBackground}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Conversation Style */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            Conversation Style
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Conversation Tone
            </p>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {strategy.conversationTone}
              </p>
            </div>
          </div>
          {strategy.communicationStyle && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Communication Style
                </p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {strategy.communicationStyle}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Qualification & Discovery */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <HelpCircle className="h-5 w-5 text-blue-600" />
            </div>
            Qualification & Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Qualification Questions
            </p>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {strategy.qualificationQuestions}
              </p>
            </div>
          </div>
          {strategy.disqualificationRules && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Disqualification Rules
                </p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {strategy.disqualificationRules}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Objection Handling */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            Objection Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {strategy.objectionHandling}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Closing & Booking */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            Closing & Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Closing Strategy
            </p>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {strategy.closingStrategy}
              </p>
            </div>
          </div>
          {strategy.bookingInstructions && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Booking Instructions
                </p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {strategy.bookingInstructions}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Output Rules */}
      {(strategy.outputGuidelines || strategy.prohibitedBehaviors) && (
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              Output Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {strategy.outputGuidelines && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Output Guidelines
                </p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {strategy.outputGuidelines}
                  </p>
                </div>
              </div>
            )}
            {strategy.prohibitedBehaviors && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Prohibited Behaviors
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {strategy.prohibitedBehaviors}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Behavioral Settings & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavioral Settings */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              Behavioral Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Min Delay
                </p>
                <p className="text-gray-900 dark:text-gray-100 text-2xl font-bold">
                  {strategy.delayMin ?? 0}s
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Max Delay
                </p>
                <p className="text-gray-900 dark:text-gray-100 text-2xl font-bold">
                  {strategy.delayMax ?? 0}s
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Response Time Range
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-gray-900 dark:text-gray-100 text-sm">
                  AI will wait between{" "}
                  <span className="font-semibold">
                    {strategy.delayMin ?? 0}
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold">
                    {strategy.delayMax ?? 0}
                  </span>{" "}
                  seconds before responding
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Configuration */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100 text-lg font-semibold">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              Related Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                User ID
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-mono">
                {strategy.regularUserId}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                SubAccount ID
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-mono">
                {strategy.subAccountId}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Prompt Template ID
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-mono">
                {strategy.promptTemplateId}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Last Updated
              </p>
              <p className="text-gray-900 dark:text-gray-100">
                {formatDate(strategy.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
