# Card-Style Form System Research & Design Document

> **Status**: Research & Planning  
> **Created**: February 3, 2026  
> **Goal**: Design an enhanced card-style form system alongside the existing "Simple Form" system

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Proposed Form Types](#proposed-form-types)
4. [Card Form Features](#card-form-features)
5. [Animation & UX Design](#animation--ux-design)
6. [Profile Estimation System](#profile-estimation-system)
7. [Admin Panel Enhancements](#admin-panel-enhancements)
8. [Technical Architecture](#technical-architecture)
9. [Competitive Analysis](#competitive-analysis)
10. [Implementation Phases](#implementation-phases)
11. [Future Enhancements](#future-enhancements)

---

## Executive Summary

This document outlines the design and implementation strategy for a dual-form system consisting of:

1. **Simple Form** (Rebranded existing system) - Traditional single-page forms for quick data collection
2. **Card Form** (New enhanced system) - Interactive, animated, one-question-at-a-time experience similar to Typeform

The card form system will feature smooth animations, progress tracking, conditional logic, and a unique **Profile Estimation** feature that computes personalized results based on user responses. **Admins build Card Forms using a flowchart canvas**: each card is a node, connections define the flow, and branching is visible and editable visually—making complex journeys much easier to design and reason about than a list + rules alone.

---

## Current System Analysis

### Existing Capabilities (To Become "Simple Form")

**Strengths:**
- Dynamic form builder with visual editor
- 9 field types (text, email, phone, textarea, select, checkbox, radio, file, image)
- JSON import/export for bulk operations
- Multi-tenant support with subAccountId isolation
- File uploads with R2 storage integration
- Submission workflow (status tracking, assignment, notes, priority)
- Customizable UI (title, subtitle, button text, success message)

**Current Limitations:**
- No conditional logic (show/hide fields based on answers)
- No validation rules beyond "required"
- No multi-step/card navigation
- No animations or transitions
- No progress indicators
- No analytics (completion rates, drop-off points)
- No webhook/email notifications
- No form versioning
- No A/B testing

### Rebranding Strategy

| Current Term | New Term |
|-------------|----------|
| Form | Simple Form |
| FormTemplate | FormTemplate (with `formType` field) |
| N/A | Card Form (new) |

---

## Proposed Form Types

### 1. Simple Form (Existing, Rebranded)

**Use Cases:**
- Contact forms
- Quick surveys
- Registration forms
- Data collection that doesn't need engagement optimization

**Characteristics:**
- All fields visible on one page
- Traditional form layout
- Quick to complete
- Lower engagement but faster completion

### 2. Card Form (New, Enhanced)

**Use Cases:**
- Lead qualification quizzes
- Personality assessments
- Product recommendation surveys
- Onboarding flows
- High-engagement surveys
- Interactive questionnaires

**Characteristics:**
- One question per screen (card)
- Animated transitions between cards
- Progress indicator
- Keyboard navigation
- Mobile-first responsive design
- Higher engagement and completion rates

---

## Card Form Features

### Core Features

#### 1. Question Card Structure

Each card contains:
```
┌─────────────────────────────────────────┐
│                                         │
│     [Progress Bar]         [1/10]       │
│                                         │
│     ┌───────────────────────────┐       │
│     │     Question Text          │       │
│     │     (with rich formatting) │       │
│     └───────────────────────────┘       │
│                                         │
│     ┌───────────────────────────┐       │
│     │                           │       │
│     │     [Media Zone]          │       │
│     │     Image/Video/GIF       │       │
│     │                           │       │
│     └───────────────────────────┘       │
│                                         │
│     ┌───────────────────────────┐       │
│     │   Answer Input Zone       │       │
│     │   (varies by type)        │       │
│     └───────────────────────────┘       │
│                                         │
│     [Back]              [Continue →]    │
│                                         │
│     Press Enter ↵ to continue           │
│                                         │
└─────────────────────────────────────────┘
```

#### 2. Enhanced Field Types

| Field Type | Description | Animation |
|-----------|-------------|-----------|
| **text** | Single line text input | Focus glow, character count |
| **email** | Email with validation | Real-time validation indicator |
| **phone** | Phone with country code | Country flag animation |
| **textarea** | Multi-line text | Auto-expand animation |
| **select** | Dropdown selection | Smooth dropdown animation |
| **multiple-choice** | Visual option cards | Hover lift, selection pop |
| **single-choice** | Radio as cards | Hover lift, selection pop |
| **image-choice** | Options with images | Image zoom on hover |
| **rating** | Star/number rating | Star fill animation |
| **scale** | Linear scale (1-10) | Slider with snap animation |
| **nps** | Net Promoter Score | Color gradient scale |
| **yes-no** | Binary choice | Toggle animation |
| **date** | Date picker | Calendar slide-in |
| **date-range** | Date range picker | Dual calendar animation |
| **time** | Time picker | Clock animation |
| **file** | File upload | Drag-drop zone animation |
| **image** | Image upload | Preview with crop |
| **signature** | Digital signature | Drawing canvas |
| **ranking** | Drag to rank items | Drag-drop reorder |
| **matrix** | Grid questions | Row-by-row fill |
| **statement** | Info card (no input) | Fade-in animation |
| **legal** | Terms acceptance | Checkbox with expand |
| **payment** | Payment collection | Secure badge animation |

#### 3. Conditional Logic System

```typescript
interface ConditionalLogic {
  // Field-level visibility
  showIf?: ConditionGroup;
  hideIf?: ConditionGroup;
  
  // Jump logic (skip to specific card)
  jumpTo?: {
    conditions: ConditionGroup;
    targetFieldId: string;
  }[];
  
  // Dynamic content
  dynamicLabel?: {
    conditions: ConditionGroup;
    label: string;
  }[];
}

interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

interface Condition {
  fieldId: string;
  operator: 
    | 'equals' 
    | 'not_equals' 
    | 'contains' 
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty'
    | 'starts_with'
    | 'ends_with';
  value: any;
}
```

**Example Use Case:**
```
Q1: "Are you a business or individual?"
  - Business → Jump to Q2 (Business details)
  - Individual → Jump to Q5 (Personal details)
```

#### 4. Piping (Answer Insertion)

Allow inserting previous answers into questions:

```
Q1: "What's your name?"
Answer: "John"

Q2: "Nice to meet you, {{Q1}}! What brings you here today?"
Renders: "Nice to meet you, John! What brings you here today?"
```

#### 5. Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` | Submit current answer & continue |
| `Tab` | Move to next input element |
| `Shift+Tab` | Move to previous input element |
| `↑/↓` | Navigate options (multiple choice) |
| `1-9` | Quick select option (multiple choice) |
| `Esc` | Go back to previous question |

#### 6. Progress Tracking

- Visual progress bar (customizable style)
- Question count indicator (1/10)
- Estimated time remaining
- Partial submission autosave

#### 7. Validation Rules

```typescript
interface ValidationRule {
  type: 
    | 'required'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'email'
    | 'phone'
    | 'url'
    | 'number'
    | 'min'
    | 'max'
    | 'custom';
  value?: any;
  message?: string;
}
```

#### 8. Media Support per Card

- **Images**: Background or inline images
- **Videos**: YouTube, Vimeo, or uploaded
- **GIFs**: Animated content
- **Icons**: Custom or from icon library
- **Illustrations**: SVG illustrations

---

## Animation & UX Design

### Transition Animations

#### Card Transitions

1. **Slide Animation** (Default)
   - Next: Slide left, new card from right
   - Back: Slide right, previous card from left
   - Duration: 300-400ms
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

2. **Fade Animation**
   - Current card fades out
   - New card fades in
   - Duration: 250-350ms
   - Slight scale effect (0.95 → 1)

3. **Zoom Animation**
   - Current card zooms out and fades
   - New card zooms in from center
   - Duration: 350-450ms

4. **Flip Animation**
   - 3D card flip effect
   - New content on "back" of card
   - Duration: 400-500ms

5. **Stack Animation**
   - Cards appear to stack/unstack
   - 3D perspective effect
   - Duration: 300-400ms

#### Micro-Animations

| Element | Animation | Timing |
|---------|-----------|--------|
| Progress bar | Smooth fill | 200ms |
| Option hover | Lift + shadow | 150ms |
| Option select | Scale pop + color | 200ms |
| Input focus | Border glow | 150ms |
| Button hover | Slight lift | 100ms |
| Error shake | Horizontal shake | 300ms |
| Success check | Draw checkmark | 400ms |
| Loading dots | Bouncing dots | Loop |

### Animation Library Recommendations

1. **Framer Motion** (Primary recommendation)
   - Already compatible with React
   - Excellent gesture support
   - AnimatePresence for exit animations
   - Layout animations built-in

2. **React Spring** (Alternative)
   - Physics-based animations
   - Natural feel
   - Smaller bundle size

### Responsive Behavior

```
Desktop (>1024px):
- Card centered, max-width 720px
- Keyboard shortcuts emphasized
- Hover effects enabled

Tablet (768-1024px):
- Card slightly narrower
- Touch-friendly tap targets
- Swipe gestures enabled

Mobile (<768px):
- Full-width card
- Larger touch targets (min 48px)
- Swipe navigation primary
- Keyboard appears for text inputs
```

---

## Profile Estimation System

### Overview

At the end of a Card Form, display personalized results based on the user's answers. This creates a quiz-like experience with computed outcomes.

**Scoring Methods:**
- **Rule-Based Scoring (Default)** - Results calculated from configured scoring rules (no AI required)
- **AI-Enhanced Scoring (Optional)** - Enable AI optimization for more sophisticated analysis, natural language processing, and personalized descriptions

**Per-Form AI Setting:** Each form has its own independent AI optimization toggle. Admins can enable AI for one form while keeping it disabled for another. **To disable AI for a specific form:** Simply leave "Enable AI-powered analysis" unchecked in that form's settings. The system will use rule-based scoring exclusively for that form.

### Result Types

#### 1. Percentage Score
```
┌─────────────────────────────────────────┐
│                                         │
│     🌲 Your Outdoor Score               │
│                                         │
│     ┌───────────────────────────┐       │
│     │         80%                │       │
│     │     ████████░░            │       │
│     └───────────────────────────┘       │
│                                         │
│     You're an Outdoor Enthusiast!       │
│     Based on your answers, you love     │
│     spending time in nature...          │
│                                         │
└─────────────────────────────────────────┘
```

#### 2. Category/Personality Result
```
┌─────────────────────────────────────────┐
│                                         │
│     🎯 You are a...                     │
│                                         │
│     ┌───────────────────────────┐       │
│     │                           │       │
│     │     THE ADVENTURER        │       │
│     │     [Matching Image]      │       │
│     │                           │       │
│     └───────────────────────────┘       │
│                                         │
│     Bold, fearless, always seeking      │
│     the next challenge...               │
│                                         │
│     [Share Result] [View Full Report]   │
│                                         │
└─────────────────────────────────────────┘
```

#### 3. Multi-Dimension Results
```
┌─────────────────────────────────────────┐
│                                         │
│     📊 Your Profile                     │
│                                         │
│     Adventure    ████████░░  82%        │
│     Social       ██████░░░░  58%        │
│     Planning     ████░░░░░░  42%        │
│     Spontaneity  █████████░  91%        │
│                                         │
│     [Radar Chart Visualization]         │
│                                         │
└─────────────────────────────────────────┘
```

#### 4. Recommendation Result
```
┌─────────────────────────────────────────┐
│                                         │
│     🎁 Perfect For You                  │
│                                         │
│     Based on your preferences:          │
│                                         │
│     1. Mountain Hiking Package          │
│        95% Match                        │
│                                         │
│     2. Coastal Adventure Tour           │
│        87% Match                        │
│                                         │
│     3. Urban Explorer Experience        │
│        72% Match                        │
│                                         │
│     [Book Now] [Learn More]             │
│                                         │
└─────────────────────────────────────────┘
```

### Scoring Configuration

```typescript
interface ProfileEstimation {
  enabled: boolean;
  type: 'percentage' | 'category' | 'multi_dimension' | 'recommendation';
  
  // AI Enhancement (optional - defaults to rule-based scoring)
  aiConfig?: AIProfileConfig;  // If undefined, uses rule-based scoring only
  
  // For percentage type
  percentageConfig?: {
    title: string;
    description: string;
    ranges: {
      min: number;
      max: number;
      label: string;
      description: string;
      image?: string;
    }[];
  };
  
  // For category type
  categoryConfig?: {
    title: string;
    categories: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingLogic: ScoringRule[];
    }[];
  };
  
  // For multi-dimension type
  dimensionConfig?: {
    title: string;
    dimensions: {
      id: string;
      name: string;
      maxScore: number;
      fields: FieldScoring[];
    }[];
    visualization: 'bars' | 'radar' | 'pie';
  };
  
  // For recommendation type
  recommendationConfig?: {
    title: string;
    recommendations: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingCriteria: ScoringRule[];
    }[];
  };
}

interface FieldScoring {
  fieldId: string;
  scoring: {
    answer: any;
    points: number;
    dimension?: string; // For multi-dimension
  }[];
}

interface ScoringRule {
  fieldId: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  weight?: number;
}
```

### AI-Enhanced Profile Estimation (Optional, Per-Form Setting)

**By default, profile estimation uses rule-based scoring** (no AI required). AI enhancement is **optional and can be toggled independently for each form**. When disabled for a form, results are computed purely from configured scoring rules.

**Per-Form Control:** Each form has its own "Enable AI-powered analysis" toggle in the admin panel. You can enable AI for one form while keeping it disabled for another. **To disable AI optimization for a specific form:** Simply leave "Enable AI-powered analysis" unchecked in that form's Profile Estimation settings. Results will be calculated using the rule-based scoring system you configure for that form.

**When AI is enabled**, it can provide:

1. **Natural Language Analysis**
   - Analyze text responses for sentiment
   - Extract themes and keywords
   - Identify personality traits

2. **Dynamic Weighting**
   - AI adjusts scoring weights based on response patterns
   - Identifies correlation between answers

3. **Personalized Descriptions**
   - Generate unique result descriptions
   - Tailor recommendations to specific answer combinations

4. **Confidence Scoring**
   - Indicate how confident the result is
   - Flag inconsistent answers

```typescript
interface AIProfileConfig {
  enabled: boolean;  // Default: false (rule-based scoring). Per-form setting - each form can independently enable/disable AI
  model: 'gpt-4' | 'claude' | 'custom';
  prompt: string;
  analysisType: 'sentiment' | 'personality' | 'recommendation';
  outputFormat: 'percentage' | 'category' | 'freeform';
}
```

---

## Admin Panel Enhancements

### Form Type Selection

```
┌─────────────────────────────────────────┐
│  Create New Form                        │
├─────────────────────────────────────────┤
│                                         │
│  Choose Form Type:                      │
│                                         │
│  ┌────────────┐    ┌────────────┐       │
│  │            │    │            │       │
│  │  📋        │    │  🎴        │       │
│  │            │    │            │       │
│  │ Simple     │    │ Card       │       │
│  │ Form       │    │ Form       │       │
│  │            │    │            │       │
│  │ Traditional│    │ Interactive│       │
│  │ all fields │    │ one at a   │       │
│  │ visible    │    │ time       │       │
│  │            │    │            │       │
│  └────────────┘    └────────────┘       │
│     [Select]         [Select]           │
│                                         │
└─────────────────────────────────────────┘
```

### Card Form Builder Interface: Flowchart-First

Admins build Card Forms on a **flowchart canvas**. Each card is a node; edges between nodes define the respondent's path. Branching (e.g. "If Business → Card 2, else → Card 5") is drawn as connections, so the full experience is visible at a glance—easier to understand and debug than a list plus separate logic rules.

#### 1. Flowchart Canvas (Primary Builder)

Admins build the experience on a **flowchart canvas**: each card is a node, edges define flow, and branching is visible. Click a node to edit that card in a side panel.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Card Form Builder                    [List view] [Flow view ●]    [Preview]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────┐                                                               │
│   │   START     │                                                               │
│   └──────┬──────┘                                                               │
│          │                                                                      │
│          ▼                                                                      │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐               │
│   │  Welcome    │─────────▶│   Name?    │─────────▶│   Email?   │               │
│   │  (statement)│         │   (text)   │         │   (email)   │               │
│   └─────────────┘         └──────┬──────┘         └──────┬──────┘               │
│                                  │                       │                      │
│                                  │              ┌────────┴────────┐             │
│                                  │              ▼                 ▼             │
│                          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│                          │  Interest?  │  │  Business   │  │  Personal   │      │
│                          │ (multi-ch.) │  │  details    │  │  details    │      │
│                          └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│                                 │                │                │             │
│                                 │                └────────┬───────┘             │
│                                 ▼                         ▼                     │
│                          ┌─────────────┐         ┌─────────────┐                 │
│                          │   Budget?   │────────▶│   Results   │                 │
│                          │   (scale)   │         │ (profile %) │                 │
│                          └─────────────┘         └──────┬──────┘                 │
│                                                         │                        │
│                                                         ▼                        │
│                                                  ┌─────────────┐                 │
│                                                  │    END      │                 │
│                                                  └─────────────┘                 │
│                                                                                 │
│   [+] Add card    [🔗 Connect]    Zoom: [−] [100%] [+]    Pan: drag canvas      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Flowchart behavior:**
- **Nodes** = Cards. Types: Start, End, Question (one per field type), Statement, Result (profile estimation).
- **Edges** = "Next card." Default edge from a question = linear next; multiple edges from one node = branching.
- **Conditional edges** = Label edges with conditions (e.g. "If Interest = Travel" → that edge's target). Runtime uses the first matching branch.
- **Click a node** → Side panel or drawer opens with that card's settings (question text, media, field type, validation, piping).
- **Drag from a node handle** → Create a new connection (and optionally a new card).
- **List view (optional)** = Same form as a linear list; useful for reordering and bulk edits. Flow and list stay in sync.

**Technical implementation:** Use **React Flow** (or **xyflow**) for the canvas—handles nodes, edges, zoom, pan, and serialization. Store graph (nodes + edges) in the form schema; at runtime, resolve path from answers and conditional edges.

#### 2. Card Settings Panel (When a Node Is Selected)

Clicking a card node opens the same settings as before—question, media, field type, validation, piping—plus **branching**:

- **Default next** = The single edge from this node (linear flow).
- **Branch rules** = Multiple edges from this node; each edge has an optional condition (e.g. "Answer equals X" → that edge's target). Configure in the panel or by editing the edge label on the canvas.

So: **flowchart = where you build the experience; panel = where you edit one card and its outgoing logic.**

#### 3. Logic Builder (Inline on Flow + Panel)

```
┌─────────────────────────────────────────┐
│  Conditional Logic for Card 4           │
├─────────────────────────────────────────┤
│                                         │
│  IF:                                    │
│  ┌─────────────────────────────────┐    │
│  │ Card 3: Interest                │    │
│  │ [equals ▼] ["Travel" ▼]         │    │
│  └─────────────────────────────────┘    │
│                          [+ Add AND]    │
│                          [+ Add OR]     │
│                                         │
│  THEN:                                  │
│  ○ Show this card                       │
│  ● Jump to Card: [6: Budget ▼]          │
│  ○ Hide this card                       │
│                                         │
│  [Delete Logic] [Save]                  │
│                                         │
└─────────────────────────────────────────┘
```

#### 3. Profile Estimation Setup

```
┌─────────────────────────────────────────┐
│  Profile Estimation Settings            │
├─────────────────────────────────────────┤
│                                         │
│  ☑ Enable Profile Estimation            │
│                                         │
│  Result Type:                           │
│  ○ Percentage Score                     │
│  ● Category/Personality                 │
│  ○ Multi-Dimension                      │
│  ○ Recommendation                       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Categories:                            │
│                                         │
│  1. The Adventurer                      │
│     [Configure Scoring →]               │
│                                         │
│  2. The Planner                         │
│     [Configure Scoring →]               │
│                                         │
│  3. The Socialite                       │
│     [Configure Scoring →]               │
│                                         │
│  [+ Add Category]                       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  AI Enhancement (Per-Form Setting):     │
│  ☐ Enable AI-powered analysis          │
│     ✓ This setting applies only to     │
│       this form                         │
│     ✓ Results use rule-based scoring    │
│       when disabled                     │
│                                         │
│  When enabled:                          │
│  [Configure AI Settings →]              │
│                                         │
└─────────────────────────────────────────┘
```

#### 4. Styling & Branding

```
┌─────────────────────────────────────────┐
│  Appearance Settings                    │
├─────────────────────────────────────────┤
│                                         │
│  Theme:                                 │
│  ○ Light  ● Dark  ○ Custom              │
│                                         │
│  Brand Color:                           │
│  [#3B82F6] [🎨]                         │
│                                         │
│  Background:                            │
│  ○ Solid Color [#1F2937]                │
│  ○ Gradient                             │
│  ○ Image [Upload]                       │
│                                         │
│  Transition Style:                      │
│  ○ Slide  ● Fade  ○ Zoom  ○ Flip        │
│                                         │
│  Progress Bar Style:                    │
│  ○ Bar  ● Dots  ○ Numbers               │
│                                         │
│  Font:                                  │
│  [Inter ▼]                              │
│                                         │
│  Logo:                                  │
│  [Upload Logo]                          │
│  Position: [Top Left ▼]                 │
│                                         │
└─────────────────────────────────────────┘
```

### Form Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Form Analytics: "Customer Survey"                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  1,234   │  │   847    │  │   68.7%  │  │  4:32    │    │
│  │  Views   │  │ Started  │  │ Completed│  │ Avg Time │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│  Drop-off Analysis:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Card 1: Welcome     ████████████████████████ 100%   │   │
│  │ Card 2: Name        ███████████████████████░ 95%    │   │
│  │ Card 3: Email       █████████████████████░░░ 88%    │   │
│  │ Card 4: Interest    ████████████████░░░░░░░░ 72%    │   │
│  │ Card 5: Budget      ████████████████░░░░░░░░ 71%    │   │
│  │ Card 6: Results     ████████████████░░░░░░░░ 69%    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Profile Results Distribution:                              │
│  [Pie Chart: Adventurer 35%, Planner 28%, Socialite 37%]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Database Schema Changes

```prisma
model FormTemplate {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  description  String?  @db.Text
  isActive     Boolean  @default(true)
  
  // NEW: Form type distinction
  formType     FormType @default(SIMPLE)
  
  // Existing fields
  schema       Json     // FormField[] | CardFormField[]
  title        String
  subtitle     String?  @db.Text
  submitButtonText String @default("Submit")
  successMessage String @default("Thank you!")
  
  // NEW: Card form specific settings
  cardSettings Json?    // CardFormSettings
  
  // NEW: Profile estimation configuration
  profileEstimation Json? // ProfileEstimation
  
  // NEW: Styling/theming
  styling      Json?    // FormStyling
  
  // NEW: Analytics tracking
  analyticsEnabled Boolean @default(true)
  
  // Existing relations...
  subAccountId Int?
  subAccount   SubAccount? @relation(...)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  createdByAdminId Int
  createdByAdmin AdminUser @relation(...)
  submissions  FormSubmission[]
  
  // NEW: Form sessions for partial completions
  sessions     FormSession[]
}

enum FormType {
  SIMPLE
  CARD
}

// NEW: Track partial form completions
model FormSession {
  id              String   @id @default(cuid())
  formTemplateId  String
  formTemplate    FormTemplate @relation(...)
  
  sessionToken    String   @unique
  currentCardIndex Int     @default(0)
  partialData     Json     // Saved answers so far
  
  // Analytics
  startedAt       DateTime @default(now())
  lastActivityAt  DateTime @updatedAt
  completedAt     DateTime?
  
  // Device info
  deviceType      String?  // mobile, tablet, desktop
  browser         String?
  os              String?
  
  // Engagement metrics
  timePerCard     Json?    // { cardId: seconds }[]
  
  subAccountId    Int
  subAccount      SubAccount @relation(...)
}

model FormSubmission {
  // ... existing fields ...
  
  // NEW: Profile estimation result
  profileResult   Json?    // Computed result
  
  // NEW: Link to session for analytics
  sessionId       String?
  session         FormSession? @relation(...)
}
```

### TypeScript Interfaces

```typescript
// Card Form Field (extends base FormField)
interface CardFormField extends FormField {
  // Card-specific
  cardTitle?: string;          // Override question as title
  cardDescription?: string;    // Additional description
  media?: CardMedia;           // Image/video/gif
  
  // Conditional logic
  conditionalLogic?: ConditionalLogic;
  
  // Piping
  enablePiping?: boolean;
  
  // Scoring (for profile estimation)
  scoring?: FieldScoring;
  
  // Animation override
  transitionOverride?: TransitionType;
}

interface CardMedia {
  type: 'image' | 'video' | 'gif' | 'icon';
  url?: string;
  altText?: string;
  position: 'above' | 'below' | 'background' | 'left' | 'right';
  // Video specific
  videoType?: 'youtube' | 'vimeo' | 'upload';
  videoId?: string;
}

// Flowchart Graph Structure (for Card Forms)
interface FlowchartGraph {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

interface FlowchartNode {
  id: string;                    // Unique node ID (matches fieldId)
  type: 'start' | 'end' | 'question' | 'statement' | 'result';
  position: { x: number; y: number };  // Canvas position
  data: {
    fieldId: string;              // Links to CardFormField
    label?: string;               // Display label on node
    // Node-specific data
    fieldType?: string;           // For question nodes
    icon?: string;               // Custom icon
  };
}

interface FlowchartEdge {
  id: string;                    // Unique edge ID
  source: string;                // Source node ID
  target: string;                // Target node ID
  type?: 'default' | 'conditional';
  label?: string;                // Edge label (e.g. "If Yes")
  condition?: Condition;        // Conditional logic for this edge
  animated?: boolean;            // Animated edge style
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

interface CardFormSettings {
  // Navigation
  showProgress: boolean;
  progressStyle: 'bar' | 'dots' | 'numbers' | 'fraction';
  showBackButton: boolean;
  showSkipButton: boolean;
  keyboardNavigation: boolean;
  swipeNavigation: boolean;
  
  // Timing
  autoAdvance: boolean;
  autoAdvanceDelay: number; // ms
  
  // Behavior
  saveProgress: boolean;
  sessionTimeout: number; // minutes
  
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
}

interface FormStyling {
  theme: 'light' | 'dark' | 'custom';
  primaryColor: string;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundImage?: string;
  gradientConfig?: {
    direction: string;
    colors: string[];
  };
  fontFamily: string;
  transitionStyle: 'slide' | 'fade' | 'zoom' | 'flip' | 'stack';
  transitionDuration: number;
  logo?: {
    url: string;
    position: 'top-left' | 'top-center' | 'top-right';
  };
  customCSS?: string;
}
```

### API Endpoints (New/Modified)

```typescript
// Form Templates
POST   /forms/templates              // Add formType to body
PATCH  /forms/templates/:id          // Can update formType

// Public Form (enhanced)
GET    /forms/public/:slug           // Returns form with type info
POST   /forms/public/:slug/submit    // Include profile result
POST   /forms/public/:slug/session   // Create/update session
GET    /forms/public/:slug/session/:token  // Resume session

// Profile Estimation
POST   /forms/public/:slug/calculate-profile  // Calculate result
GET    /forms/templates/:id/profile-preview   // Preview with sample data

// Analytics
GET    /forms/templates/:id/analytics         // Form analytics
GET    /forms/templates/:id/analytics/dropoff // Drop-off analysis
GET    /forms/templates/:id/analytics/timing  // Time per card
```

### Frontend Components Structure

```
frontend/components/
├── admin/
│   └── forms/
│       ├── form-type-selector.tsx        # Choose simple/card
│       ├── simple-form-editor.tsx        # Existing editor
│       ├── card-form-editor/
│       │   ├── index.tsx                 # Main flowchart editor container
│       │   ├── flowchart-canvas.tsx      # React Flow canvas (primary view)
│       │   ├── flowchart-nodes/           # Node type components
│       │   │   ├── start-node.tsx         # Start node
│       │   │   ├── end-node.tsx           # End node
│       │   │   ├── question-node.tsx      # Question card node
│       │   │   ├── statement-node.tsx     # Statement/info node
│       │   │   └── result-node.tsx        # Profile result node
│       │   ├── flowchart-edges.tsx       # Custom edge components with labels
│       │   ├── card-settings-panel.tsx   # Side panel (opens on node click)
│       │   ├── list-view.tsx             # Optional linear list view
│       │   ├── logic-builder.tsx         # Conditional logic UI (in panel)
│       │   ├── scoring-editor.tsx        # Profile scoring setup
│       │   └── preview-modal.tsx         # Live preview
│       ├── profile-estimation/
│       │   ├── setup-wizard.tsx          # Profile estimation setup
│       │   ├── category-editor.tsx       # Category management
│       │   ├── dimension-editor.tsx      # Multi-dimension setup
│       │   └── scoring-rules.tsx         # Rule configuration
│       └── styling-editor.tsx            # Theme/appearance
│
├── public/
│   └── forms/
│       ├── simple-form.tsx               # Existing form renderer
│       └── card-form/
│           ├── index.tsx                 # Card form container
│           ├── card-renderer.tsx         # Single card renderer
│           ├── field-types/              # Field type components
│           │   ├── text-field.tsx
│           │   ├── multiple-choice.tsx
│           │   ├── image-choice.tsx
│           │   ├── rating-field.tsx
│           │   ├── scale-field.tsx
│           │   └── ...
│           ├── navigation.tsx            # Progress/nav controls
│           ├── transitions.tsx           # Animation components
│           └── results/
│               ├── percentage-result.tsx
│               ├── category-result.tsx
│               ├── dimension-result.tsx
│               └── recommendation-result.tsx
```

---

## Competitive Analysis

### Industry Leaders

| Feature | Typeform | JotForm | Tally | Our Card Form |
|---------|----------|---------|-------|---------------|
| Card-style questions | ✅ | Partial | ✅ | ✅ |
| Animations | Excellent | Basic | Good | Excellent |
| Conditional logic | ✅ | ✅ | ✅ | ✅ |
| Profile estimation | ❌ | ❌ | ❌ | ✅ ⭐ |
| AI-powered results | ❌ | ❌ | ❌ | ✅ ⭐ |
| Multi-dimension scoring | ❌ | ❌ | ❌ | ✅ ⭐ |
| Custom branding | Paid | Paid | Free | ✅ |
| File uploads | ✅ | ✅ | ✅ | ✅ |
| Payment collection | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | Basic | ✅ |
| Self-hosted | ❌ | ❌ | ❌ | ✅ ⭐ |
| Flowchart builder | ❌ | ❌ | ❌ | ✅ ⭐ |

### Our Differentiators

1. **Profile Estimation** - No competitor offers built-in quiz/personality scoring
2. **Flowchart Builder** - Visual flowchart canvas for building complex branching forms (easier than list + rules)
3. **AI-Enhanced Analysis** - Unique AI integration for smart results
4. **Self-Hosted** - Full data ownership and privacy
5. **Multi-Tenant** - Built for agencies and multi-client scenarios
6. **Dual System** - Both simple and card forms in one platform

---

## Implementation Phases

**Implementation note:** Backwards compatibility with pre-migration data or old API shapes is not required. Assume the DB migration has been applied and all form templates have `formType` and new fields; implement for the current schema and API only, without fallbacks or workarounds for legacy behaviour.

### Phase 1: Foundation (Core Infrastructure)
- [ ] Add `formType` enum to database schema
- [ ] Update FormTemplate model with new fields
- [ ] Create FormSession model for partial saves
- [ ] Update API endpoints for form type handling
- [ ] Rebrand existing form UI to "Simple Form"
- [ ] Create form type selection UI

### Phase 2: Card Form Renderer (Frontend)
- [ ] Build card form container component
- [ ] Implement card transition animations (Framer Motion)
- [ ] Create all field type components
- [ ] Implement keyboard navigation
- [ ] Add progress indicator
- [ ] Implement session save/resume
- [ ] Mobile responsive design
- [ ] Accessibility features

### Phase 3: Flowchart-Based Card Form Builder (Admin)
- [ ] Integrate React Flow (or xyflow) library
- [ ] Create flowchart canvas component
- [ ] Build node types (Start, End, Question, Statement, Result)
- [ ] Implement custom edge components with conditional labels
- [ ] Add node creation (drag from palette or [+] button)
- [ ] Implement edge creation (drag handles between nodes)
- [ ] Build card settings panel (opens on node click)
- [ ] Add zoom/pan controls for canvas
- [ ] Implement graph serialization (nodes + edges to schema)
- [ ] Create list view toggle (alternative linear view)
- [ ] Build media upload for cards
- [ ] Create validation rule editor
- [ ] Implement live preview

### Phase 4: Conditional Logic
- [ ] Build logic condition editor UI
- [ ] Implement show/hide logic
- [ ] Implement jump logic
- [ ] Add piping (answer insertion)
- [ ] Dynamic question rendering

### Phase 5: Profile Estimation (Rule-Based)
- [ ] Build scoring configuration UI
- [ ] Implement percentage score calculation (rule-based)
- [ ] Implement category matching algorithm (rule-based)
- [ ] Create multi-dimension scoring (rule-based)
- [ ] Build result visualization components
- [ ] Add recommendation engine (rule-based)
- [ ] Add toggle to enable/disable AI optimization (default: disabled)

### Phase 6: AI Enhancement (Optional)
- [ ] Integrate AI for text analysis (only when enabled)
- [ ] Build AI configuration UI
- [ ] Implement dynamic result generation
- [ ] Add sentiment analysis
- [ ] Create personalized descriptions
- [ ] Ensure rule-based fallback when AI is disabled

### Phase 7: Analytics & Optimization
- [ ] Implement form view tracking
- [ ] Build drop-off analysis
- [ ] Create time-per-card tracking
- [ ] Build analytics dashboard
- [ ] Add A/B testing support

### Phase 8: Polish & Advanced Features
- [ ] Custom CSS editor
- [ ] Theme templates
- [ ] Form duplication
- [ ] Form versioning
- [ ] Webhook integrations
- [ ] Email notifications
- [ ] Export results to PDF

---

## Future Enhancements

### Short-Term (Next 3-6 months)
1. **Collaboration** - Multiple admins editing same form
2. **Templates Gallery** - Pre-built form templates
3. **Embed Options** - Iframe, popup, slider embeddings
4. **Partial Submission Alerts** - Email when users abandon
5. **Smart Defaults** - AI suggests question types

### Medium-Term (6-12 months)
1. **A/B Testing** - Test different versions
2. **Branching Paths** - Complex multi-path forms
3. **Calculated Fields** - Dynamic calculations
4. **External Data** - Pull data from APIs
5. **Multi-Language** - Form translations
6. **White-Label** - Complete branding removal

### Long-Term (12+ months)
1. **Form Marketplace** - Sell form templates
2. **Integration Hub** - 100+ integrations
3. **Advanced AI** - Conversational forms
4. **Voice Input** - Voice-to-text responses
5. **AR/VR Support** - Immersive experiences

---

## Summary

This research document outlines a comprehensive plan to enhance the form system with:

1. **Dual Form System** - Simple forms for basic needs, Card forms for engagement
2. **Flowchart Builder** - Visual flowchart canvas for building complex branching forms (easier than list + rules)
3. **Rich Animations** - Smooth, professional transitions
4. **Profile Estimation** - Unique quiz/scoring capabilities with rule-based scoring (default) and optional AI enhancement
5. **Per-Form AI Control** - Each form can independently enable/disable AI optimization for results
6. **Full Analytics** - Understand user behavior
7. **Enterprise Features** - Multi-tenant, self-hosted, customizable

The implementation follows a phased approach, starting with infrastructure and building toward advanced features. The system will differentiate from competitors through unique features like **flowchart-based form building**, profile estimation, and AI-enhanced results while maintaining parity on standard form capabilities.

---

## Appendix

### A. Animation Code Examples

```tsx
// Framer Motion card transition example
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

function CardForm() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentIndex}
        custom={direction}
        variants={cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
      >
        <CardContent card={cards[currentIndex]} />
      </motion.div>
    </AnimatePresence>
  );
}
```

### B. Profile Scoring Algorithm Example

```typescript
function calculatePercentageScore(
  answers: Record<string, any>,
  scoring: FieldScoring[]
): number {
  let totalPoints = 0;
  let maxPoints = 0;

  for (const field of scoring) {
    const answer = answers[field.fieldId];
    const rule = field.scoring.find((s) => s.answer === answer);
    
    if (rule) {
      totalPoints += rule.points;
    }
    
    // Calculate max possible for this field
    maxPoints += Math.max(...field.scoring.map((s) => s.points));
  }

  return Math.round((totalPoints / maxPoints) * 100);
}

function matchCategory(
  answers: Record<string, any>,
  categories: CategoryConfig[]
): CategoryResult {
  let bestMatch = categories[0];
  let highestScore = 0;

  for (const category of categories) {
    let score = 0;
    
    for (const rule of category.matchingLogic) {
      const answer = answers[rule.fieldId];
      
      if (evaluateCondition(answer, rule.operator, rule.value)) {
        score += rule.weight || 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }

  return {
    category: bestMatch,
    confidence: highestScore / getTotalWeight(categories),
  };
}
```

### C. Sample Form Schema

```json
{
  "formType": "CARD",
  "name": "Outdoor Personality Quiz",
  "schema": [
    {
      "id": "welcome",
      "type": "statement",
      "cardTitle": "Welcome to the Outdoor Personality Quiz!",
      "cardDescription": "Discover what kind of outdoor adventurer you are.",
      "media": {
        "type": "image",
        "url": "/images/outdoor-hero.jpg",
        "position": "background"
      }
    },
    {
      "id": "activity",
      "type": "image-choice",
      "label": "Which activity appeals to you most?",
      "options": [
        { "value": "hiking", "label": "Mountain Hiking", "image": "/hiking.jpg" },
        { "value": "camping", "label": "Wilderness Camping", "image": "/camping.jpg" },
        { "value": "kayaking", "label": "River Kayaking", "image": "/kayaking.jpg" },
        { "value": "climbing", "label": "Rock Climbing", "image": "/climbing.jpg" }
      ],
      "required": true,
      "scoring": {
        "hiking": { "adventurer": 3, "planner": 2 },
        "camping": { "explorer": 3, "survival": 2 },
        "kayaking": { "adventurer": 3, "adrenaline": 2 },
        "climbing": { "adrenaline": 3, "focus": 2 }
      }
    }
  ],
  "profileEstimation": {
    "enabled": true,
    "type": "multi_dimension",
    "dimensionConfig": {
      "title": "Your Outdoor Profile",
      "dimensions": [
        { "id": "adventurer", "name": "Adventure Seeker", "maxScore": 15 },
        { "id": "planner", "name": "Strategic Planner", "maxScore": 15 },
        { "id": "explorer", "name": "Nature Explorer", "maxScore": 15 },
        { "id": "adrenaline", "name": "Thrill Chaser", "maxScore": 15 }
      ],
      "visualization": "radar"
    }
  }
}
```

---

*Document Version: 1.0*  
*Last Updated: February 3, 2026*
