from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

from models import (
    User,
    Workflow,
    WorkflowStep,
    ChatMessage,
    UserRole,
    WorkflowStatus,
    StepStatus,
)
from database import db_session, init_db
from services.openai_service import OpenAIService
from services.workflow_service import WorkflowService
from services.integration_service import IntegrationService

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
openai_service = OpenAIService(api_key=os.getenv("OPENAI_API_KEY"))
workflow_service = WorkflowService(openai_service)
integration_service = IntegrationService()

@app.before_request
def create_db():
    init_db()

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

# Workflow endpoints
@app.route("/api/workflows", methods=["GET"])
def list_workflows():
    """Get all workflows or filter by status"""
    status = request.args.get("status")
    if status:
        workflows = Workflow.query.filter_by(status=WorkflowStatus(status)).all()
    else:
        workflows = Workflow.query.all()
    return jsonify([w.dict() for w in workflows])

@app.route("/api/workflows", methods=["POST"])
def create_workflow():
    """Create a new workflow"""
    data = request.json
    try:
        workflow = Workflow(
            id=uuid.uuid4(),
            title=data["title"],
            description=data.get("description", ""),
            workflow_type=data["workflow_type"],
            created_by=data["created_by"],
            status=WorkflowStatus.DRAFT
        )
        workflow = workflow_service.create_workflow(workflow)
        
        # Generate initial steps if workflow type is provided
        if data.get("generate_steps", False):
            workflow_service.generate_workflow_steps(
                str(workflow.id),
                workflow.workflow_type
            )
        
        return jsonify(workflow.dict()), 201
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400

@app.route("/api/workflows/<workflow_id>", methods=["GET"])
def get_workflow(workflow_id):
    """Get a specific workflow with its steps"""
    workflow = workflow_service.get_workflow(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    result = workflow.dict()
    result["steps"] = [step.dict() for step in workflow.steps]
    return jsonify(result)

@app.route("/api/workflows/<workflow_id>", methods=["PUT"])
def update_workflow(workflow_id):
    """Update workflow details"""
    workflow = workflow_service.get_workflow(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404

    data = request.json
    for key, value in data.items():
        if hasattr(workflow, key):
            if key == "status":
                value = WorkflowStatus(value)
            setattr(workflow, key, value)
    
    db_session.commit()
    return jsonify(workflow.dict())

@app.route("/api/workflows/<workflow_id>/steps", methods=["GET"])
def list_workflow_steps(workflow_id):
    """Get all steps for a workflow"""
    workflow = workflow_service.get_workflow(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    return jsonify([step.dict() for step in workflow.steps])

@app.route("/api/workflows/<workflow_id>/steps", methods=["POST"])
def add_workflow_step(workflow_id):
    """Add a new step to a workflow"""
    data = request.json
    try:
        step = WorkflowStep(
            id=uuid.uuid4(),
            workflow_id=workflow_id,
            type=data["type"],
            title=data["title"],
            description=data.get("description", ""),
            assigned_to=data.get("assigned_to", "Unassigned"),
            due_date=datetime.fromisoformat(data["due_date"]) if "due_date" in data else None,
            status=StepStatus.NOT_STARTED
        )
        step = workflow_service.add_step(step)
        return jsonify(step.dict()), 201
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400

@app.route("/api/workflows/<workflow_id>/steps/<step_id>", methods=["PUT"])
def update_workflow_step(workflow_id, step_id):
    """Update a workflow step"""
    data = request.json
    step = WorkflowStep.query.get(step_id)
    if not step or str(step.workflow_id) != workflow_id:
        return jsonify({"error": "Step not found"}), 404

    for key, value in data.items():
        if hasattr(step, key):
            if key == "status":
                value = StepStatus(value)
            elif key == "due_date" and value:
                value = datetime.fromisoformat(value)
            setattr(step, key, value)
    
    db_session.commit()
    return jsonify(step.dict())

# Chat endpoints
@app.route("/api/workflows/<workflow_id>/messages", methods=["GET"])
def get_workflow_messages(workflow_id):
    """Get chat messages for a workflow"""
    workflow = workflow_service.get_workflow(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    messages = ChatMessage.query.filter_by(workflow_id=workflow_id)\
        .order_by(ChatMessage.created_at.desc())\
        .limit(50)\
        .all()
    return jsonify([msg.dict() for msg in messages])

@app.route("/api/workflows/<workflow_id>/messages", methods=["POST"])
def send_message(workflow_id):
    """Send a new message in a workflow"""
    data = request.json
    try:
        chat_message = ChatMessage(
            id=uuid.uuid4(),
            workflow_id=workflow_id,
            message=data["message"],
            sender=data["sender"],
            created_at=datetime.utcnow()
        )
        
        # Process message with AI
        response = workflow_service.process_message(chat_message)
        return jsonify(response)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400

# Integration endpoints
@app.route("/api/integrations/linkedin/post", methods=["POST"])
def post_to_linkedin():
    """Post a job to LinkedIn"""
    data = request.json
    result = integration_service.post_job_linkedin(data)
    return jsonify(result)

@app.route("/api/integrations/calendar/slots", methods=["POST"])
def find_calendar_slots():
    """Find common available time slots"""
    data = request.json
    slots = integration_service.find_common_slots(
        participants=data["participants"],
        duration=data["duration"]
    )
    return jsonify(slots)

@app.route("/api/integrations/background-check/initiate", methods=["POST"])
def initiate_background_check():
    """Initiate a background check"""
    data = request.json
    result = integration_service.initiate_background_check(data["candidate"])
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000))) 