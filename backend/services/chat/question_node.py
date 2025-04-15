from typing import List, Optional, Dict, Tuple
import copy


class QuestionNode:
    """
    The QuestionNode class represents a node in a tree-like structure for managing questions and answers.
    Each node stores information about a specific question, its answer, and its relationship to other questions (e.g., parent and children nodes).
    """

    def __init__(self, text: str, question: str, question_type:str, answer: Optional[str] = None, parent: Optional['QuestionNode'] = None):
        if question_type not in {"basic", "refinement", "concept"}:
            raise ValueError("question_type must be either 'basic', 'refinement', or 'concept'")
        self.text = text
        self.question = question
        self.answer = answer
        self.first_child = None
        self.parent = parent
        self.question_type = question_type
        self.next_question = None
        self.feedbacks_given = []

    def add_child(self, child: 'QuestionNode') -> None:
        self.first_child = child
    
    def count_children(self) -> int:
        """Count the number of children nodes."""
        count = 0
        child = self.first_child

        while child:
            count += 1
            child = child.next_question

        return count

    def get_parent_chat_history(self) -> Dict[str, List[Tuple[str, str, Optional[str]]]]:
        """Retrieve answer to parent question and previous sibling."""
        context = {
            "parent": [],
            "siblings": []
        }

        if self.parent:
            if self.parent.text:
                context["parent"].append((self.parent.text, self.parent.question, self.parent.answer))

            # siblings also include the current node
            sibling = self.parent.first_child
            while sibling:
                context["siblings"].append((sibling.text, sibling.question, sibling.answer))
                sibling = sibling.next_question

        else: 
            context["parent"].append((self.text, self.question, self.answer))

        return context
    
    def original_questions_all_answers_string(self) -> str:
        """Build a context string from the parent and sibling context."""
        context = self.get_parent_chat_history()
        context_strings = []

        if context["parent"]:
            for text, question, answer in context["parent"]:
                context_strings.append(f"Original Question: {question} \nAnswers (one per line):\n{answer}. ")

        if context["siblings"]:
            for text, question, answer in context["siblings"]:
                if answer:
                    context_strings.append(answer)

        return "\n".join(context_strings)
    
    def chat_history_string(self) -> str:
        """Build a context string from the parent and sibling context."""
        context = self.get_parent_chat_history()
        context_strings = []

        if context["parent"]:
            for text, question, answer in context["parent"]:
                context_strings.append(f"Original Question: {question}, Original user answer: {answer}. ")

        if context["siblings"]:
            for text, question, answer in context["siblings"]:
                context_strings.append(f"Refinement Question: {question}, Answer: {answer}")

        return "\n".join(context_strings)

    def get_siblings_questions_except_current_string(self) -> str:
        """Retrieve the questions of the siblings of the current node."""
        siblings_questions = []
        sibling = self.parent.first_child

        while sibling:
            if sibling != self:
                siblings_questions.append(sibling.question)
            sibling = sibling.next_question

        return "/n".join(siblings_questions)


    def __deepcopy__(self, memo):
        """Create a deep copy of the current QuestionNode, including its hierarchy."""
        # Create a new instance of QuestionNode with the same basic attributes
        copied_node = QuestionNode(
            text=self.text,
            question=self.question,
            question_type=self.question_type,
            answer=self.answer,
            parent=None  # Parent will be set later if necessary
        )

        # Return the deep copied instance
        return copied_node