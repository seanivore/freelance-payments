**DOCUMENTATION-AS-CODING VERIFICATION WORKFLOW**

Transform documentation tasks into coding-style verification tasks to ensure 100% accuracy against actual codebase. Prevents hallucination by enforcing "READ BEFORE WRITE" discipline throughout.

**Variables:**

docs_directory: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `docs_directory` - Path to directory containing documentation files that need verification (e.g., ./documentation/ARCHITECTURE_SECTIONS/)

**CORE PRINCIPLE: TREAT DOCUMENTATION LIKE CODING**

Every code snippet, class name, function signature, and import statement must be verified against actual codebase files using the same discipline that makes coding tasks accurate.

**PHASE 1: VERIFICATION SYSTEM SETUP**

**Critical Mindset Shift:**
```
WRONG APPROACH: "Document the system architecture patterns"
RIGHT APPROACH: "Read actual files and copy exact code snippets with verification"

WRONG: Write from training knowledge about typical patterns
RIGHT: Read actual file → Copy exact code → Verify accuracy → Document reality
```

**Mandatory Verification Protocol:**
```
FOR EVERY CODE ELEMENT IN DOCUMENTATION:
1. MUST read actual source file using Read tool
2. MUST copy exact code snippet from file (never from memory)  
3. MUST verify line numbers and context match
4. MUST mark non-existent code as "TO BE IMPLEMENTED"
5. MUST double-check class names, function signatures, import statements

ZERO TOLERANCE for invented code patterns
```

**PHASE 2: SYSTEMATIC FILE ANALYSIS & CORRECTION**

**Documentation-as-Coding Execution Strategy:**

**Stage 1: Foundation Document Verification (Sequential)**
```
Launch FOUNDATION_VERIFICATION_AGENT with:

CRITICAL INSTRUCTIONS:
- "Treat this as code editing, not documentation writing"
- "Read EVERY claimed source file before writing ANY code snippet"
- "Copy exact code from actual files - NEVER write from memory"
- "Mark anything non-existent as 'TO BE IMPLEMENTED'"
- "Use Read tool extensively - verify everything against codebase"

Target: ARCH_01_Architecture_Overview.md
Priority Fix: Error hierarchy (MAOError → OrchestrationError family)
Method: Read orchestrator/error_handling.py → Copy exact classes → Document reality

Deliverable: ARCH_01 with 100% verified code snippets from actual files
```

**Stage 2: Parallel Module Document Verification**
```
Launch 3 PARALLEL_VERIFICATION_AGENTS with same critical instructions:

AGENT A: ARCH_02_Core_System_Patterns.md + ARCH_03_Tool_Integration_Patterns.md
- Focus: orchestrator/ directory files, tools/ directory files
- Method: Read actual core files → Copy exact patterns → Document reality

AGENT B: ARCH_04_Configuration_Data_Patterns.md + ARCH_05_User_Interface_Patterns.md  
- Focus: configs/ directory files, interfaces/ files, cli_commands/ files
- Method: Read actual config files → Copy exact patterns → Document reality

AGENT C: ARCH_06_Extension_Automation_Patterns.md
- Focus: templates/ directory, scripts/ directory, workflows/
- Method: Read actual template files → Copy exact patterns → Document reality

Each agent MUST use Read tool extensively and copy only existing code
```

**Stage 3: Cross-Verification Review (Sequential)**
```
Launch CROSS_VERIFICATION_AGENT with:

CRITICAL MISSION: 
- "Verify every single code snippet exists in claimed file location"
- "Check every class name, function signature, import statement"
- "Flag any code that cannot be found in actual codebase"
- "Ensure Node.js integration examples are marked 'TO BE IMPLEMENTED'"

Method:
1. Extract all code snippets from all 6 ARCH documents
2. Use Read tool to verify each snippet exists in claimed file
3. Create verification report with line-by-line accuracy check
4. Flag discrepancies and provide corrected versions

Deliverable: Comprehensive accuracy verification report
```

