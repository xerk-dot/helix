import os

# Server settings
PORT = int(os.environ.get('PORT', 5000))
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

# API settings
MAX_SEQUENCE_LENGTH = int(os.environ.get('MAX_SEQUENCE_LENGTH', 1000)) 