from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import threading
import queue
import uuid
import os
import openai

## app.py for development server, run.py for production server
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client
# Make sure to set OPENAI_API_KEY environment variable or provide it here
openai_client = openai.OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
)

# In-memory storage for chat history and generated sequences
chat_history = {}
sequence_queue = queue.Queue()
active_streams = {}

@app.route('/api/chat', methods=['POST'])
def process_chat():
    """Handle incoming chat messages, call ChatGPT, and return responses"""
    data = request.json
    user_id = data.get('user_id', str(uuid.uuid4()))
    message = data.get('message', '')
    
    if not user_id in chat_history:
        chat_history[user_id] = []
    
    # Store the user message
    chat_history[user_id].append({
        'role': 'user',
        'content': message,
        'timestamp': int(time.time() * 1000)  # Use milliseconds for JS compatibility
    })
    
    # Prepare messages for ChatGPT
    # We'll convert our chat history to the format expected by OpenAI's API
    openai_messages = []
    
    # Add system message if needed
    openai_messages.append({
        "role": "system", 
        "content": "You are a helpful assistant."
    })
    
    # Add recent message history (limit to last 10 messages to avoid token limits)
    for msg in chat_history[user_id][-10:]:
        openai_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    try:
        # Call ChatGPT API
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",  # Or your preferred model
            messages=openai_messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        # Extract the assistant's response
        assistant_response = completion.choices[0].message.content
        
        # Store the response in chat history
        chat_history[user_id].append({
            'role': 'assistant',
            'content': assistant_response,
            'timestamp': int(time.time() * 1000)
        })
        
        return jsonify({
            'user_id': user_id,
            'response': assistant_response,
            'history': chat_history[user_id]
        })
        
    except Exception as e:
        print(f"Error calling ChatGPT API: {str(e)}")
        return jsonify({
            'error': 'Failed to get response from ChatGPT',
            'details': str(e)
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_sequence():
    """Start generating a sequence asynchronously"""
    data = request.json
    user_id = data.get('user_id')
    prompt = data.get('prompt', '')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Create a unique ID for this sequence generation
    sequence_id = str(uuid.uuid4())
    
    # Start the generation in a background thread
    threading.Thread(
        target=generate_sequence_background,
        args=(sequence_id, user_id, prompt),
        daemon=True
    ).start()
    
    return jsonify({
        'sequence_id': sequence_id,
        'status': 'generation_started'
    })

def generate_sequence_background(sequence_id, user_id, prompt):
    """Background worker that generates sequence tokens"""
    # Initialize stream data
    active_streams[sequence_id] = {
        'user_id': user_id,
        'prompt': prompt,
        'tokens': [],
        'complete': False
    }
    
    # Simulate generating tokens over time
    # In a real app, this would connect to your AI model
    tokens = list(f"Generated sequence for prompt: {prompt}")
    for token in tokens:
        active_streams[sequence_id]['tokens'].append(token)
        time.sleep(0.1)  # Simulate processing time
    
    # Mark as complete
    active_streams[sequence_id]['complete'] = True

@app.route('/api/stream/<sequence_id>', methods=['GET'])
def get_stream_updates(sequence_id):
    """Get the current state of a sequence generation"""
    if sequence_id not in active_streams:
        return jsonify({'error': 'Invalid sequence ID'}), 404
    
    stream_data = active_streams[sequence_id]
    return jsonify({
        'sequence_id': sequence_id,
        'tokens': stream_data['tokens'],
        'complete': stream_data['complete']
    })

@app.route('/api/history/<user_id>', methods=['GET'])
def get_chat_history(user_id):
    """Get the chat history for a specific user"""
    if user_id not in chat_history:
        return jsonify({'history': []}), 200
    
    return jsonify({
        'user_id': user_id,
        'history': chat_history[user_id]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000) 