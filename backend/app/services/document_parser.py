import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging
import time
import easyocr
import base64
from PIL import Image
import io
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize EasyOCR reader lazily
ocr_reader = None
blip_processor = None
blip_model = None

def get_ocr_reader():
    global ocr_reader
    if ocr_reader is None:
        logger.info("Initializing EasyOCR reader...")
        ocr_reader = easyocr.Reader(['en'], gpu=False)
    return ocr_reader

def get_blip_model():
    global blip_processor, blip_model
    if blip_model is None:
        try:
            logger.info("Initializing local BLIP Vision model...")
            from transformers import BlipProcessor, BlipForConditionalGeneration
            blip_processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
            blip_model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')
        except Exception as e:
            logger.error(f"Error loading BLIP model: {e}")
            return None, None
    return blip_processor, blip_model

def extract_text_with_easyocr(image_input) -> str:
    """
    Extracts exact character-level text from image file path or bytes using EasyOCR.
    """
    try:
        reader = get_ocr_reader()
        results = reader.readtext(image_input)
        text = " ".join([res[1] for res in results if res[2] > 0.15])
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text with EasyOCR: {e}")
        return ""

def describe_image_multimodal(image_bytes: bytes) -> str:
    """
    Generates a visual description using Gemini API if key is present, otherwise falls back to local BLIP.
    """
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            image = Image.open(io.BytesIO(image_bytes))
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    image,
                    "Describe this image in detail for a teaching assistant knowledge base. Describe any diagrams, charts, graphs, shapes, colors, or structural relationships."
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
    Also uses EasyOCR + Multimodal Vision for embedded images and scanned pages.
    """
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num, page in enumerate(doc):
            page_text = page.get_text("text").strip()
            if page_text:
                text += page_text + "\n"
                
            # Extract images from page
            image_list = page.get_images(full=True)
            logger.info(f"Page {page_num+1} has {len(image_list)} images.")
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    
                    ocr_text = extract_text_with_easyocr(image_bytes)
                    visual_desc = describe_image_multimodal(image_bytes)
                    
                    img_summary = ""
                    if ocr_text:
                        img_summary += f"Text: {ocr_text} "
                    if visual_desc:
                        img_summary += f"Diagram Description: {visual_desc}"
                        
                    if img_summary:
                        text += f"\n[Image {img_index+1} on Page {page_num+1}: {img_summary.strip()}]\n"
                        
                except Exception as img_err:
                    logger.error(f"Error processing image {img_index} on page {page_num}: {img_err}")
            
            # Fallback for scanned pages
            if len(page_text) < 20 and len(image_list) == 0:
                logger.info(f"Page {page_num+1} appears to be a scanned page. Rendering pixmap...")
                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
                image_bytes = pix.tobytes("png")
                ocr_text = extract_text_with_easyocr(image_bytes)
                visual_desc = describe_image_multimodal(image_bytes)
                
                scan_summary = ""
                if ocr_text:
                    scan_summary += f"Text: {ocr_text} "
                if visual_desc:
                    scan_summary += f"Diagram Description: {visual_desc}"
                    
                if scan_summary:
                    text += f"\n[Scanned Page {page_num+1}: {scan_summary.strip()}]\n"
                    
        doc.close()
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        raise e
    return text

def extract_text_from_txt(file_path: str) -> str:
    """
    Extracts text from a plain text file.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
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
