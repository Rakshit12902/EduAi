import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging
import time
from PIL import Image
import io
from app.core.config import settings

logger = logging.getLogger(__name__)

def extract_text_with_easyocr(image_input) -> str:
    """
    Disabled to save RAM on Render. Everything routes through Gemini now.
    """
    return ""

def describe_image_multimodal(image_bytes: bytes) -> str:
    """
    Generates OCR text and visual description using Gemini API to save RAM.
    """
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            image = Image.open(io.BytesIO(image_bytes))
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=[
                    image,
                    "Extract any text you see in this image verbatim. If there are diagrams, charts, graphs, shapes, colors, or structural relationships, describe them in detail for a teaching assistant knowledge base."
                ]
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error in Gemini Multimodal Vision: {e}")

    return ""

def extract_text_from_image(file_path: str) -> str:
    """
    Combines EasyOCR (text extraction) + Multimodal Vision AI (diagrams & visual layout).
    """
    try:
        ocr_text = extract_text_with_easyocr(file_path)
        
        with open(file_path, "rb") as f:
            img_bytes = f.read()
        visual_desc = describe_image_multimodal(img_bytes)
        
        combined = ""
        if ocr_text:
            combined += f"Extracted Text: {ocr_text}\n"
        if visual_desc:
            combined += f"Visual Diagram Description: {visual_desc}\n"
            
        if not combined.strip():
            combined = "An uploaded image document."
            
        return f"[Uploaded Image Content: {combined.strip()}]"
    except Exception as e:
        logger.error(f"Error extracting text from image {file_path}: {e}")
        raise e

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file using PyMuPDF.
    Also uses Multimodal Vision for embedded images and scanned pages.
    """
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num, page in enumerate(doc):
            page_text = page.get_text("text").strip()
            page_content = ""
            if page_text:
                page_content += page_text + "\n"
                
            # If page has little selectable text (typical for certificates, scanned docs, slides),
            # render the full page as a high-res pixmap and use Gemini Vision OCR
            if len(page_text) < 50:
                logger.info(f"Page {page_num+1} has little selectable text ({len(page_text)} chars). Rendering pixmap for Gemini Vision...")
                try:
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
                    image_bytes = pix.tobytes("png")
                    visual_desc = describe_image_multimodal(image_bytes)
                    if visual_desc:
                        page_content += f"\n[Page {page_num+1} Visual Content & Text:\n{visual_desc.strip()}]\n"
                except Exception as pix_err:
                    logger.error(f"Error rendering page {page_num+1} pixmap: {pix_err}")
            else:
                # Page has plenty of text, but also check embedded diagram images if any
                image_list = page.get_images(full=True)
                for img_index, img in enumerate(image_list[:3]):
                    xref = img[0]
                    try:
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        visual_desc = describe_image_multimodal(image_bytes)
                        if visual_desc:
                            page_content += f"\n[Image {img_index+1} on Page {page_num+1}: {visual_desc.strip()}]\n"
                    except Exception as img_err:
                        logger.warning(f"Error processing image {img_index} on page {page_num+1}: {img_err}")
            
            if page_content:
                text += page_content + "\n"
                
        doc.close()
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        raise e
    return text

import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(file_path: str) -> str:
    """
    Extracts text from a DOCX file using standard library zipfile and XML parsing.
    """
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            texts = [elem.text for elem in tree.iter() if elem.text and elem.tag.endswith('}t')]
            return "\n".join(texts)
    except Exception as e:
        logger.error(f"Error reading DOCX {file_path}: {e}")
        raise e

def extract_text_from_txt(file_path: str) -> str:
    """
    Extracts text from a plain text file.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error reading TXT {file_path}: {e}")
        raise e

def chunk_text(text: str) -> list[str]:
    """
    Chunks text using LangChain's RecursiveCharacterTextSplitter
    Chunk size: 512, Overlap: 64
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(text)
