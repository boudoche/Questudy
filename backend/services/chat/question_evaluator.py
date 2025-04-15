from services.query_chatbot import query_chatbot
from services.chat.question_node import QuestionNode


def get_score_from_chatbot_answer( answer: str) -> str:
    # TODO: more robust way to detect the score, even if this works for now
    score = answer.lower()[:20]
    if "partial" in score:
        return "partial"
    elif "correct" in score:
        return "correct"
    elif "perfect" in score:
        return "perfect"
    else:
        return "incorrect"

def evaluate_core_answer( current_node: QuestionNode) -> str:
    """Evaluation of single question and answer"""
    system_prompt, user_prompt  = build_evaluation_prompt_question_answer(current_node.text, current_node.question, current_node.answer)
    chatbot_evaluation = query_chatbot(system_prompt, user_prompt )
    score = get_score_from_chatbot_answer(chatbot_evaluation)

    if score == "incorrect":
        # Replace "Wrong" or "wrong" with the new phrase
        chatbot_evaluation = chatbot_evaluation.replace("Wrong", "Incorrect, here are some suggestions for improvement")
        chatbot_evaluation = chatbot_evaluation.replace("wrong", "Incorrect, here are some suggestions for improvement")

    elif score == "partial":
        # Replace "Partially correct" with the new phrase
        chatbot_evaluation = chatbot_evaluation.replace("Partially correct", "Partially correct, here are some suggestions for improvement")
        chatbot_evaluation = chatbot_evaluation.replace("partially correct", "Partially correct, here are some suggestions for improvement")
        chatbot_evaluation = chatbot_evaluation.replace("Partially Correct", "Partially correct, here are some suggestions for improvement")

    if score == "incorrect" or score == "partial":
        chatbot_evaluation += "\nI'll ask you some more questions to help you get to the right answer."
    return score, chatbot_evaluation

def evaluate_multiple_refinement_answers(current_node: QuestionNode) -> tuple[str, str]:
    """The same refinement question can only be evaluated twice (i.e. at most with one feedback)"""

    if len(current_node.feedbacks_given) == 0:
        system_prompt, user_prompt = build_evaluation_prompt_question_answer(current_node.text, current_node.question, current_node.answer)
    else:
        system_prompt, user_prompt = build_evaluation_prompt_question_answer_feedback(current_node.text, current_node.question, current_node.answer, current_node.feedbacks_given[0])

    chatbot_evaluation = query_chatbot(system_prompt, user_prompt)

    score = get_score_from_chatbot_answer(chatbot_evaluation)

    # Replace "Wrong" or "wrong" with the new phrase
    chatbot_evaluation = chatbot_evaluation.replace("Wrong", "Incorrect, here are some suggestions for improvement")
    chatbot_evaluation = chatbot_evaluation.replace("wrong", "Incorrect, here are some suggestions for improvement")

    # Replace "Partially correct" with the new phrase
    chatbot_evaluation = chatbot_evaluation.replace("Partially correct", "Partially correct, here are some suggestions for improvement")
    chatbot_evaluation = chatbot_evaluation.replace("partially correct", "Partially correct, here are some suggestions for improvement")
    chatbot_evaluation = chatbot_evaluation.replace("Partially Correct", "Partially correct, here are some suggestions for improvement")

    return score, chatbot_evaluation


