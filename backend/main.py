from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter
import pikepdf
import io

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


@app.get("/health")
async def health_check():
    return {"status": "ok"}
