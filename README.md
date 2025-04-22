# AI-Powered Recruiting Outreach Platform

## Overview
This application provides a chat-driven interface for creating and managing recruiting outreach sequences. It combines AI assistance with a dynamic workspace to help recruiters craft personalized outreach campaigns.

## Core Features

### Two-Panel Interface
- **Chat Panel (Left)**: Conversational AI interface for inputting campaign details and preferences
- **Workspace Panel (Right)**: Dynamic workspace displaying editable sequence steps with real-time AI updates

### Key Functionality
- AI-guided conversation to gather campaign requirements
- Real-time sequence generation and updates
- Direct sequence editing in workspace
- AI-assisted refinements and edits

## Technical Architecture

### Frontend
- React with TypeScript
- Responsive two-panel layout
- Real-time updates and editing capabilities

### Backend 
- Flask REST API
- Endpoints for:
  - Chat processing
  - Sequence generation
  - Live updates
- PostgreSQL database for data persistence

### AI/Agentic Layer
- Custom agentic framework for:
  - Message handling
  - Tool calling
  - Context management
- Optional: Integration with OpenAI Assistants, Langchain, or similar

## User Flow
1. User engages in AI conversation about campaign goals
2. AI collects necessary information through guided questions
3. Sequence generates dynamically in workspace
4. User can edit directly or request AI assistance
5. Changes sync in real-time between panels

## Development Checklist

### Core Requirements
- [ ] Bidirectional AI chat functionality
- [ ] Smart follow-up questions from AI
- [ ] Dynamic sequence generation
- [ ] Workspace editing capabilities
- [ ] Direct AI edit requests
- [ ] Relational database integration
- [ ] Modular Flask backend
- [ ] Custom agentic framework
- [ ] React/TypeScript frontend

### Bonus Features
- [ ] Additional AI tools (web browsing, email sending)
- [ ] User/company context storage
- [ ] Multi-session support
- [ ] Streaming chat responses
- [ ] Tool calling notifications

## Evaluation Criteria
- Functional completeness
- Technical implementation
- Solution architecture
- Code quality and organization
- Production readiness
- Documentation and communication
- AI/Agentic design

## Submission Requirements

### Required Files
- Complete codebase (zipped)
- Setup instructions (tested)

### Video Documentation
1. Product Demo (2-5 mins)
   - Full feature walkthrough
   - Chat and workspace interaction demo
   
2. Technical Overview (2-5 mins)
   - Architecture explanation
   - Key technical decisions
   - Future improvements