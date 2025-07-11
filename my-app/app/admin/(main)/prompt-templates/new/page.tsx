'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { CreatePromptTemplateDto } from '@/lib/api/endpoints/prompt-templates';

export default function NewPromptTemplatePage() {
  const [formData, setFormData] = useState<CreatePromptTemplateDto>({
    name: '',
    description: '',
    systemPrompt: '',
    role: 'conversational AI and sales representative',
    instructions: '',
    context: '',
    bookingInstruction: '',
    creativity: 7,
    temperature: 0.7,
    maxTokens: undefined,
    isActive: false,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (field: keyof CreatePromptTemplateDto, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and System Prompt are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Ensure all required fields are present and properly formatted
      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        systemPrompt: formData.systemPrompt.trim(),
        role: formData.role?.trim() || 'conversational AI and sales representative',
        instructions: formData.instructions?.trim() || undefined,
        context: formData.context?.trim() || undefined,
        bookingInstruction: formData.bookingInstruction?.trim() || undefined,
        creativity: formData.creativity || 7,
        temperature: formData.temperature || 0.7,
        maxTokens: formData.maxTokens || undefined,
        isActive: formData.isActive || false,
      };
      
      console.log('Creating prompt template with data:', submitData);
      const result = await api.promptTemplates.create(submitData);
      console.log('Template created successfully:', result);
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      router.push('/admin/prompt-templates');
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: 'Error',
        description: `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Prompt Template</h1>
          <p className="text-gray-600 mt-2">
            Create a new AI prompt template for your sales conversations
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Define the basic details of your prompt template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Aggressive Sales, Consultative Approach"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the purpose and style of this template"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="role">AI Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="e.g., conversational AI and sales representative"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>System Prompt *</CardTitle>
                <CardDescription>
                  The main prompt that defines the AI's behavior and personality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                  placeholder="You are a conversational AI and sales representative for the company. You are the leader, take control of the conversation..."
                  rows={8}
                  className="font-mono text-sm"
                  required
                />
              </CardContent>
            </Card>

            {/* Additional Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Instructions</CardTitle>
                <CardDescription>
                  Optional additional instructions for the AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="Specific instructions for how the AI should behave..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="context">Context</Label>
                  <Textarea
                    id="context"
                    value={formData.context}
                    onChange={(e) => handleInputChange('context', e.target.value)}
                    placeholder="Additional context information..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="bookingInstruction">Booking Instructions</Label>
                  <Textarea
                    id="bookingInstruction"
                    value={formData.bookingInstruction}
                    onChange={(e) => handleInputChange('bookingInstruction', e.target.value)}
                    placeholder="Instructions for handling booking requests..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>AI Parameters</CardTitle>
                <CardDescription>
                  Configure the AI's behavior settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="flex items-center justify-between">
                    Creativity: {formData.creativity}/10
                  </Label>
                  <Slider
                    value={[formData.creativity || 7]}
                    onValueChange={(value) => handleInputChange('creativity', value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between">
                    Temperature: {formData.temperature}
                  </Label>
                  <Slider
                    value={[formData.temperature || 0.7]}
                    onValueChange={(value) => handleInputChange('temperature', value[0])}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Tokens (Optional)</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.maxTokens || ''}
                    onChange={(e) => handleInputChange('maxTokens', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 1000"
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>
                  Configure template behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Set as Active</Label>
                    <p className="text-sm text-gray-500">
                      This template will be used as the default choice for new strategies
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>


              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      'Creating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Template
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
} 