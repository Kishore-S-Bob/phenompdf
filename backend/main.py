from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter
import pikepdf
import io
import zipfile
from pdf2image import convert_from_bytes
from PIL import Image
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

        # Open PDF with pikepdf for compression
        with pikepdf.open(file_obj) as pdf:
            # Create output in memory
            output = io.BytesIO()
            pdf.save(output, compress_streams=True, linearize=True)
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


@app.get("/health")
async def health_check():
    return {"status": "ok"}
