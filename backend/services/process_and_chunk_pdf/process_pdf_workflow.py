from services.chat.create_questions import list_initial_question, split_question_from_answer
from llama_index.core import VectorStoreIndex, Settings, QueryBundle
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.readers.file import PDFReader
from llama_index.core.postprocessor.rankGPT_rerank import RankGPTRerank
from llama_index.llms.openai import OpenAI
import io
import tempfile
import os

# TODO: make the RAG settings configurable
Settings.llm = OpenAI(model="gpt-4o-mini")
Settings.chunk_size = 128
Settings.chunk_overlap = 32

def divide_dataset_in_sections(file_data: bytes, question_count: int = 3) -> list:
    """
    Process a file and generate questions from its content
    
    Args:
        file_data (bytes): The binary content of the file
        question_count (int): Number of questions to generate
        
    Returns:
        list: List of chunks with questions and answers
    """
    try:
        print("Starting to process PDF...")
        
        # Create a temporary file to store the PDF data
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name
        
        try:
            # Use the temporary file path with the reader
            reader = PDFReader()
            documents = reader.load_data(temp_file_path)
            
            # Create index from documents
            index = VectorStoreIndex.from_documents(documents)
            
            # Initialize retriever with similarity top_k
            retriever = VectorIndexRetriever(
                index=index,
                similarity_top_k=3,
            )

            # Initialize reranker with the LLM instance
            reranker = RankGPTRerank(
                llm=Settings.llm
            )

            # Generate initial questions
            questions = list_initial_question(documents, question_count)
            
            chunks = []
            for question in questions:
                query = QueryBundle(question)
                nodes = retriever.retrieve(query)
                reranked_nodes = reranker.postprocess_nodes(nodes, query)
                context = reranked_nodes[0].text if reranked_nodes else ""
                question, answer = split_question_from_answer(question)
                
                # Format the chunk to match ChatManager's expected structure
                chunks.append({
                    "text": context,  # Add the text field
                    "question": question,
                    "answer": answer,
                    "type": "basic"  # Add a type field
                })
            
            return chunks
            
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    except Exception as e:
        print(f"Error in divide_dataset_in_sections: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise
