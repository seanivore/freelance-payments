# Signed PDF Implementation Guide

**Created**: 2026-01-24  
**Status**: Planning Phase  
**Priority**: High (Required for v6)

---

## Executive Summary

This document provides an exclusively executable implementation plan for applying client signatures (typed legal name + date) to contract PDFs. The signed PDF will be:
1. Generated when `contract_signed` event is processed
2. Stored in the repository alongside the original
3. Emailed to both client and freelancer
4. Available for download on the contract page (after signing)

**Key Insight**: We already have `pdf-lib` installed (`"pdf-lib": "^1.17.1"` in package.json) which is perfect for modifying PDFs programmatically.

---

## Current State

### What We Have
- **PDF Generation**: Google Docs API creates contract PDFs during `admin-push.yml`
- **Signature Data**: `contract.signatures.client.legal_name` and `contract.signatures.client.signed_date` stored in JSON
- **PDF Library**: `pdf-lib` already installed (for editing), `pdfjs-dist` for rendering
- **Event Flow**: `contract_signed` event already captures name/date and triggers workflow

### Contract PDF Structure
The contract template (`assets/templates/kon-xxx-xxx.txt`) has a signature block at the bottom:

```
COMPANY 

Full Name: {{customer.name}} 
Title: {{customer.title}} 
...

                        SIGNED

                        DATED 
```

The "SIGNED" and "DATED" lines are where we need to add the client's typed name and date.

---

## Implementation Approach

### Option A: Backend (GitHub Actions) — RECOMMENDED
Apply signature in `user-exit-events.yml` when processing `contract_signed` event.

**Pros**:
- Single source of truth (workflow handles all JSON + PDF updates)
- Signed PDF committed to repo (permanent record)
- Can be emailed immediately after generation
- No frontend complexity

**Cons**:
- Requires Python PDF library (`pypdf` or similar)
- Slight delay (workflow must run)

### Option B: Frontend (Browser)
Use `pdf-lib` in the browser to modify PDF before/after signing.

**Pros**:
- Immediate visual feedback
- Already have `pdf-lib` in frontend