def build_evaluation_prompt_question_answer(reference_text: str, question: str, answer: str) -> str:
    system_prompt = f"""
    <context>
        The goal is to evaluate a user's answer against a REFERENCE_TEXT  (ground truth) to determine its accuracy and provide feedback. The task focuses on assessing the user's conceptual understanding based on the requirements of the original QUESTION.
    </context>

    <objective>
        1. Categorize the user's answer into one of the following categories:
        - **Perfect**: The answer fully meets the QUESTION's requirements and demonstrates excellent understanding.
        - **Correct**: The answer shows good understanding of the key concepts, it doesn't matter if details, 
        - **Partially correct**: The answer shows some understanding but lacks key elements.
        - **Wrong**: The ANSWER completely misinterprets the REFERENCE_TEXT, ignores key concepts, or introduces irrelevant or incorrect information, making it highly inaccurate and misleading.
        
        2. Provide concise feedback based on the categorization:
        - For "Partially correct" or "Wrong": Provide one or two concise, actionable bullet points that focus on specific improvements needed. Do not reveal the answer. 
        - For "Correct" or "Perfect": In this case no feedback is needed, just write "Correct" or "Perfect" as the evaluation.
    </objective>

    <instructions>
        - To receive a **Correct** rating, the answer only needs to address the core concepts accurately. As long as the fundamental information is correct, additional details, rephrasing, or examples are not required.
        - Focus evaluating the understanding the content rather than exact wording. Be flexible with terminology and synonyms.
        - Disregard writing style, grammar, or typos; focus on content accuracy. 
        - Only write one or at most two bullet points, try to not be repetitive.
    </instructions>

    <style>
        Ensure feedback is concise and actionable. Format suggestions in an HTML unordered list and begin each point with an action verb for "Partially correct" or "Wrong".
    </style>

    <tone>
        The tone should be constructive, encouraging learning and fostering a positive experience, with a focus on improvement rather than penalization.
    </tone>

    <audience>
        The feedback is intended for learners who are seeking to improve their understanding and knowledge on various topics. The language should be accessible and supportive. Remember that they are not expected to have read the REFERENCE_TEXT beforehand. 
    </audience>

    <response>
        The response format should be as follows:
        1. Start with "Perfect", "Correct", "Partially correct", or "Wrong" on a new line.
        2. If applicable, follow with HTML-formatted feedback in an unordered list.
    </response>
    """

    user_prompt = f"""  

    <REFERENCE_TEXT>{reference_text}</REFERENCE_TEXT>
    <QUESTION>{question}</QUESTION>
    <ANSWER>{answer}</ANSWER>
    """
    return system_prompt, user_prompt


def build_evaluation_prompt_question_answer_feedback( reference_text: str, question: str, answer: str, feedback:str) -> str:

    system_prompt = f"""
    <context>
        This is the user's second attempt at answering the given QUESTION. The previous suggestions for improvement have been provided and should guide the evaluation. The REFERENCE_TEXT  provides the ground truth for evaluating the user's current response, but you should also use common sense.
    </context>

    <objective>
        1. Categorize the user's ANSWER into one of the following categories:
        - **Perfect**: The ANSWER fully meets the QUESTION's requirements and demonstrates excellent understanding.
        - **Correct**: The ANSWER shows good understanding of the key concepts and covers all main points. It's also correct if it addresses all the suggestions mentioned in the PREVIOUS_FEEDBACK. 
        - **Partially correct**: The ANSWER shows some understanding but lacks key elements.
        - **Wrong**: The ANSWER completely misinterprets the REFERENCE_TEXT, ignores key concepts, or introduces irrelevant or incorrect information, making it highly inaccurate and misleading.

        2. Explain that you're going to provide feedback so that the user can improve his answer. Be concise in saying this. 

        3. Provide concise feedback based on the categorization:
        - For "Partially correct" or "Wrong": Provide one or two concise, actionable bullet points that focus on specific improvements needed.
        - For "Correct" or "Perfect": No feedback is needed, just categorize the ANSWER accordingly.
        
        Ensure feedback is extremely concise: at most two bullet points for "Partially correct" or "Wrong", and one for "Correct" or "Perfect".
    </objective>

    <instructions>
        - To receive a **Correct** rating, the ANSWER only needs to address the core concepts accurately. As long as the fundamental information is correct, additional details, rephrasing, or examples are not required.
        - Focus evaluating the understanding the content rather than exact wording. Be flexible with terminology and synonyms.
        - Disregard writing style, grammar, or typos; focus on content accuracy. 
        - Only write one or at most two bullet points, try to not be repetitive.
    </instructions>

    <style>
        The feedback should be constructive and encouraging, formatted as HTML unordered lists. For "Partially correct" or "Wrong," start each bullet point with an action verb (e.g., "Include", "Clarify") followed by the concept needing improvement. For "Correct" or "Perfect," offer one bullet point of encouragement.
    </style>

    <tone>
        The tone should prioritize encouragement and support. If all previous suggestions have been addressed, the ANSWER should be labeled as "Correct." Avoid contradicting previous suggestions and repeat any unaddressed suggestions. 
    </tone>

    <audience>
        The feedback is intended for learners seeking to improve their knowledge and understanding. The language should be supportive and accessible to non-experts.
    </audience>

    <response>
        The response format should be as follows:
        1. Start with "Perfect", "Correct", "Partially correct", or "Wrong" on a new line.
        2. If applicable, follow with HTML-formatted feedback in an unordered list.
    </response>
    """

    user_prompt = f"""
    <REFERENCE_TEXT>{reference_text}</REFERENCE_TEXT>
    <QUESTION>{question}</QUESTION>
    <PREVIOUS_FEEDBACK>{feedback}</PREVIOUS_FEEDBACK>
    <ANSWER>{answer}</ANSWER>

    """
    
    return system_prompt, user_prompt

