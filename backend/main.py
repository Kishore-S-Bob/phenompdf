import base64
from io import BytesIO
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter
import io
import zipfile
from pdf2image import convert_from_bytes
from PIL import Image
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter


app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://phenompdf.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_thumbnail(image, max_size=200):
    """Generate a thumbnail from a PIL Image, maintaining aspect ratio."""
    original_width, original_height = image.size
    
    # Calculate new dimensions while maintaining aspect ratio
    if original_width > original_height:
        new_width = max_size
        new_height = int((original_height / original_width) * max_size)
    else:
        new_height = max_size
        new_width = int((original_width / original_height) * max_size)
    
    # Resize the image
    thumbnail = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Convert to RGB if necessary
    if thumbnail.mode in ('RGBA', 'P'):
        thumbnail = thumbnail.convert('RGB')
    
    return thumbnail


@app.post("/pdf-preview")
async def pdf_preview(
    file: UploadFile = File(...),
    max_size: int = 200
):
    """
    Generate thumbnail previews for each page of a PDF.
    Returns a list of base64-encoded thumbnail images.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    # Limit max_size for performance
    max_size = min(max(max_size, 50), 400)

    try:
        content = await file.read()
        
        # Convert PDF pages to images
        images = convert_from_bytes(content)
        
        if not images:
            raise HTTPException(status_code=400, detail="No pages found in PDF")

        # Generate thumbnails for each page
        thumbnails = []
        for i, image in enumerate(images):
            # Generate thumbnail
            thumbnail = generate_thumbnail(image, max_size)
            
            # Convert to base64
            buffer = BytesIO()
            thumbnail.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
            thumbnails.append({
                'page_number': i + 1,
                'image': f"data:image/jpeg;base64,{base64_image}"
            })

        return {
            'total_pages': len(thumbnails),
            'thumbnails': thumbnails
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


@app.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files required")

    writer = PdfWriter()

    try:
        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is not a PDF"
                )

            content = await file.read()
            file_obj = io.BytesIO(content)
            reader = PdfReader(file_obj)
            
            for page in reader.pages:
                writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=merged.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error merging PDFs: {str(e)}")


@app.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    start_page: int = 1,
    end_page: int = 1
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if start_page < 1:
        raise HTTPException(status_code=400, detail="Start page must be at least 1")

    if end_page < start_page:
        raise HTTPException(status_code=400, detail="End page must be greater than or equal to start page")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)
        total_pages = len(reader.pages)

        if start_page > total_pages:
            raise HTTPException(
                status_code=400,
                detail=f"Start page ({start_page}) exceeds total pages ({total_pages})"
            )

        if end_page > total_pages:
            raise HTTPException(
                status_code=400,
                detail=f"End page ({end_page}) exceeds total pages ({total_pages})"
            )

        writer = PdfWriter()

        for page_num in range(start_page - 1, end_page):
            writer.add_page(reader.pages[page_num])

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=split_{start_page}-{end_page}.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error splitting PDF: {str(e)}")


@app.post("/compress")
async def compress_pdf(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)

        # Open PDF with pypdf for compression
        reader = PdfReader(file_obj)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=compressed.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error compressing PDF: {str(e)}")


@app.post("/pdf-to-image")
async def pdf_to_image(
    file: UploadFile = File(...),
    format: str = "png"
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if format not in ["png", "jpg"]:
        raise HTTPException(
            status_code=400,
            detail="Output format must be 'png' or 'jpg'"
        )

    try:
        content = await file.read()
        
        # Convert PDF to images
        images = convert_from_bytes(content)
        
        if not images:
            raise HTTPException(status_code=400, detail="No pages found in PDF")

        # Create ZIP file in memory
        output_buffer = io.BytesIO()
        
        with zipfile.ZipFile(output_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for i, image in enumerate(images):
                img_buffer = io.BytesIO()
                
                # Determine format and quality
                if format.lower() == "jpg":
                    # Convert to RGB for JPG (removes alpha channel)
                    image = image.convert('RGB')
                    image.save(img_buffer, format='JPEG', quality=95)
                    file_ext = 'jpg'
                else:
                    image.save(img_buffer, format='PNG')
                    file_ext = 'png'
                
                img_buffer.seek(0)
                
                # Add to ZIP with sequential naming
                file_name = f"page_{i + 1}.{file_ext}"
                zip_file.writestr(file_name, img_buffer.getvalue())

        output_buffer.seek(0)

        return StreamingResponse(
            iter([output_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=images.zip"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting PDF to images: {str(e)}")


@app.post("/image-to-pdf")
async def image_to_pdf(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    valid_extensions = ('.png', '.jpg', '.jpeg')

    try:
        # Create a PDF in memory
        output_buffer = io.BytesIO()

        # Store all images first to calculate dimensions
        pil_images = []
        for file in files:
            if not file.filename.lower().endswith(valid_extensions):
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is not a supported image (PNG, JPG)"
                )

            content = await file.read()
            image = Image.open(io.BytesIO(content))

            # Convert to RGB if necessary (handles RGBA and other modes)
            if image.mode != 'RGB':
                image = image.convert('RGB')

            pil_images.append(image)

        if not pil_images:
            raise HTTPException(status_code=400, detail="No valid images provided")

        # Save all images to a single PDF using Pillow
        first_image = pil_images[0]
        remaining_images = pil_images[1:] if len(pil_images) > 1 else []

        first_image.save(
            output_buffer,
            format='PDF',
            save_all=True,
            append_images=remaining_images,
            resolution=100.0
        )

        output_buffer.seek(0)

        return StreamingResponse(
            iter([output_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=converted.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting images to PDF: {str(e)}")


@app.post("/reorder")
async def reorder_pdf(
    file: UploadFile = File(...),
    page_order: str = Form(...)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)
        total_pages = len(reader.pages)

        # Parse page order from JSON string
        try:
            new_order = json.loads(page_order)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid page order format"
            )

        if not isinstance(new_order, list):
            raise HTTPException(
                status_code=400,
                detail="Page order must be an array"
            )

        if not new_order:
            raise HTTPException(
                status_code=400,
                detail="Page order cannot be empty"
            )

        # Validate page numbers
        for page_num in new_order:
            if not isinstance(page_num, int):
                raise HTTPException(
                    status_code=400,
                    detail=f"Page number must be an integer, got {type(page_num)}"
                )
            if page_num < 1 or page_num > total_pages:
                raise HTTPException(
                    status_code=400,
                    detail=f"Page number {page_num} is out of range (1-{total_pages})"
                )

        # Create new PDF with reordered pages
        writer = PdfWriter()
        for page_num in new_order:
            writer.add_page(reader.pages[page_num - 1])

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=reordered.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reordering PDF: {str(e)}")


@app.post("/protect")
async def protect_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # Encrypt the PDF with the provided password
        writer.encrypt(password)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=protected_{file.filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error protecting PDF: {str(e)}")


@app.post("/unlock")
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)

        # Check if the PDF is encrypted
        if reader.is_encrypted:
            try:
                reader.decrypt(password)
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="Incorrect password. Unable to decrypt the PDF."
                )

        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=unlocked_{file.filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unlocking PDF: {str(e)}")


@app.post("/rotate")
async def rotate_pdf(
    file: UploadFile = File(...),
    angle: int = Form(...),
    pages: str = Form(default="")
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if angle not in [90, 180, 270]:
        raise HTTPException(status_code=400, detail="Rotation angle must be 90, 180, or 270 degrees")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)
        writer = PdfWriter()
        total_pages = len(reader.pages)

        # Parse pages parameter
        pages_to_rotate = []
        if pages and pages.strip():
            try:
                page_nums = [p.strip() for p in pages.split(",")]
                for p in page_nums:
                    if p:
                        page_num = int(p)
                        if page_num < 1 or page_num > total_pages:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Page {page_num} is out of range (1-{total_pages})"
                            )
                        pages_to_rotate.append(page_num - 1)  # Convert to 0-indexed
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid page numbers format. Use comma-separated numbers (e.g., 1,3,5)"
                )

        # Rotate pages
        for i, page in enumerate(reader.pages):
            if not pages_to_rotate or i in pages_to_rotate:
                page.rotate(angle)
            writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=rotated_{file.filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rotating PDF: {str(e)}")


@app.post("/watermark")
async def watermark_pdf(
    file: UploadFile = File(...),
    text: str = Form(...),
    position: str = Form(default="center"),
    size: int = Form(default=48),
    rotation: int = Form(default=0),
    opacity: float = Form(default=0.3)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if not text:
        raise HTTPException(status_code=400, detail="Watermark text is required")

    valid_positions = ["center", "top-left", "top-right", "bottom-left", "bottom-right"]
    if position not in valid_positions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid position. Must be one of: {', '.join(valid_positions)}"
        )

    # Validate size parameter (12-120 range)
    if size < 12 or size > 120:
        raise HTTPException(
            status_code=400,
            detail="Font size must be between 12 and 120"
        )

    # Validate rotation parameter (0-360 range)
    if rotation < 0 or rotation > 360:
        raise HTTPException(
            status_code=400,
            detail="Rotation must be between 0 and 360 degrees"
        )

    # Validate opacity parameter (0.0-1.0 range)
    if opacity < 0.0 or opacity > 1.0:
        raise HTTPException(
            status_code=400,
            detail="Opacity must be between 0.0 and 1.0"
        )

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)
        writer = PdfWriter()

        # Get the first page to determine dimensions
        first_page = reader.pages[0]
        page_width = float(first_page.mediabox.width)
        page_height = float(first_page.mediabox.height)

        # Create watermark PDF for each page
        for page_num, page in enumerate(reader.pages):
            # Create watermark layer
            watermark_buffer = io.BytesIO()
            c = canvas.Canvas(watermark_buffer, pagesize=(page_width, page_height))

            # Set watermark text properties
            c.setFont("Helvetica", size)
            c.setFillColorRGB(0, 0, 0, alpha=opacity)  # Black with specified opacity

            # Save the canvas state before rotation
            c.saveState()

            # Calculate text width for positioning
            text_width = c.stringWidth(text, "Helvetica", size)
            text_height = size

            # Calculate position based on selection
            if position == "center":
                x = (page_width - text_width) / 2
                y = (page_height - text_height) / 2
            elif position == "top-left":
                x = 20
                y = page_height - text_height - 20
            elif position == "top-right":
                x = page_width - text_width - 20
                y = page_height - text_height - 20
            elif position == "bottom-left":
                x = 20
                y = 20
            elif position == "bottom-right":
                x = page_width - text_width - 20
                y = 20

            # Apply rotation if specified
            if rotation != 0:
                # Calculate center point for rotation based on position
                if position == "center":
                    center_x = page_width / 2
                    center_y = page_height / 2
                elif position == "top-left":
                    center_x = x + text_width / 2
                    center_y = y + text_height / 2
                elif position == "top-right":
                    center_x = x + text_width / 2
                    center_y = y + text_height / 2
                elif position == "bottom-left":
                    center_x = x + text_width / 2
                    center_y = y + text_height / 2
                elif position == "bottom-right":
                    center_x = x + text_width / 2
                    center_y = y + text_height / 2

                # Translate to center, rotate, then translate back
                c.translate(center_x, center_y)
                c.rotate(rotation)
                c.translate(-center_x, -center_y)

            # Draw the watermark text
            c.drawString(x, y, text)

            # Restore canvas state
            c.restoreState()

            c.save()
            watermark_buffer.seek(0)

            # Read watermark PDF
            watermark_reader = PdfReader(watermark_buffer)
            watermark_page = watermark_reader.pages[0]

            # Merge watermark with page
            page.merge_page(watermark_page)
            writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=watermarked_{file.filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Watermark error: {str(e)}\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Error adding watermark: {str(e)}")


@app.post("/extract-pages")
async def extract_pages(
    file: UploadFile = File(...),
    pages: str = Form(...)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is not a PDF"
        )

    if not pages:
        raise HTTPException(status_code=400, detail="Pages parameter is required")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        reader = PdfReader(file_obj)
        total_pages = len(reader.pages)

        # Parse page numbers from comma-separated string
        try:
            selected_pages = [int(p.strip()) for p in pages.split(",") if p.strip()]
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid page numbers format. Use comma-separated numbers (e.g., 1,3,5)"
            )

        if not selected_pages:
            raise HTTPException(
                status_code=400,
                detail="At least one page must be selected"
            )

        # Validate page numbers
        for page_num in selected_pages:
            if page_num < 1 or page_num > total_pages:
                raise HTTPException(
                    status_code=400,
                    detail=f"Page {page_num} is out of range (1-{total_pages})"
                )

        # Create new PDF with selected pages
        writer = PdfWriter()
        for page_num in selected_pages:
            writer.add_page(reader.pages[page_num - 1])

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=extracted_pages.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting pages: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
