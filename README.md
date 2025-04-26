# AI-Powered Recruiting Outreach Platform

## Overview
This application provides a chat-driven interface for creating and managing recruiting workflows. It combines AI assistance with a dynamic workspace to help recruiters manage their hiring processes efficiently.

## Core Features

### Two-Panel Interface
- **Chat Panel (Left)**: Conversational AI interface for natural language workflow creation
- **Workspace Panel (Right)**: Dynamic workspace showing current workflow steps and status

### Key Functionality
- AI-guided workflow creation and management
- Real-time updates and collaborative editing
- Automated task execution and integration
- Smart follow-up and context gathering

## Technical Stack

### Frontend
- Next.js with TypeScript
- Real-time updates using tRPC
- Responsive two-panel layout
- Drizzle ORM for type-safe database access

### Backend
- Next.js API Routes
- PostgreSQL database
- DrizzleORM for database operations
- NextAuth.js for authentication

### AI/Integration Layer
- OpenAI for natural language processing
- Custom agentic framework for tool execution
- Integration with common recruiting platforms:
  - LinkedIn
  - Greenhouse
  - Workday
  - Google Calendar
  - Checkr

## Workflow System

### Natural Language Recognition
The AI system intelligently interprets user intentions from natural language input. For example:

When you say | The AI understands to
-------------|---------------------
"We need to post this role on LinkedIn" | Create a job posting workflow with LinkedIn integration
"Can you set up interviews for the candidates?" | Initialize interview scheduling process for multiple candidates
"Let's do the final round for Sarah" | Coordinate onsite interview arrangements for a specific candidate
"Time to make an offer to John" | Begin offer letter preparation with candidate details
"Start background verification for the new hire" | Initiate background check process with vendor

The AI can:
- Extract key information from conversational language
- Determine the appropriate workflow steps needed
- Ask for any missing critical information
- Suggest next actions based on recruiting best practices
- Adapt to different hiring contexts (technical, executive, entry-level)

### AI Conversation Flow

#### Information Gathering Phase
The AI follows a structured approach to gather necessary information before generating workflows:

1. **Initial Context Collection**
```typescript
interface RequiredContext {
  role_type: string;          // e.g., "Software Engineer", "Product Manager"
  seniority: string;          // e.g., "Senior", "Lead", "Entry-level"
  department: string;         // e.g., "Engineering", "Sales", "Marketing"
  location: string;           // Office location or remote status
  urgency: "high" | "medium" | "low";
}
```

2. **Smart Follow-up Questions**
The AI asks targeted questions based on context and workflow type:

Job Posting Workflow:
```typescript
const jobPostingQuestions = {
  required: [
    "What are the key responsibilities?",
    "What are the minimum qualifications?",
    "What is the salary range?",
    "Is this role remote, hybrid, or on-site?",
  ],
  conditional: {
    technical_role: [
      "What programming languages are required?",
      "How many years of experience needed?",
    ],
    management_role: [
      "How many direct reports?",
      "What teams will they oversee?",
    ],
    sales_role: [
      "Is there a quota requirement?",
      "What territories are covered?",
    ]
  }
};
```

Interview Workflow:
```typescript
const interviewQuestions = {
  required: [
    "How many interview rounds?",
    "Who are the key interviewers?",
    "What's the timeline for completion?",
  ],
  conditional: {
    technical: [
      "Should we include a coding assessment?",
      "Do we need a system design round?",
    ],
    executive: [
      "Should we schedule a board meeting?",
      "Do we need reference checks?",
    ]
  }
};
```

#### Workflow Generation Triggers

The AI initiates workflow generation when:
1. All required context is collected
2. Minimum information threshold is met (80% confidence)
3. User confirms readiness or explicitly requests generation

```typescript
interface WorkflowGenerationCriteria {
  requiredFields: {
    contextComplete: boolean;    // All basic context collected
    questionnaireComplete: boolean;  // Key questions answered
    timelineSpecified: boolean;  // Due dates or urgency defined
  };
  confidenceScore: number;    // AI's confidence in information completeness (0-1)
  userConfirmation?: boolean; // Optional explicit user confirmation
}
```

#### Default Workflow Steps

Each workflow type has mandatory minimum steps:

