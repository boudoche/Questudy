from openai import OpenAI
from config import Config  # Import the configuration

client = OpenAI(api_key=Config.OPENAI_API_KEY)

def create_chat_messages(system_prompt, user_prompt):
    """Create the chat messages for the chatbot request."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

def get_chat_response(client, model, messages):
    """Create a response from the chatbot based on the given parameters."""

    return client.chat.completions.create(
        model=model,
        messages=messages
    )

def query_chatbot(system_prompt, user_prompt):
    """Query the chatbot with the given prompt and optional response format."""
    model = "gpt-4o-mini"

    messages = create_chat_messages(system_prompt, user_prompt)
    response = get_chat_response(client, model, messages)
    return response.choices[0].message.content



if __name__ == "__main__":
    system_prompt = "Hello, how are you?"
    user_prompt = "I'm doing well, thank you. How are you doing?"
    response = query_chatbot(system_prompt, user_prompt)
    print(response)