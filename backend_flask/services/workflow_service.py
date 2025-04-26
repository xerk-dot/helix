from typing import Dict, Any, List, Optional
from models import Workflow, WorkflowStep, ChatMessage, WorkflowStatus, StepStatus
from database import db_session
from .openai_service import OpenAIService

class WorkflowService:
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service

    def process_message(self, chat_message: ChatMessage) -> Dict[str, Any]:
        """Process a chat message and update workflow accordingly"""
        
        # Get workflow context
        context = self._get_workflow_context(chat_message.workflow_id) if chat_message.workflow_id else None
        
        # Process with OpenAI
        ai_response = self.openai_service.process_message(
            message=chat_message.message,
            context=context
        )
        
        # Save chat message
        db_session.add(chat_message)
        
        # Process any workflow actions
        if ai_response.get("actions"):
            self._handle_workflow_actions(
                workflow_id=chat_message.workflow_id,
                actions=ai_response["actions"]
            )
        
        db_session.commit()
        return ai_response

    def create_workflow(self, workflow: Workflow) -> Workflow:
        """Create a new workflow"""
        db_session.add(workflow)
        db_session.commit()
        return workflow

    def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Get a workflow by ID"""
        return Workflow.query.get(workflow_id)

    def add_step(self, step: WorkflowStep) -> WorkflowStep:
        """Add a step to a workflow"""
        db_session.add(step)
        db_session.commit()
        return step

    def update_step_status(self, step_id: str, status: StepStatus) -> WorkflowStep:
        """Update a step's status"""
        step = WorkflowStep.query.get(step_id)
        if step:
            step.status = status
            db_session.commit()
        return step

    def generate_workflow_steps(self, workflow_id: str, workflow_type: str) -> List[WorkflowStep]:
        """Generate steps for a workflow using AI"""
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return []

        context = self._get_workflow_context(workflow_id)
        steps = self.openai_service.generate_workflow_steps(workflow_type, context)
        
        # Create and save workflow steps
        workflow_steps = []
        for step_data in steps:
            step = WorkflowStep(
                workflow_id=workflow_id,
                type=step_data.get("type", "task"),
                title=step_data["title"],
                description=step_data.get("description", ""),
                assigned_to=step_data.get("required_participants", "Unassigned"),
                due_date=step_data.get("due_date", None),
                status=StepStatus.NOT_STARTED
            )
            db_session.add(step)
            workflow_steps.append(step)

        db_session.commit()
        return workflow_steps

    def _get_workflow_context(self, workflow_id: str) -> Dict[str, Any]:
        """Get the current context of a workflow"""
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return {}

        return {
            "workflow": workflow.dict(),
            "steps": [step.dict() for step in workflow.steps],
            "messages": [msg.dict() for msg in workflow.chat_messages[-5:]]  # Last 5 messages
        }

    def _handle_workflow_actions(self, workflow_id: str, actions: List[Dict[str, Any]]) -> None:
        """Handle workflow actions from AI response"""
        for action in actions:
            action_type = action["type"]
            
            if action_type == "schedule":
                # Create a scheduling step
                step = WorkflowStep(
                    workflow_id=workflow_id,
                    type="schedule",
                    title="Schedule Interview",
                    description=action["description"],
                    assigned_to="Recruiter",
                    status=StepStatus.NOT_STARTED
                )
                db_session.add(step)
            
            elif action_type == "post_job":
                # Create a job posting step
                step = WorkflowStep(
                    workflow_id=workflow_id,
                    type="post_job",
                    title="Post Job Listing",
                    description=action["description"],
                    assigned_to="Recruiter",
                    status=StepStatus.NOT_STARTED
                )
                db_session.add(step)
            
            elif action_type == "prepare_offer":
                # Create an offer preparation step
                step = WorkflowStep(
                    workflow_id=workflow_id,
                    type="prepare_offer",
                    title="Prepare Offer Letter",
                    description=action["description"],
                    assigned_to="Hiring Manager",
                    status=StepStatus.NOT_STARTED
                )
                db_session.add(step) 