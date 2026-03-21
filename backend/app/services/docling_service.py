from docling.document_converter import DocumentConverter 
def extract_text(file_path: str) -> str:
    """
    Extract text from any document using Docling.
    """
    try:
        print(f"Processing with Docling: {file_path}")
        
        # Instantiate the converter
        converter = DocumentConverter()
        
        # Convert the document
        result = converter.convert(file_path)
        
        # Export to markdown to preserve the structure
        markdown_text = result.document.export_to_markdown()
        
        print(f"Docling extraction successful: {len(markdown_text)} characters")
        
        return markdown_text
    
    except Exception as e:
        print(f"Error extracting text with Docling: {str(e)}")
        raise e