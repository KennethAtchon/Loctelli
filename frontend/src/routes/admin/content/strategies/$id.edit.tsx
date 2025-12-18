import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Strategy, CreateStrategyDto } from "@/types";
import type { UserProfile } from "@/lib/api/endpoints/admin-auth";
import type { PromptTemplate } from "@/lib/api/endpoints/prompt-templates";
import logger from "@/lib/logger";

export const Route = createFileRoute('/admin/content/strategies/$id/edit')({
  component: EditStrategyPage,
});

function EditStrategyPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const strategyId = parseInt(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(true);
  const [error, setError] = useState("");
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [formData, setFormData] = useState<CreateStrategyDto>({
    regularUserId: 0,
    promptTemplateId: 0,
    name: "",
    description: "",
    tag: "",
    industryContext: "",
    aiName: "",
    aiRole: "",
    companyBackground: "",
    conversationTone: "",
    communicationStyle: "",
    qualificationQuestions: "",
    disqualificationRules: "",
    objectionHandling: "",
    closingStrategy: "",
    bookingInstructions: "",
    outputGuidelines: "",
    prohibitedBehaviors: "",
    metadata: undefined,
    delayMin: 30,
    delayMax: 120,
    isActive: true,
    subAccountId: 0,
  });

  // Load strategy data and users
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingStrategy(true);
        const [strategyData, usersData, templatesData] = await Promise.all([
          api.strategies.getStrategy(strategyId),
          api.adminAuth.getAllUsers(),
          api.promptTemplates.getAll(),
        ]);

        setStrategy(strategyData);
        // Filter out admin users, only show regular users
        const regularUsers = usersData.filter((user) => user.role !== "admin");
        setUsers(regularUsers);
        setPromptTemplates(templatesData);

        // Populate form with existing data
        setFormData({
          regularUserId: strategyData.regularUserId,
          promptTemplateId: strategyData.promptTemplateId,
          name: strategyData.name,
          description: strategyData.description || "",
          tag: strategyData.tag || "",
          industryContext: strategyData.industryContext || "",
          aiName: strategyData.aiName,
          aiRole: strategyData.aiRole,
          companyBackground: strategyData.companyBackground || "",
          conversationTone: strategyData.conversationTone,
          communicationStyle: strategyData.communicationStyle || "",
          qualificationQuestions: strategyData.qualificationQuestions,
          disqualificationRules: strategyData.disqualificationRules || "",
          objectionHandling: strategyData.objectionHandling,
          closingStrategy: strategyData.closingStrategy,
          bookingInstructions: strategyData.bookingInstructions || "",
          outputGuidelines: strategyData.outputGuidelines || "",
          prohibitedBehaviors: strategyData.prohibitedBehaviors || "",
          metadata: strategyData.metadata,
          delayMin: strategyData.delayMin || 30,
          delayMax: strategyData.delayMax || 120,
          isActive:
            strategyData.isActive !== undefined ? strategyData.isActive : true,
          subAccountId: strategyData.subAccountId,
        });
      } catch (error) {
        logger.error("Failed to load strategy data:", error);
        setError("Failed to load strategy data");
      } finally {
        setIsLoadingStrategy(false);
      }
    };

    if (strategyId) {
      loadData();
    }
  }, [strategyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.strategies.updateStrategy(strategyId, formData);
      navigate({ to: '/admin/content/strategies' });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update strategy"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "regularUserId" || name === "promptTemplateId"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  if (isLoadingStrategy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !strategy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/admin/content/strategies">
            <Button>Back to Strategies</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/content/strategies">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Strategies
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Strategy</h1>
          <p className="text-gray-600">Update strategy configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Information</CardTitle>
          <CardDescription>
            Update your AI conversation strategy. All fields marked with * are
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Core Identity Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Core Identity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="regularUserId">Assign to User *</Label>
                  <Select
                    value={formData.regularUserId?.toString() || ""}
                    onValueChange={(value) =>
                      handleSelectChange("regularUserId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promptTemplateId">Prompt Template *</Label>
                  <Select
                    value={formData.promptTemplateId?.toString() || ""}
                    onValueChange={(value) =>
                      handleSelectChange("promptTemplateId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prompt template" />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTemplates.map((template) => (
                        <SelectItem
                          key={template.id}
                          value={template.id.toString()}
                        >
                          {template.name} {template.isActive && "(Active)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Strategy Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Mike - Roofing Storm Damage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag">Tag</Label>
                  <Input
                    id="tag"
                    name="tag"
                    type="text"
                    value={formData.tag}
                    onChange={handleInputChange}
                    placeholder="roofing"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this strategy"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industryContext">Industry Context</Label>
                <Input
                  id="industryContext"
                  name="industryContext"
                  type="text"
                  value={formData.industryContext}
                  onChange={handleInputChange}
                  placeholder="Roofing - Storm Damage"
                />
              </div>
            </div>

            {/* Persona Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Persona Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="aiName">AI Name *</Label>
                  <Input
                    id="aiName"
                    name="aiName"
                    type="text"
                    required
                    value={formData.aiName}
                    onChange={handleInputChange}
                    placeholder="Mike"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiRole">AI Role *</Label>
                <Textarea
                  id="aiRole"
                  name="aiRole"
                  required
                  value={formData.aiRole}
                  onChange={handleInputChange}
                  placeholder="Senior Roofing Consultant with 15 years experience..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyBackground">Company Background</Label>
                <Textarea
                  id="companyBackground"
                  name="companyBackground"
                  value={formData.companyBackground}
                  onChange={handleInputChange}
                  placeholder="15 years in business, GAF Master Elite, BBB A+..."
                  rows={3}
                />
              </div>
            </div>

            {/* Conversation Style Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Conversation Style
              </h3>

              <div className="space-y-2">
                <Label htmlFor="conversationTone">Conversation Tone *</Label>
                <Textarea
                  id="conversationTone"
                  name="conversationTone"
                  required
                  value={formData.conversationTone}
                  onChange={handleInputChange}
                  placeholder="Assertive, direct, urgency-focused. Use phrases like..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="communicationStyle">Communication Style</Label>
                <Textarea
                  id="communicationStyle"
                  name="communicationStyle"
                  value={formData.communicationStyle}
                  onChange={handleInputChange}
                  placeholder="Take control naturally, be empathetic but honest..."
                  rows={3}
                />
              </div>
            </div>

            {/* Qualification & Discovery Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Qualification & Discovery
              </h3>

              <div className="space-y-2">
                <Label htmlFor="qualificationQuestions">
                  Qualification Questions *
                </Label>
                <Textarea
                  id="qualificationQuestions"
                  name="qualificationQuestions"
                  required
                  value={formData.qualificationQuestions}
                  onChange={handleInputChange}
                  placeholder="1. What type of issue? 2. When noticed? 3. Budget?..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disqualificationRules">
                  Disqualification Rules
                </Label>
                <Textarea
                  id="disqualificationRules"
                  name="disqualificationRules"
                  value={formData.disqualificationRules}
                  onChange={handleInputChange}
                  placeholder="Budget under $10k: refer to specialists..."
                  rows={3}
                />
              </div>
            </div>

            {/* Objection Handling Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Objection Handling
              </h3>

              <div className="space-y-2">
                <Label htmlFor="objectionHandling">Objection Handling *</Label>
                <Textarea
                  id="objectionHandling"
                  name="objectionHandling"
                  required
                  value={formData.objectionHandling}
                  onChange={handleInputChange}
                  placeholder="PRICE: 'Here's the reality...' TIMING: '...'"
                  rows={4}
                />
              </div>
            </div>

            {/* Closing & Booking Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Closing & Booking
              </h3>

              <div className="space-y-2">
                <Label htmlFor="closingStrategy">Closing Strategy *</Label>
                <Textarea
                  id="closingStrategy"
                  name="closingStrategy"
                  required
                  value={formData.closingStrategy}
                  onChange={handleInputChange}
                  placeholder="Use assumptive close. After budget confirmed..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingInstructions">
                  Booking Instructions
                </Label>
                <Textarea
                  id="bookingInstructions"
                  name="bookingInstructions"
                  value={formData.bookingInstructions}
                  onChange={handleInputChange}
                  placeholder="Offer specific time slots, create urgency..."
                  rows={3}
                />
              </div>
            </div>

            {/* Output Rules Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Output Rules
              </h3>

              <div className="space-y-2">
                <Label htmlFor="outputGuidelines">Output Guidelines</Label>
                <Textarea
                  id="outputGuidelines"
                  name="outputGuidelines"
                  value={formData.outputGuidelines}
                  onChange={handleInputChange}
                  placeholder="Keep responses 2-4 sentences, always end with question..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prohibitedBehaviors">
                  Prohibited Behaviors
                </Label>
                <Textarea
                  id="prohibitedBehaviors"
                  name="prohibitedBehaviors"
                  value={formData.prohibitedBehaviors}
                  onChange={handleInputChange}
                  placeholder="Don't be pushy, don't badmouth competitors..."
                  rows={3}
                />
              </div>
            </div>

            {/* Behavioral Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Behavioral Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="delayMin">Min Delay (seconds)</Label>
                  <Input
                    id="delayMin"
                    name="delayMin"
                    type="number"
                    min="0"
                    value={formData.delayMin}
                    onChange={(e) =>
                      handleNumberChange("delayMin", e.target.value)
                    }
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delayMax">Max Delay (seconds)</Label>
                  <Input
                    id="delayMax"
                    name="delayMax"
                    type="number"
                    min="0"
                    value={formData.delayMax}
                    onChange={(e) =>
                      handleNumberChange("delayMax", e.target.value)
                    }
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Strategy
                  </>
                )}
              </Button>
              <Link to="/admin/content/strategies">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

