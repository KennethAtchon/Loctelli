'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { CreateStrategyDto } from '@/types';
import type { UserProfile } from '@/lib/api/endpoints/admin-auth';
import type { PromptTemplate } from '@/lib/api/endpoints/prompt-templates';
import logger from '@/lib/logger';

export default function NewStrategyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [formData, setFormData] = useState<CreateStrategyDto>({
    userId: 0, // Will be set when user selects from dropdown
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
    promptTemplateId: undefined, // Will be set when template is selected
  });

  // Load users and prompt templates for the dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, templatesData] = await Promise.all([
          api.adminAuth.getAllUsers(),
          api.promptTemplates.getAll()
        ]);
        
        // Filter out admin users, only show regular users
        const regularUsers = usersData.filter(user => user.role !== 'admin');
        setUsers(regularUsers);
        setPromptTemplates(templatesData);
        
        // Set active prompt template as default selection if available
        if (templatesData.length > 0) {
          const activeTemplate = templatesData.find(t => t.isActive);
          const fallbackTemplate = activeTemplate || templatesData[0];
          setFormData(prev => ({ ...prev, promptTemplateId: fallbackTemplate.id }));
        }
      } catch (error) {
        logger.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || formData.userId === 0) {
      setError('Please select a user for this strategy');
      return;
    }
    
    if (!formData.promptTemplateId) {
      setError('Please select a prompt template for this strategy');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Please enter a strategy name');
      return;
    }
    
    if (!formData.aiInstructions?.trim()) {
      setError('Please enter AI instructions');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Creating strategy with data:', formData);
      await api.strategies.createStrategy(formData);
      router.push('/admin/strategies');
    } catch (error) {
      console.error('Strategy creation error:', error);
      if (error instanceof Error) {
        setError(`Failed to create strategy: ${error.message}`);
      } else {
        setError('Failed to create strategy. Please check your input and try again.');
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Strategy</h1>
          <p className="text-gray-600">Create a new AI conversation strategy</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Information</CardTitle>
          <CardDescription>
            Configure your AI conversation strategy. All fields marked with * are required.
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
                  <Label htmlFor="promptTemplateId">Prompt Template *</Label>
                  <p className="text-sm text-gray-500">
                    Choose any prompt template. The active template will be used if none is selected.
                  </p>
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
                          {template.name} {template.isActive && '(Active)'}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Strategy
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