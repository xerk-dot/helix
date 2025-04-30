from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
from models import ChatMessage, Thread, db
import os
from dotenv import load_dotenv

#  lsof -i :5005 | grep LISTEN   
#   kill -9 37207 38234     

load_dotenv()

app = Flask(__name__)

# Configure CORS with more detailed settings
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Add request logging middleware
@app.before_request
def log_request_info():
    print('\n=== Request Details ===')
    print(f'Time: {datetime.now().isoformat()}')
    print(f'Method: {request.method}')
    print(f'URL: {request.url}')
    print(f'Headers: {dict(request.headers)}')
    if request.is_json:
        print(f'Body: {request.get_json()}')
    else:
        print('Body: Not JSON')
    print('=====================\n')
    # Force flush the output
    import sys
    sys.stdout.flush()

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql+psycopg://postgres:password123@localhost:5433/frontend_react_new')
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'connect_args': {
        'application_name': 'flask_app'
    }
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create database tables and default thread
with app.app_context():
    # Drop all tables and recreate them
    db.drop_all()
    db.create_all()
    
    # Create default thread if it doesn't exist
    default_thread = Thread.query.filter_by(is_default=True).first()
    if not default_thread:
        default_thread = Thread(
            id=str(uuid.uuid4()),
            title="Default Chat",
            is_default=True,
            created_at=datetime.utcnow()
        )
        db.session.add(default_thread)
        db.session.commit()

@app.route("/api/chat", methods=["GET", "POST"])
def chat():
    """Handle chat messages"""
    print("\n=== New Chat Request ===")
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Method: {request.method}")
    
    if request.method == "GET":
        return jsonify({"status": "ok", "message": "Chat endpoint is ready"})
        
    data = request.json
    try:
        # Debug point 1: Check incoming request
        print("\n=== Chat Debug Point 1: Incoming Request ===")
        print(f"Raw request data: {data}")
        
        # Validate required fields
        if "message" not in data:
            print("\n=== Chat Debug Point 2: Missing Message ===")
            print(f"Available fields: {list(data.keys())}")
            return jsonify({"error": "Missing message field"}), 400
            
        message = data["message"]
        print(f"\n=== Chat Debug Point 3: Message Content ===")
        print(f"Message: {message}")
        
        # Generate AI response based on message content
        ai_response = generate_ai_response(message)
        print(f"\n=== Chat Debug Point 4: AI Response ===")
        print(f"Response: {ai_response}")
        
        # Force flush the output
        import sys
        sys.stdout.flush()
        
        return jsonify({"response": ai_response})
        
    except Exception as e:
        print(f"\n=== Chat Debug Point 5: Error ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full traceback: {e.__traceback__}")
        return jsonify({"error": str(e)}), 500

def generate_ai_response(message: str) -> str:
    """Generate a meaningful response based on the user's message"""
    message = message.lower()
    
    # Job posting related responses
    if any(word in message for word in ["job", "hire", "recruit", "position", "opening"]):
        if "social media" in message:
            return """I can help you create an engaging social media post for your job opening! Here's a template you can use:

🚀 We're Hiring! 🚀

[Job Title] at [Company Name]

Are you passionate about [industry/field]? We're looking for someone who:
• [Key requirement 1]
• [Key requirement 2]
• [Key requirement 3]

What we offer:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

📍 Location: [Location]
💼 Type: [Full-time/Part-time/Contract]
💰 Salary: [Salary range]

Interested? Apply now: [Application link]

#Hiring #JobOpening #CareerOpportunity"""
        else:
            return "I can help you with job posting! Would you like me to help you create a job description or post it on social media?"
    
    # Coding assessment related responses
    elif any(word in message for word in ["coding", "technical", "assessment", "test", "interview"]):
        return """Yes, including a coding assessment can be very beneficial! Here's why:
• Helps evaluate technical skills objectively
• Reduces bias in the hiring process
• Ensures candidates can actually code
• Saves time by filtering unqualified candidates early

Would you like me to help you design an appropriate coding assessment for your role?"""
    
    # General greeting
    elif any(word in message for word in ["hi", "hello", "hey"]):
        return "Hello! I'm here to help you with your hiring needs. How can I assist you today?"
    
    # Default response
    else:
        return "I'm here to help with your hiring process! Would you like help with job postings, candidate screening, or something else?"

