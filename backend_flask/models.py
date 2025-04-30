from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class Thread(db.Model):
    __tablename__ = 'threads'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with messages
    messages = db.relationship('ChatMessage', back_populates='thread', lazy='dynamic')

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = db.Column(db.String(36), db.ForeignKey('threads.id'), nullable=False)
    user_id = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(255), nullable=False)  # user or ai
    timestamp = db.Column(db.DateTime, nullable=False)

    # Relationship with thread
    thread = db.relationship('Thread', back_populates='messages')

    def dict(self):
        return {
            "id": self.id,
            "thread_id": self.thread_id,
            "user_id": self.user_id,
            "message": self.message,
            "sender": self.sender,
            "timestamp": self.timestamp.isoformat()
        } 