'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Strategy, CreateStrategyDto } from '@/types';
import type { UserProfile } from '@/lib/api/endpoints/admin-auth';
import type { PromptTemplate } from '@/lib/api/endpoints/prompt-templates';
import logger from '@/lib/logger';

export default function EditStrategyPage() {
  const router = useRouter();
  const params = useParams();
  const strategyId = parseInt(params.id as string);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(true);
  const [error, setError] = useState('');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [formData, setFormData] = useState<CreateStrategyDto>({
    userId: 0,
    subAccountId: 1, // Default subaccount
    name: '',
    tag: '',
    tone: 'professional',
    aiInstructions: '',
    objectionHandling: '',
    qualificationPriority: 'high',
    creativity: 5,
    aiObjective: 'active',
    disqualificationCriteria: '',
    exampleConversation: '',
    delayMin: 30,
    delayMax: 120,
    promptTemplateId: 0,
  });

  // Load strategy data and users
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingStrategy(true);
        const [strategyData, usersData, templatesData] = await Promise.all([
          api.strategies.getStrategy(strategyId),
          api.adminAuth.getAllUsers(),
          api.promptTemplates.getAll()
        ]);
        
        setStrategy(strategyData);
        // Filter out admin users, only show regular users
        const regularUsers = usersData.filter(user => user.role !== 'admin');
        setUsers(regularUsers);
        setPromptTemplates(templatesData);
        
        // Populate form with existing data
        setFormData({
          userId: strategyData.userId,
          subAccountId: strategyData.subAccountId || 1,
          name: strategyData.name,
          tag: strategyData.tag || '',
          tone: strategyData.tone || 'professional',
          aiInstructions: strategyData.aiInstructions || '',
          objectionHandling: strategyData.objectionHandling || '',
          qualificationPriority: strategyData.qualificationPriority || 'high',
          creativity: strategyData.creativity || 5,
          aiObjective: strategyData.aiObjective || 'active',
          disqualificationCriteria: strategyData.disqualificationCriteria || '',
          exampleConversation: strategyData.exampleConversation || '',
          delayMin: strategyData.delayMin || 30,
          delayMax: strategyData.delayMax || 120,
          promptTemplateId: strategyData.promptTemplateId || 0,
        });
      } catch (error) {
        logger.error('Failed to load strategy data:', error);
        setError('Failed to load strategy data');
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
    setError('');

    try {
      await api.strategies.updateStrategy(strategyId, formData);
      router.push('/admin/strategies');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update strategy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'userId' || name === 'promptTemplateId' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value[0],
    }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
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
          <Link href="/admin/strategies">
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
        <Link href="/admin/strategies">
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
            Update your AI conversation strategy. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Assign to User *</Label>
                  <Select
                    value={formData.userId.toString()}
                    onValueChange={(value) => handleSelectChange('userId', value)}
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
                  <Label htmlFor="name">Strategy Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Sales Strategy 1"
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
                    placeholder="sales, support, onboarding"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => handleSelectChange('tone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiObjective">AI Objective</Label>
                  <Select
                    value={formData.aiObjective}
                    onValueChange={(value) => handleSelectChange('aiObjective', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="passive">Passive</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promptTemplateId">Prompt Template *</Label>
                  <Select
                    value={formData.promptTemplateId?.toString() || ''}
                    onValueChange={(value) => handleSelectChange('promptTemplateId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prompt template" />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-gray-500">
                              {template.isActive ? 'Active' : 'Inactive'} • {template.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {promptTemplates.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No prompt templates available. Please create one first.
                    </p>
                  )}
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qualificationPriority">Qualification Priority</Label>
                  <Select
                    value={formData.qualificationPriority}
                    onValueChange={(value) => handleSelectChange('qualificationPriority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creativity">Creativity Level: {formData.creativity || 5}</Label>
                  <Slider
                    value={[formData.creativity || 5]}
                    onValueChange={(value) => handleSliderChange('creativity', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delayMin">Min Delay (seconds)</Label>
                  <Input
                    id="delayMin"
                    name="delayMin"
                    type="number"
                    min="0"
                    value={formData.delayMin}
                    onChange={(e) => handleNumberChange('delayMin', e.target.value)}
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
                    onChange={(e) => handleNumberChange('delayMax', e.target.value)}
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* AI Instructions */}
            <div className="space-y-2">
              <Label htmlFor="aiInstructions">AI Instructions *</Label>
              <Textarea
                id="aiInstructions"
                name="aiInstructions"
                required
                value={formData.aiInstructions}
                onChange={handleInputChange}
                placeholder="Provide detailed instructions for the AI on how to handle conversations..."
                rows={4}
              />
            </div>

            {/* Objection Handling */}
            <div className="space-y-2">
              <Label htmlFor="objectionHandling">Objection Handling</Label>
              <Textarea
                id="objectionHandling"
                name="objectionHandling"
                value={formData.objectionHandling}
                onChange={handleInputChange}
                placeholder="How should the AI handle common objections..."
                rows={3}
              />
            </div>

            {/* Disqualification Criteria */}
            <div className="space-y-2">
              <Label htmlFor="disqualificationCriteria">Disqualification Criteria</Label>
              <Textarea
                id="disqualificationCriteria"
                name="disqualificationCriteria"
                value={formData.disqualificationCriteria}
                onChange={handleInputChange}
                placeholder="Criteria for disqualifying leads..."
                rows={3}
              />
            </div>

            {/* Example Conversation */}
            <div className="space-y-2">
              <Label htmlFor="exampleConversation">Example Conversation</Label>
              <Textarea
                id="exampleConversation"
                name="exampleConversation"
                value={formData.exampleConversation}
                onChange={handleInputChange}
                placeholder="Provide an example conversation to guide the AI..."
                rows={4}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
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
              <Link href="/admin/strategies">
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