1. **Job Posting Workflow** (Minimum 5 steps)
```typescript
const defaultJobPostingSteps = [
  {
    type: "document_creation",
    title: "Draft Job Description",
    required: true
  },
  {
    type: "approval",
    title: "Get Hiring Manager Approval",
    required: true
  },
  {
    type: "posting",
    title: "Post to Job Boards",
    required: true
  },
  {
    type: "setup",
    title: "Configure ATS Screening",
    required: true
  },
  {
    type: "monitoring",
    title: "Initial Application Review",
    required: true
  }
];
```

2. **Interview Workflow** (Minimum 4 steps)
```typescript
const defaultInterviewSteps = [
  {
    type: "screening",
    title: "Initial Screen",
    required: true
  },
  {
    type: "technical",
    title: "Technical Assessment",
    required: true
  },
  {
    type: "team",
    title: "Team Interview",
    required: true
  },
  {
    type: "final",
    title: "Final Decision Meeting",
    required: true
  }
];
```

3. **Offer Workflow** (Minimum 3 steps)
```typescript
const defaultOfferSteps = [
  {
    type: "preparation",
    title: "Prepare Offer Package",
    required: true
  },
  {
    type: "approval",
    title: "Get Compensation Approval",
    required: true
  },
  {
    type: "delivery",
    title: "Send Offer to Candidate",
    required: true
  }
];
```

#### Example Conversation Flow

```typescript
const conversationFlow = {
  initial_trigger: "We need to hire a senior engineer",
  
  ai_response: {
    acknowledgment: "I'll help you create a technical hiring workflow.",
    initial_questions: [
      "What programming languages are essential for this role?",
      "Is this for a specific team or project?",
      "What's your target timeline for filling this position?"
    ]
  },

  user_response: "Python expertise needed for our AI team, want to hire within 6 weeks",

  ai_follow_up: {
    context_specific: [
      "Should we include a machine learning coding assessment?",
      "Do you want to include a system design round?",
      "Who will be the hiring manager for technical interviews?"
    ],
    workflow_preparation: "I have enough information to create a technical hiring workflow with customized interview rounds. Should I generate that now?"
  }
};
```

#### Workflow Customization

After generating the default workflow, the AI can:
- Add role-specific steps based on context
- Adjust timelines based on urgency
- Include company-specific requirements
- Recommend optional steps based on best practices

The AI continuously learns from:
- User modifications to generated workflows
- Successful hiring patterns
- Company-specific preferences
- Industry best practices

### Task Type Schema
| Task Type | Required Fields |
|-----------|----------------|
| Post Job | Platform, Link, Date |
| Schedule Interview | Candidate, Interviewer, Date/Time |
| Offer Letter | Candidate, Salary, Start Date |
| Background Check | Candidate, Vendor |

### Data Models

```python
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Literal

class UserRole(str, Enum):
    RECRUITER = 'recruiter'
    HIRING_MANAGER = 'hiring_manager'
    ADMIN = 'admin'

class WorkflowStatus(str, Enum):
    DRAFT = 'draft'
    ACTIVE = 'active'
    COMPLETED = 'completed'

class StepStatus(str, Enum):
    NOT_STARTED = 'not_started'
    IN_PROGRESS = 'in_progress'
    DONE = 'done'

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole

class Workflow(BaseModel):
    id: str
    owner_user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    status: WorkflowStatus

class WorkflowStep(BaseModel):
    id: str
    workflow_id: str
    type: str
    title: str
    description: str
    assigned_to: str
    due_date: datetime
    status: StepStatus

class ChatMessage(BaseModel):
    id: str
    user_id: str
    workflow_id: str
    message: str
    created_at: datetime
    parsed: bool
```

### Example Flow
1. User logs in
2. User starts a new recruiting workflow
3. User types: "We need to interview John Doe with 3 people next week"
4. System automatically creates:
   - Schedule phone screen
   - Schedule technical interview
   - Schedule final interview
5. Workflow updates in real-time

### Integration Features
- Job board posting (LinkedIn, Greenhouse)
- Calendar integration (Google Calendar)
- ATS export capabilities

### Built-in Automation Tools

The platform includes pre-built automation tools for common recruiting tasks:

#### Job Posting Automation
```typescript
interface JobPostingTool {
  platforms: {
    linkedin: {
      postJob: (job: JobDetails) => vPromise<string>; // Returns posting URL
      updateJob: (jobId: string, updates: Partial<JobDetails>) => Promise<void>;
      closeJob: (jobId: string) => Promise<void>;
    };
    greenhouse: {
      createPosting: (job: JobDetails) => Promise<string>;
      syncApplications: () => Promise<Application[]>;
    };
  };
}
```

