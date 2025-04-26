from openai import OpenAI
from typing import Dict, Any, List
import json

class OpenAIService:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.default_system_prompt = """
        You are an AI recruiting assistant. Help users manage their recruiting workflows by:
        1. Understanding their requirements and goals
        2. Creating appropriate workflow steps
        3. Suggesting next actions
        4. Providing relevant templates and guidance
        """

    def process_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a user message and return AI response with workflow actions"""
        
        messages = [
            {"role": "system", "content": self.default_system_prompt}
        ]

        # Add context if provided
        if context:
            messages.append({
                "role": "system",
                "content": f"Current context: {json.dumps(context)}"
            })

        # Add user message
        messages.append({"role": "user", "content": message})

        # Get completion from OpenAI
        completion = self.client.chat.completions.create(
            model="gpt-4",  # Using GPT-4 for better understanding
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )

        # Extract response
        ai_message = completion.choices[0].message.content

        # Parse potential workflow actions
        workflow_actions = self._extract_workflow_actions(ai_message)

        return {
            "message": ai_message,
            "actions": workflow_actions
        }

    def generate_workflow_steps(self, workflow_type: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate workflow steps based on type and context"""
        
        prompt = f"""
        Create a detailed recruiting workflow for: {workflow_type}
        
        Context:
        {json.dumps(context, indent=2)}
        
        Generate a list of workflow steps including:
        - Step title
        - Step type
        - Description
        - Required participants
        - Estimated duration
        
        Return the steps in a structured format.
        """

        completion = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": self.default_system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        # Parse and structure the response
        try:
            steps = self._parse_workflow_steps(completion.choices[0].message.content)
            return steps
        except Exception as e:
            print(f"Error parsing workflow steps: {str(e)}")
            return []

    def _extract_workflow_actions(self, message: str) -> List[Dict[str, Any]]:
        """Extract potential workflow actions from AI message"""
        # This is a simplified version - in production, you'd want more sophisticated parsing
        actions = []
        
        # Look for common action patterns
        if "schedule" in message.lower():
            actions.append({
                "type": "schedule",
                "description": "Schedule an interview or meeting"
            })
        
        if "post" in message.lower() and "job" in message.lower():
            actions.append({
                "type": "post_job",
                "description": "Post a job listing"
            })
            
        if "offer" in message.lower():
            actions.append({
                "type": "prepare_offer",
                "description": "Prepare an offer letter"
            })

        return actions

    def _parse_workflow_steps(self, content: str) -> List[Dict[str, Any]]:
        """Parse the AI response into structured workflow steps"""
        # This is a simplified parser - in production, you'd want more robust parsing
        lines = content.split("\n")
        steps = []
        current_step = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith("- ") or line.startswith("* "):
                if current_step:
                    steps.append(current_step)
                current_step = {"title": line[2:]}
            elif ":" in line:
                key, value = line.split(":", 1)
                key = key.strip().lower().replace(" ", "_")
                current_step[key] = value.strip()

        if current_step:
            steps.append(current_step)

        return steps 