**Cons**:
- Where to store the signed PDF? (Can't commit to repo from browser)
- Would need to upload to API, which then commits
- More complex flow

**Decision**: Option A (Backend) is cleaner and fits our existing architecture.

---

## Technical Implementation

### Step 1: Add Python PDF Library to Workflow

**File**: `.github/workflows/user-exit-events.yml`

```yaml
- name: Install dependencies
  run: |
    pip install stripe pypdf reportlab
```

- `pypdf`: For reading/writing PDFs
- `reportlab`: For creating text overlays (better font control)

### Step 2: Create Signature Overlay Function

**New File**: `.github/scripts/utils/pdf_signature.py`

```python
"""
PDF Signature Overlay Utility

Adds typed legal name and date to contract PDF signature block.
Uses pypdf for PDF manipulation and reportlab for text rendering.
"""

import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def create_signature_overlay(legal_name: str, signed_date: str) -> io.BytesIO:
    """
    Create a PDF page with just the signature text positioned correctly.
    
    The contract PDF has the signature block at the bottom of the last page.
    Based on the template structure:
    - "SIGNED" appears around y=1.5 inches from bottom
    - "DATED" appears around y=1.0 inches from bottom
    
    We'll place the text to the right of these labels.
    """
    packet = io.BytesIO()
    
    # Create canvas with letter size (8.5 x 11 inches)
    c = canvas.Canvas(packet, pagesize=letter)
    width, height = letter
    
    # Font settings - use a clean, professional font
    # Helvetica is built-in, no need to register
    font_name = "Helvetica"
    font_size = 11
    
    c.setFont(font_name, font_size)
    
    # Position calculations (from template analysis)
    # The signature block is indented and the text goes after "SIGNED" and "DATED"
    # These values may need fine-tuning based on actual PDF output
    
    # X position: after the "SIGNED" / "DATED" labels (roughly 2.5 inches from left)
    x_position = 2.5 * inch
    
    # Y positions from bottom of page
    # "SIGNED" line - legal name goes here
    signed_y = 1.8 * inch
    
    # "DATED" line - date goes here  
    dated_y = 1.3 * inch
    
    # Draw the signature (legal name)
    c.drawString(x_position, signed_y, legal_name)
    
    # Draw the date
    c.drawString(x_position, dated_y, signed_date)
    
    c.save()
    packet.seek(0)
    return packet


def apply_signature_to_contract(
    input_pdf_path: str,
    output_pdf_path: str,
    legal_name: str,
    signed_date: str
) -> bool:
    """
    Apply signature overlay to the last page of a contract PDF.
    
    Args:
        input_pdf_path: Path to original contract PDF
        output_pdf_path: Path to save signed contract PDF
        legal_name: Client's typed legal name
        signed_date: Date string (e.g., "Jan 24, 2026")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Read the original PDF
        reader = PdfReader(input_pdf_path)
        writer = PdfWriter()
        
        # Copy all pages except the last one
        for i in range(len(reader.pages) - 1):
            writer.add_page(reader.pages[i])
        
        # Get the last page (where signature block is)
        last_page = reader.pages[-1]
        
        # Create signature overlay
        overlay_buffer = create_signature_overlay(legal_name, signed_date)
        overlay_reader = PdfReader(overlay_buffer)
        overlay_page = overlay_reader.pages[0]
        
        # Merge overlay onto last page
        last_page.merge_page(overlay_page)
        writer.add_page(last_page)
        
        # Write the signed PDF
        with open(output_pdf_path, 'wb') as output_file:
            writer.write(output_file)
        
        print(f"✅ Signed PDF created: {output_pdf_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error applying signature: {e}")
        return False


def get_signed_pdf_path(original_path: str) -> str:
    """
    Generate the signed PDF path from the original path.
    
    Example:
        assets/pdf/contract/kon-fuk-259.pdf
        -> assets/pdf/contract/kon-fuk-259-signed.pdf
    """
    if original_path.endswith('.pdf'):
        return original_path[:-4] + '-signed.pdf'
    return original_path + '-signed.pdf'
```

### Step 3: Integrate into User Exit Events Script

**File**: `.github/scripts/orchestration/user_exit_events.py`

Add signature application after processing `contract_signed` event:

```python
# At the top, add import
import sys
sys.path.append('.github/scripts/utils')
from pdf_signature import apply_signature_to_contract, get_signed_pdf_path

# In the event processing section, after handling contract_signed:
if event_type == 'contract_signed':
    # Existing code: update timestamps and signature data in JSON
    job_data['state']['client_status']['contract_signed'] = timestamp
    job_data['contract']['signatures']['client']['legal_name'] = event_data.get('legal_name', '')
    job_data['contract']['signatures']['client']['signed_date'] = event_data.get('signed_date', '')
    
    # NEW: Apply signature to PDF
    original_pdf = job_data['docs']['contract']['pdf']  # e.g., "assets/pdf/contract/kon-fuk-259.pdf"
    signed_pdf = get_signed_pdf_path(original_pdf)
    
    legal_name = event_data.get('legal_name', '')
    signed_date = event_data.get('signed_date', '')
    
    if legal_name and signed_date:
        success = apply_signature_to_contract(
            input_pdf_path=original_pdf,
            output_pdf_path=signed_pdf,
            legal_name=legal_name,
            signed_date=signed_date
        )
        
        if success:
            # Update JSON with signed PDF path
            job_data['docs']['contract']['signed_pdf'] = signed_pdf
            job_data['docs']['contract']['signed_url'] = f"https://payments.august.style/{signed_pdf}"
            print(f"✅ Contract signed and PDF updated: {signed_pdf}")
```

### Step 4: Update JSON Schema

Add new fields to track signed PDF:

```json
{
  "docs": {
    "contract": {
      "id": "kon-fuk-259",
      "pdf": "assets/pdf/contract/kon-fuk-259.pdf",
      "signed_pdf": "assets/pdf/contract/kon-fuk-259-signed.pdf",  // NEW
      "signed_url": "https://payments.august.style/assets/pdf/contract/kon-fuk-259-signed.pdf",  // NEW
      "url": "https://payments.august.style/assets/pdf/contract/kon-fuk-259.pdf",
      ...
    }
  }
}
```

### Step 5: Update Git Add in Workflow

**File**: `.github/workflows/user-exit-events.yml`

Ensure signed PDFs are committed:

```yaml
- name: Commit and push changes
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add assets/jobs/*.json
    git add assets/pdf/contract/*-signed.pdf  # NEW: Include signed PDFs
    git diff --staged --quiet || git commit -m "Update job ${{ github.event.inputs.job_id }} from user events"
    git pull --rebase origin freelance-payments
    git push origin freelance-payments
```

---

## Frontend Changes

### Step 6: Block Download Until Signed

**File**: `src/components/ContractView.tsx` (or wherever download is handled)

The contract should not be downloadable until after signing. Update the GateBar or download logic:

```typescript
// In GateBar or ContractView
const canDownload = !!data?.state?.client_status?.contract_signed;

// Download button should be disabled or hidden until signed
<button 
  onClick={handleDownload}
  disabled={!canDownload}
  className={!canDownload ? 'opacity-50 cursor-not-allowed' : ''}
>
  Download Contract
</button>
```

### Step 7: Use Signed PDF for Download (After Signing)

**File**: `src/App.tsx` or `src/components/PdfViewer.tsx`

After signing, the download should use the signed PDF:

```typescript
// Determine which PDF to use
const contractPdfUrl = data?.docs?.contract?.signed_url || data?.docs?.contract?.url;

// For download
const handleDownloadContract = () => {
  const url = data?.state?.client_status?.contract_signed 
    ? data?.docs?.contract?.signed_url 
    : data?.docs?.contract?.url;
  
  if (url) {
    window.open(url, '_blank');
  }
};
```

---

## Coordinate Calibration

The signature overlay positions (`x_position`, `signed_y`, `dated_y`) are estimates based on the template. They will need calibration:

### Calibration Process

1. Generate a test contract PDF
2. Open in a PDF viewer that shows coordinates (Adobe Acrobat, PDF-XChange)
3. Find the exact position of "SIGNED" and "DATED" text
4. Measure where the typed text should appear (to the right of labels)
5. Update the constants in `pdf_signature.py`

### Expected Adjustments

The Google Docs → PDF export may have different margins than expected. The calibration values in the code are starting points:

```python
# These may need adjustment after testing
x_position = 2.5 * inch   # Horizontal position (after labels)
signed_y = 1.8 * inch     # Vertical position for name (from bottom)
dated_y = 1.3 * inch      # Vertical position for date (from bottom)
```

---

## Testing Checklist

### Unit Tests
- [ ] `create_signature_overlay()` generates valid PDF
- [ ] `apply_signature_to_contract()` merges correctly
- [ ] `get_signed_pdf_path()` generates correct path

### Integration Tests
- [ ] Workflow installs `pypdf` and `reportlab` successfully
- [ ] `contract_signed` event triggers PDF signing
- [ ] Signed PDF is committed to repo
- [ ] JSON is updated with `signed_pdf` and `signed_url`

### Visual Tests
- [ ] Signature text is positioned correctly on PDF
- [ ] Font is readable and professional
- [ ] Text doesn't overlap with existing content
- [ ] Multi-page contracts work (signature on last page only)

### Frontend Tests
- [ ] Download blocked before signing
- [ ] Download uses signed PDF after signing
- [ ] Signed PDF displays correctly in viewer

---

## Email Integration

After signed PDF is generated, it should be emailed. See `IMPL_EMAIL_PDFS.md` for email implementation details.

The `contract_signed` event handler should:
1. Apply signature to PDF (this document)
2. Send email with signed PDF attached (see email doc)

```python
# After applying signature successfully:
if success:
    # Update JSON
    job_data['docs']['contract']['signed_pdf'] = signed_pdf
    
    # Send email (from IMPL_EMAIL_PDFS.md)
    from send_email import send_contract_signed_email
    send_contract_signed_email(
        customer_email=job_data['customer']['email'],
        customer_name=job_data['customer']['name'],
        freelancer_email='sean@august.style',
        signed_pdf_path=signed_pdf,
        job_id=job_id
    )
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `.github/workflows/user-exit-events.yml` | Add `pypdf reportlab` to pip install, add signed PDF to git add |
| `.github/scripts/utils/pdf_signature.py` | NEW: Signature overlay utility |
| `.github/scripts/orchestration/user_exit_events.py` | Import and call signature function |
| `src/components/GateBar.tsx` or `ContractView.tsx` | Block download until signed |
| `src/App.tsx` | Use signed PDF URL after signing |

---

## Dependencies

### Python (GitHub Actions)
```
pypdf>=4.0.0
reportlab>=4.0.0
```

### Already Installed (Frontend)
```
pdf-lib: ^1.17.1  (not used for this feature, but available)
pdfjs-dist: ^5.4.530  (for rendering)
```

---

## Risks and Mitigations

### Risk: Coordinate Mismatch
**Problem**: Signature appears in wrong position on PDF.
**Mitigation**: Calibration process documented above. Can also add a "signature area" marker in Google Docs template for easier positioning.

### Risk: Font Issues
**Problem**: Font not available or renders poorly.
**Mitigation**: Using Helvetica which is a PDF standard font (always available).

### Risk: Multi-page Edge Cases
**Problem**: Signature block might span pages or be on unexpected page.
**Mitigation**: Current implementation assumes signature is on last page. Template structure confirms this.

### Risk: Large PDFs
**Problem**: Memory issues with large contracts.
**Mitigation**: Contracts are typically 3-5 pages. pypdf handles this efficiently.

---

## Next Steps

1. **Create** `.github/scripts/utils/pdf_signature.py`
2. **Update** `.github/workflows/user-exit-events.yml` (dependencies + git add)
3. **Update** `.github/scripts/orchestration/user_exit_events.py` (call signature function)
4. **Test** with a sample contract to calibrate coordinates
5. **Update** frontend to block download until signed
6. **Integrate** with email system (see `IMPL_EMAIL_PDFS.md`)

---

_This document provides a complete implementation plan for applying client signatures to contract PDFs. The approach uses Python libraries in the GitHub Actions workflow, maintaining our pattern of backend-driven state changes._
