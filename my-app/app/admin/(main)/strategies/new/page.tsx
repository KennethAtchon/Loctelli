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
import { ArrowLeft, Save, Loader2, Upload, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { CreateStrategyDto } from '@/types';
import type { UserProfile } from '@/lib/api/endpoints/admin-auth';
import type { PromptTemplate } from '@/lib/api/endpoints/prompt-templates';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';
import { useToast } from '@/hooks/use-toast';

export default function NewStrategyPage() {
  const router = useRouter();
  const { adminFilter } = useTenant();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [formData, setFormData] = useState<CreateStrategyDto>({
    userId: 0,
    promptTemplateId: 0,
    name: '',
    description: '',
    tag: '',
    industryContext: '',
    aiName: '',
    aiRole: '',
    companyBackground: '',
    conversationTone: '',
    communicationStyle: '',
    qualificationQuestions: '',
    disqualificationRules: '',
    objectionHandling: '',
    closingStrategy: '',
    bookingInstructions: '',
    outputGuidelines: '',
    prohibitedBehaviors: '',
    metadata: undefined,
    delayMin: 30,
    delayMax: 120,
    isActive: true,
    subAccountId: 0,
  });

  // Load users and prompt templates for the dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, templatesData] = await Promise.all([
          api.adminAuth.getAllUsers(adminFilter ?? undefined),
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
  }, [adminFilter]);

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

    if (!formData.aiName?.trim()) {
      setError('Please enter an AI name');
      return;
    }

    if (!formData.aiRole?.trim()) {
      setError('Please enter an AI role');
      return;
    }

    if (!formData.conversationTone?.trim()) {
      setError('Please enter a conversation tone');
      return;
    }

    if (!formData.qualificationQuestions?.trim()) {
      setError('Please enter qualification questions');
      return;
    }

    if (!formData.objectionHandling?.trim()) {
      setError('Please enter objection handling guidelines');
      return;
    }

    if (!formData.closingStrategy?.trim()) {
      setError('Please enter a closing strategy');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get the selected user to determine the subaccount
      const selectedUser = users.find(user => user.id === formData.userId);
      if (!selectedUser) {
        setError('Selected user not found');
        return;
      }

      // Create strategy with the user's subaccount
      await api.strategies.createStrategy({
        ...formData,
        subAccountId: selectedUser.subAccountId,
      });
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

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Merge with existing formData, keeping userId and promptTemplateId
      setFormData(prev => ({
        ...prev,
        ...parsed,
        // Preserve critical fields that shouldn't be overwritten
        userId: prev.userId || parsed.userId || 0,
        promptTemplateId: prev.promptTemplateId || parsed.promptTemplateId || 0,
      }));

      toast({
        title: 'Success',
        description: 'Strategy data imported successfully',
      });
      setJsonInput('');
      setShowJsonImport(false);
    } catch (error) {
      toast({
        title: 'Import Error',
        description: 'Invalid JSON format. Please check your input.',
        variant: 'destructive',
      });
    }
  };

  const handleExportJson = () => {
    // Export current form data (excluding userId and promptTemplateId for reusability)
    const exportData = {
      name: formData.name,
      description: formData.description,
      tag: formData.tag,
      industryContext: formData.industryContext,
      aiName: formData.aiName,
      aiRole: formData.aiRole,
      companyBackground: formData.companyBackground,
      conversationTone: formData.conversationTone,
      communicationStyle: formData.communicationStyle,
      qualificationQuestions: formData.qualificationQuestions,
      disqualificationRules: formData.disqualificationRules,
      objectionHandling: formData.objectionHandling,
      closingStrategy: formData.closingStrategy,
      bookingInstructions: formData.bookingInstructions,
      outputGuidelines: formData.outputGuidelines,
      prohibitedBehaviors: formData.prohibitedBehaviors,
      delayMin: formData.delayMin,
      delayMax: formData.delayMax,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(jsonStr);

    // Download as file
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-${formData.name || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Strategy data copied to clipboard and downloaded',
    });
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

            {/* JSON Import/Export Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Quick Fill with JSON</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowJsonImport(!showJsonImport)}
                  >
                    {showJsonImport ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportJson}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Current
                </Button>
              </div>

              {showJsonImport && (
                <div className="space-y-3">
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='Paste JSON here... (see example below)'
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleImportJson}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import JSON
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const exampleJson = {
                          // === CORE IDENTITY ===
                          name: 'Mike - Roofing Storm Damage Lead Qualifier',  // Strategy display name - be specific about industry & purpose
                          description: 'Assertive sales strategy for qualifying roofing storm damage leads and booking inspections. Focuses on urgency and insurance claim assistance.',  // Brief description of strategy purpose
                          tag: 'roofing',  // Category tag for filtering (e.g., 'roofing', 'hvac', 'solar', 'remodeling')
                          industryContext: 'Roofing - Storm Damage & Insurance Claims',  // Industry/niche context - helps AI understand the business vertical

                          // === PERSONA DETAILS ===
                          aiName: 'Mike',  // AI agent's first name - keep it simple and professional
                          aiRole: 'Senior Roofing Consultant with 15 years of experience specializing in storm damage assessment, insurance claims navigation, and emergency roof repairs. GAF Master Elite certified with extensive knowledge of local building codes and insurance requirements.',  // AI agent's professional role, credentials, and expertise
                          companyBackground: 'We are a family-owned roofing company with 15+ years in business, GAF Master Elite Certified (top 3% of roofers nationwide), BBB A+ Rating, fully licensed and insured. We have successfully helped over 500 homeowners navigate insurance claims for storm damage repairs, with an average claim approval rate of 92%. Our team specializes in both emergency repairs and full roof replacements.',  // Company history, certifications, achievements, and value propositions

                          // === CONVERSATION STYLE ===
                          conversationTone: 'Assertive yet empathetic, direct but not pushy. Create urgency around potential water damage and insurance claim deadlines. Use phrases like "Let me be straight with you", "Here\'s the reality", and "I\'ve seen this hundreds of times". Balance urgency with genuine concern for their home and family safety. Be confident without being arrogant.',  // How AI speaks - tone, phrases, urgency level, emotional approach
                          communicationStyle: 'Take control of the conversation naturally by asking pointed questions. Be empathetic about their situation (acknowledge stress of storm damage) but be honest about the risks of delaying repairs. Use storytelling to share similar cases. Guide them toward a decision rather than waiting for them to decide. Mirror their communication style but stay professional.',  // Approach to conversation (assertive, consultative, educational, etc)

                          // === QUALIFICATION & DISCOVERY ===
                          qualificationQuestions: `1. What type of damage did you notice? (missing shingles, leaks, dents, etc.)
2. When did the storm occur? (critical for insurance claims - most policies require claims within 1 year)
3. Have you filed an insurance claim yet, or do you need help with that process?
4. Are you the homeowner? (renters should contact landlord first)
5. What\'s your address? (to verify we service your area)
6. Have you noticed any interior damage like water stains or leaks?
7. Is this an emergency situation, or can it wait for a scheduled inspection?
8. What\'s your timeline for getting this addressed?`,  // Numbered list of questions to qualify leads - be specific and sequential
                          disqualificationRules: `- Budget under $5,000 without insurance involvement: Politely refer to handyman services or DIY resources
- Outside our service area (we serve within 50 miles of headquarters): Provide referral to trusted local roofer if possible
- Commercial properties: Transfer to commercial division
- Renters without landlord approval: Ask them to get landlord involved first
- DIY-focused leads who just want free advice: Offer paid consultation service ($150) or politely disengage
- Not the decision maker and unwilling to loop in decision maker: Schedule follow-up when decision maker is available`,  // When to disqualify or refer out - be specific about criteria and next steps

                          // === OBJECTION HANDLING ===
                          objectionHandling: `PRICE OBJECTION: "I completely understand - a new roof is a significant investment. Here's the reality though: cutting corners on roofing almost always leads to water damage, mold, and structural issues that cost 3-4x more to fix later. The good news is, if this is storm damage, your insurance will likely cover 80-100% of the cost. We can work with your insurance adjuster to ensure you get a fair settlement."

TIMING OBJECTION: "I get it - it's easy to put this off. But here's what I've seen in my 15 years doing this: every day you wait is another chance for water to seep into your attic, insulation, and walls. A $8,000 roof repair can turn into a $25,000 interior damage repair in just a few months. We can start with a free inspection this week - no obligation. That way you'll know exactly what you're dealing with."

MULTIPLE QUOTES OBJECTION: "That's actually smart - you should get multiple quotes. Just make sure you're comparing apples to apples. The lowest bid often means shortcuts: cheaper materials, unlicensed crews, or no warranty. When you're comparing quotes, ask about their GAF certification, insurance claim experience, and what their warranty covers. We're happy to match or beat any comparable quote from a GAF Master Elite contractor."

INSURANCE CONCERN: "Great question. Here's how it typically works: We do a free inspection, document all storm damage with photos and measurements, then we can either guide you through filing the claim yourself, or we can help manage the entire process for you. Most of our clients' claims are approved because we know exactly what adjusters look for. There's no upfront cost for the inspection."

"I NEED TO THINK ABOUT IT": "Absolutely - this is a big decision. What specific concerns do you have? Is it the cost, the timeline, or something else? Let me address those directly so you have all the info you need."`,  // How to handle common objections - use actual scripts with examples

                          // === CLOSING & BOOKING ===
                          closingStrategy: `Use assumptive close after confirming: (1) they have storm damage, (2) they're the homeowner, (3) they're in our service area, and (4) they want to move forward.

ASSUMPTIVE CLOSE EXAMPLE:
"Based on what you've described, this definitely sounds like storm damage that insurance should cover. Let me get you scheduled for a free inspection so we can document everything properly. I have availability this Tuesday at 2pm or Thursday at 10am - which works better for you?"

If they hesitate: "The inspection is completely free and there's no obligation. Worst case, you get a professional assessment of your roof's condition. Best case, we help you get a new roof paid for by insurance. Fair enough?"

URGENCY REINFORCEMENT:
"Just so you know, we're heading into our busy season and spots are filling up fast. I want to make sure we can get to you before the next storm hits."`,  // How to close the deal - scripts and techniques
                          bookingInstructions: `- Always offer 2-3 specific time slots (creates choice and urgency)
- Ask for their preferred contact method (call, text, or email) for appointment reminders
- Confirm their full address and any access instructions (gate codes, dogs, etc.)
- Create urgency with phrases like "limited availability this week" or "storm season is our busy time"
- Send immediate confirmation via text or email with: date, time, what to expect, and inspector's name
- Set expectation: "The inspection typically takes 30-45 minutes. I'll need access to your attic if possible, and I'll take photos and measurements of the exterior."
- Ask if there's anything specific they want the inspector to look at`,  // How to schedule appointments - process and best practices

                          // === OUTPUT RULES ===
                          outputGuidelines: `- Keep responses concise: 2-4 sentences maximum per response
- Always end with a question or clear call-to-action (never leave conversation hanging)
- Use short paragraphs for readability (break up longer responses)
- Be conversational but maintain professional credibility
- Use their name occasionally to build rapport
- Acknowledge their concerns before redirecting
- When providing options, limit to 2-3 choices (avoid overwhelming them)`,  // Response format rules - how to structure messages
                          prohibitedBehaviors: `- DON'T be pushy, aggressive, or use high-pressure sales tactics
- DON'T badmouth competitors by name (focus on what makes us better instead)
- DON'T make specific guarantees about insurance claim approvals (too many variables)
- DON'T oversell or exaggerate damage - focus on education and honest assessment
- DON'T provide exact pricing without inspection (too many variables)
- DON'T use technical jargon without explaining it
- DON'T ignore their stated concerns or preferences
- DON'T make promises about timelines without checking crew availability`,  // What NOT to do - critical boundaries

                          // === BEHAVIORAL SETTINGS ===
                          delayMin: 30,  // Minimum seconds before responding (simulates human typing/thinking time)
                          delayMax: 120  // Maximum seconds before responding (longer for complex responses)
                        };
                        setJsonInput(JSON.stringify(exampleJson, null, 2));
                      }}
                    >
                      Load Example
                    </Button>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                    <p className="font-semibold mb-1">Example JSON Structure (with inline comments):</p>
                    <code className="text-xs whitespace-pre-wrap">
                      {`{
  // === CORE IDENTITY ===
  "name": "Strategy Name",
  "description": "Brief strategy description",
  "tag": "industry-tag",
  "industryContext": "Industry - Niche",

  // === PERSONA DETAILS ===
  "aiName": "Agent Name",
  "aiRole": "Professional role and credentials...",
  "companyBackground": "Company history and achievements...",

  // === CONVERSATION STYLE ===
  "conversationTone": "Tone and phrases to use...",
  "communicationStyle": "How to approach conversations...",

  // === QUALIFICATION & DISCOVERY ===
  "qualificationQuestions": "1. Question one? 2. Question two?...",
  "disqualificationRules": "When to disqualify leads...",

  // === OBJECTION HANDLING ===
  "objectionHandling": "OBJECTION: 'Response script...'",

  // === CLOSING & BOOKING ===
  "closingStrategy": "How to close deals...",
  "bookingInstructions": "How to book appointments...",

  // === OUTPUT RULES ===
  "outputGuidelines": "Response format rules...",
  "prohibitedBehaviors": "What NOT to do...",

  // === BEHAVIORAL SETTINGS ===
  "delayMin": 30,
  "delayMax": 120
}`}
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* Core Identity Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Core Identity</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="userId">Assign to User *</Label>
                  <Select
                    value={formData.userId?.toString() || ''}
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
              <h3 className="text-lg font-semibold border-b pb-2">Persona Details</h3>

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
              <h3 className="text-lg font-semibold border-b pb-2">Conversation Style</h3>

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
              <h3 className="text-lg font-semibold border-b pb-2">Qualification & Discovery</h3>

              <div className="space-y-2">
                <Label htmlFor="qualificationQuestions">Qualification Questions *</Label>
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
                <Label htmlFor="disqualificationRules">Disqualification Rules</Label>
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
              <h3 className="text-lg font-semibold border-b pb-2">Objection Handling</h3>

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
              <h3 className="text-lg font-semibold border-b pb-2">Closing & Booking</h3>

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
                <Label htmlFor="bookingInstructions">Booking Instructions</Label>
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
              <h3 className="text-lg font-semibold border-b pb-2">Output Rules</h3>

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
                <Label htmlFor="prohibitedBehaviors">Prohibited Behaviors</Label>
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
              <h3 className="text-lg font-semibold border-b pb-2">Behavioral Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