@app.route("/api/chat/log", methods=["POST"])
def log_message():
    """Log a chat message to the database"""
    data = request.json
    try:
        # Debug point 1: Inspect incoming data
        print("\n=== Debug Point 1: Incoming Data ===")
        print(f"Raw request data: {data}")
        
        # Validate required fields
        required_fields = ["user_id", "sender", "message", "timestamp"]
        for field in required_fields:
            if field not in data:
                print(f"\n=== Debug Point 2: Missing Field ===")
                print(f"Missing field: {field}")
                print(f"Available fields: {list(data.keys())}")
                return jsonify({"error": f"Missing required field: {field}"}), 400

        user_id = data["user_id"]
        sender = data["sender"]
        message = data["message"]
        timestamp = datetime.fromisoformat(data["timestamp"])
        
        # Debug point 3: Check parsed data
        print("\n=== Debug Point 3: Parsed Data ===")
        print(f"User ID: {user_id}")
        print(f"Sender: {sender}")
        print(f"Message: {message}")
        print(f"Timestamp: {timestamp}")
        
        # Get the default thread
        default_thread = Thread.query.filter_by(is_default=True).first()
        if not default_thread:
            print("\n=== Debug Point 4: Thread Not Found ===")
            print("No default thread found in database")
            return jsonify({"error": "Default thread not found"}), 500
            
        # Debug point 5: Check thread data
        print("\n=== Debug Point 5: Thread Data ===")
        print(f"Thread ID: {default_thread.id}")
        print(f"Thread Title: {default_thread.title}")
            
        # Create and store the message
        chat_message = ChatMessage(
            thread_id=default_thread.id,
            user_id=user_id,
            message=message,
            sender=sender,
            timestamp=timestamp
        )
        
        # Debug point 6: Check message before save
        print("\n=== Debug Point 6: Message Before Save ===")
        print(f"Message ID: {chat_message.id}")
        print(f"Thread ID: {chat_message.thread_id}")
        print(f"User ID: {chat_message.user_id}")
        print(f"Message: {chat_message.message}")
        print(f"Sender: {chat_message.sender}")
        print(f"Timestamp: {chat_message.timestamp}")
        
        db.session.add(chat_message)
        db.session.commit()
        
        # Debug point 7: Confirm save
        print("\n=== Debug Point 7: Save Confirmation ===")
        print("Message successfully saved to database")
        
        # Return the saved message
        return jsonify({
            "status": "success", 
            "message": "Message logged successfully",
            "data": chat_message.dict()
        })
    except Exception as e:
        print(f"\n=== Debug Point 8: Error ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full traceback: {e.__traceback__}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat/logs", methods=["GET"])
def get_chat_logs():
    """Get chat logs"""
    print("\n=== Get Chat Logs Request ===")
    print(f"Time: {datetime.now().isoformat()}")
    try:
        # Get all messages from the default thread
        default_thread = Thread.query.filter_by(is_default=True).first()
        if not default_thread:
            return jsonify({"error": "Default thread not found"}), 404
            
        messages = ChatMessage.query.filter_by(thread_id=default_thread.id).order_by(ChatMessage.timestamp).all()
        
        # Format messages for response
        formatted_messages = [
            {
                "id": msg.id,
                "user_id": msg.user_id,
                "message": msg.message,
                "sender": msg.sender,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]
        
        return jsonify({"messages": formatted_messages})
    except Exception as e:
        print(f"\n=== Error Getting Chat Logs ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ... rest of your routes ... 

if __name__ == "__main__":
    app.run(debug=True, port=5005)  # Run on port 5005 with debug mode enabled 