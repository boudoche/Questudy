from services.query_chatbot import query_chatbot




def build_multiple_refinement_questions_prompt(reference_text:str, question:str, answer:str, feedback:str) -> str:
    system_prompt = f"""
    <task>
    Your task is to create follow-up questions and hints that guide the user towards correctly answering an ORIGINAL QUESTION they struggled with. Use the provided information to design these questions. 
    </task>

    <context>
    The user has answered a question incorrectly, and your role is to help them learn through follow-up questions. You need to break down the concept asked in the previous question using their PREVIOUS ANSWER as a reference.
    </context>

    <objective>
    Generate the fewest follow-up questions necessary, ideally between 1 to 2 questions, to guide the user towards the correct answer to the ORIGINAL QUESTION. The questions should be simple enough so that the user gets most of them right. 
    </objective>

    <style>
    Use a simple and encouraging style to create questions that are easy for the PREVIOUS ANSWER. Refer to the user's PREVIOUS ANSWER and provide hints or explanations to help them understand the concepts. 
    </style>

    <audience>
    The questions are for users who may be struggling with basic concepts, so the language should be clear and easy to understand.
    </audience> 

    <response_format>
    - Present each question on a separate line. The questions shouldn't be numbered. They should end with a question mark. 
    - Do not add anything else other than the questions and answers. 
    - Use a '|' separator between the question and the answer.
    - The expected answer should be concise but complete.
    </response_format>

    <instructions>
    - Break down the concept asked in the ORIGINAL QUESTION into smaller or simpler parts. 
    - Each of these smaller part should be a question. Don't ask questions about anything else other than what was in the ORIGINAL QUESTION.
    - Each follow-up question should be answerable even if presented alone, with only the user's PREVIOUS ANSWER as context.
    - Summarize relevant information from the PROVIDED TEXT when necessary to provide context.
    - Make the questions simple and easy to answer. Write them so that based on the user PREVIOUS ANSWER he'll be able to answer them correctly. 
    - Tailor the follow-up questions and hints to the user’s PREVIOUS ANSWER.
    </instructions>

    <example_1>
    **ORIGINAL QUESTION**: What is the capital of France?
    **PREVIOUS ANSWER**: Lyon
    **FEEDBACK**: Incorrect. The capital of France is Paris, not Lyon.

    Lyon is a city in France, but it's not the capital. The capital is a city known for its famous landmark, the Eiffel Tower. What is the capital of France? | Paris
    </example_1>

    <example_2>
    **ORIGINAL QUESTION**: What is the process by which plants convert sunlight into energy?
    **PREVIOUS ANSWER**: Respiration
    **FEEDBACK**: Incorrect. The process by which plants convert sunlight into energy is called photosynthesis, not respiration. Respiration is how plants and animals use energy.

    Respiration is how living organisms use energy, but plants use sunlight to create energy in a process that starts with "photo." What is this process called? | Photosynthesis
    
    Photosynthesis occurs in a specific part of the plant cell where chlorophyll is found. Can you name this part of the cell? | Chloroplast
    </example_2>

    """
 
    user_prompt = f"""
    <user_input>
    **PROVIDED TEXT**: {reference_text}
    **ORIGINAL QUESTION**: {question}
    **PREVIOUS ANSWER**: {answer}
    **FEEDBACK**: {feedback}
    </user_input>
    """
    return system_prompt, user_prompt


def build_initial_questions_prompt(text: str, question_count: int) -> tuple:
    """
    Generates a system prompt and user prompt for creating a list of questions based on the provided text.
    """

    system_prompt = f"""
    Your task is to generate {question_count} questions that assess understanding of the key concepts in the provided text.

    Instructions:
    1. Create exactly {question_count} questions, each focusing on a different key concept from the text.
    2. Each question must end with a question mark and be answerable based on the information in the text.
    3. Provide a short, concise answer for each question, using only information explicitly stated in the text.
    4. Use the following format for each question-answer pair:
       [Question that ends with a question mark] | [Concise answer]
    5. Present each question-answer pair on a separate line.
    6. Do not number the questions or add any additional text.

    Guidelines:
    - Ensure questions are clear and specific, not open-ended.
    - Include necessary context in each question so it's understandable without prior knowledge of the text.
    - Focus on the most important information in the text.
    - Write for an audience expected to understand specific information from the text, but who haven't read it.

    Example format:
    What is the capital of France? | Paris
    Who wrote "Romeo and Juliet"? | William Shakespeare
    """

    user_prompt = f"""
    Please generate {question_count} questions based on the following text:

    {text}
    """

    return system_prompt, user_prompt


def list_initial_question(text: str, question_count:int) -> list:
    """
    Generates a list of questions based on the provided text using a chatbot.
    """ 
    print("Generating questions...")
    system_prompt, user_prompt = build_initial_questions_prompt(text, question_count)
    response = query_chatbot(system_prompt, user_prompt)
    questions = response.split("\n")
    print("Questions generated.")
    
    return list(filter(None, questions))


def split_question_from_answer(question: str) -> str: 
    """
    Removes the keywords from a question. 
    """

    if "|" not in question:
        return question
    
    return question.split("|")

def create_multiple_refinement_questions(current_question, answer, full_evaluation): 
    system_prompt, user_prompt = (
        build_multiple_refinement_questions_prompt(
            current_question.text,
            current_question.question,
            answer,
            full_evaluation
        )
    )

    multiple_refinement_questions = query_chatbot(system_prompt, user_prompt)
    return [split_question_from_answer(q)[0] for q in multiple_refinement_questions.split("\n") if q and q.strip() != '']