"""
Extract text from a PDF scheduling specification.
Uses pypdf (minimal dependencies, works on Windows ARM64 / Python 3.14+).
Usage: python extract_pdf.py <path_to_file.pdf>
Output: Plain text to stdout, layout-preserved where possible.
"""
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <path_to_file.pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"Error: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        from pypdf import PdfReader
    except ImportError:
        print("Error: pypdf is not installed.", file=sys.stderr)
        print("Run: pip install pypdf", file=sys.stderr)
        sys.exit(1)

    output_parts = []
    reader = PdfReader(pdf_path)

    for i, page in enumerate(reader.pages):
        output_parts.append(f"\n--- Page {i + 1} ---\n")

        # Extract text with layout mode to better preserve tables/columns
        text = page.extract_text(extraction_mode="layout")
        if text:
            output_parts.append(text)
            output_parts.append("")

    print("\n".join(output_parts).strip())


if __name__ == "__main__":
    main()