**PHASE 3: CODE-LEVEL VERIFICATION PROTOCOLS**

**Mandatory Verification Checklist for ALL Agents:**

**Before Writing ANY Code Snippet:**
- [ ] Read the actual source file using Read tool
- [ ] Locate exact code in file (line numbers, context)
- [ ] Copy exact code snippet (no modifications, no "improvements")
- [ ] Verify surrounding context matches documentation claims
- [ ] If code doesn't exist: Mark clearly as "TO BE IMPLEMENTED"

**File Reading Protocol:**
```python
# REQUIRED PROCESS for every code snippet:
1. Use Read tool on claimed source file
2. Search for exact class/function/variable name
3. Copy exact code including proper indentation
4. Note actual line numbers and file path
5. Document exactly what exists vs what needs implementation
```

**Error Hierarchy Verification Example:**
```
WRONG: Document invented MAOError, ToolExecutionError, ConfigurationError
RIGHT: Read orchestrator/error_handling.py → Document actual OrchestrationError, ValidationError, ProcessingError, ResourceError, APIError
```

**Subprocess Communication Verification:**
```
WRONG: Document as existing Node.js ↔ Python communication
RIGHT: Mark all Node.js integration patterns as "TO BE IMPLEMENTED" since interfaces/ui_terminal.py is current Python-only implementation
```

**PHASE 4: QUALITY ASSURANCE WITH CODING-STYLE VERIFICATION**

**Final Verification Stage:**
```
Launch FINAL_QA_AGENT with coding verification mindset:

TREAT LIKE CODE REVIEW:
- Every code snippet must compile/exist in claimed location
- Every import statement must be verifiable in actual files
- Every class name must match exactly (case-sensitive)
- Every function signature must match actual implementation
- Every file path must be accurate

VERIFICATION TESTING:
- Use Read tool to spot-check random code snippets
- Grep codebase for questionable class names or functions
- Verify architectural claims against actual file structure
- Ensure no training-pattern code leaked into documentation

SUCCESS CRITERIA: 
- 100% of code snippets exist in actual codebase
- 0% invented or training-pattern code
- Clear separation: "EXISTING" vs "TO BE IMPLEMENTED"
```

**EXECUTION PRINCIPLES:**

**Documentation-as-Coding Mindset:**
- Every documentation task is a code verification task
- Read actual files before writing anything
- Copy exact code (never "improve" or "generalize")
- Verify accuracy like you're editing live production code
- Mark non-existent patterns clearly for future implementation

**Zero-Tolerance Accuracy Policy:**
- No invented class names or function signatures
- No training-pattern "typical" examples
- No assumptions about what "should" exist
- Document only what actually exists in codebase

**Verification-First Workflow:**
- Read tool usage is mandatory for every code element
- Verification happens before writing, not after
- Cross-reference multiple agents' findings
- Final QA treats documentation like code review

**Success Metric: Codebase Audit Quality**
- Same accuracy standard as successful codebase audit
- Documentation that developers can trust and use
- Code snippets that work exactly as documented
- Clear roadmap of existing vs future implementation

**ULTRA-THINKING DIRECTIVE:**

**Coding Mindset Application:**
- How would I verify this code snippet if I were editing the actual file?
- Does this code snippet exist exactly as claimed in the source file?
- What verification steps would catch invented code before it's documented?
- How can I ensure the same accuracy that makes coding tasks successful?

**Documentation Truth Standard:**
- Would a developer be able to find and use this exact code?
- Does this documentation reflect the actual codebase or ideal patterns?
- Are we documenting reality or designing future implementation?
- Is every code snippet verifiable through direct file reading?

Deploy a verification-driven documentation workflow that achieves the same accuracy standard as successful coding tasks by treating every documentation element as a code verification challenge.

Begin with mandatory file reading protocols, proceed through systematic verification, and conclude with coding-style quality assurance that ensures 100% codebase accuracy.