#### Email Campaign Tools
```typescript
interface EmailTools {
  templates: {
    initialOutreach: string;
    interviewInvite: string;
    offerLetter: string;
    rejectionNotice: string;
  };
  actions: {
    sendBulkEmails: (candidates: Candidate[], templateId: string) => Promise<void>;
    scheduleFollowUp: (email: Email, delayDays: number) => Promise<void>;
    trackOpenRates: (campaignId: string) => Promise<Analytics>;
  };
}
```

#### Calendar Management
```typescript
interface CalendarTools {
  scheduling: {
    findCommonSlots: (participants: string[], duration: number) => Promise<TimeSlot[]>;
    scheduleInterview: (details: InterviewDetails) => Promise<Meeting>;
    sendCalendarInvites: (meeting: Meeting) => Promise<void>;
  };
}
```

#### ATS Integration
```typescript
interface ATSTools {
  greenhouse: {
    syncCandidates: () => Promise<void>;
    updateStatus: (candidateId: string, status: string) => Promise<void>;
    addNote: (candidateId: string, note: string) => Promise<void>;
  };
  workday: {
    createRequisition: (details: JobRequisition) => Promise<string>;
    submitOffer: (candidateId: string, offerDetails: Offer) => Promise<void>;
  };
}
```

#### Background Check Automation
```typescript
interface BackgroundCheckTools {
  providers: {
    checkr: {
      initiateCheck: (candidate: Candidate) => Promise<string>;
      getStatus: (checkId: string) => Promise<CheckStatus>;
      downloadReport: (checkId: string) => Promise<Report>;
    };
  };
}
```

Example Usage:
```typescript
// Creating a new job posting workflow
const workflow = {
  async postToMultiplePlatforms(job: JobDetails) {
    const linkedinUrl = await tools.jobPosting.platforms.linkedin.postJob(job);
    const greenhouseId = await tools.jobPosting.platforms.greenhouse.createPosting(job);
    return { linkedinUrl, greenhouseId };
  },

  async scheduleInterviews(candidate: Candidate, interviewers: string[]) {
    const availableSlots = await tools.calendar.scheduling.findCommonSlots(interviewers, 60);
    const meeting = await tools.calendar.scheduling.scheduleInterview({
      candidate,
      interviewers,
      timeSlot: availableSlots[0],
    });
    await tools.calendar.scheduling.sendCalendarInvites(meeting);
  },

  async sendOfferAndBackground(candidate: Candidate, offer: Offer) {
    // Start background check
    const checkId = await tools.backgroundCheck.providers.checkr.initiateCheck(candidate);
    
    // Send offer letter
    await tools.email.actions.sendBulkEmails([candidate], 'offerLetter');
    
    // Update ATS
    await tools.ats.workday.submitOffer(candidate.id, offer);
    
    return { checkId };
  }
};
```

These built-in tools can be:
- Chained together for complex workflows
- Customized with company-specific templates
- Automated based on workflow step transitions
- Monitored for success/failure with retry capabilities
- Audited for compliance and reporting

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- GitHub account (for OAuth)
- OpenAI API key

### Installation Steps

1. **Clone and Setup**
```bash
git clone <repository-url>
cd frontend_react_new
```

2. **Environment Configuration**
Create a `.env` file:
```bash
# Auth
AUTH_SECRET="your-auth-secret"  # Generate with: openssl rand -base64 32
GITHUB_ID="your-github-oauth-id"
GITHUB_SECRET="your-github-oauth-secret"

# API Keys
OPENAI_API_KEY="your-openai-api-key"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/your_database"

# Environment
NODE_ENV="development"
```

3. **Database Setup**
```bash
# Create database
createdb your_database

# Push schema
pnpm db:push
```

4. **Install and Run**
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### OAuth Setup
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create new OAuth application
3. Set callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy credentials to `.env`

### Troubleshooting

Common Issues:
1. **Database Connection**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **Authentication**
   - Confirm GitHub OAuth credentials
   - Check callback URL matches exactly
   - Ensure AUTH_SECRET is set

3. **Development Server**
   - Clear `.next` cache if needed
   - Verify all dependencies installed
   - Check port 3000 is available

## Project Structure

```
frontend_react_new/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   └── server/          # Server-side code
│   │       ├── api/         # API routes
│   │       └── db/          # Database schema
│   └── styles/          # CSS styles
├── drizzle/             # Database migrations
├── public/              # Static assets
└── package.json         # Dependencies
```
