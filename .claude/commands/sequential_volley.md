**SEQUENTIAL VOLLEY EXECUTION COMMAND**

Execute systematic 3-phase volley workflow for individual items with comprehensive quality validation. Perfect for testing, single-item processing, or careful step-by-step implementation.

**Variables:**

volley_spec: $ARGUMENTS
item_numbers: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `volley_spec` - Path to volley specification file defining the process and requirements
2. `item_numbers` - Specific item number(s) to process (e.g., "4", "workflows", "4,5,6")

**PHASE 1: SPECIFICATION ANALYSIS & ITEM PREPARATION**

**Deep Volley Specification Analysis:**
Read and analyze the volley specification at `volley_spec`:
- **Process Definition**: Understand the 3-phase volley pattern to execute
- **Quality Standards**: What constitutes success and compliance requirements
- **Item Extraction**: How to parse and identify items from source documents
- **Validation Criteria**: Success metrics and quality checkpoints for each phase
- **Integration Requirements**: How items connect with existing systems

**Item Selection & Analysis:**
Extract and prepare the specified `item_numbers` from the volley specification:
- **Item Identification**: Parse source documents to extract specified items
- **Requirements Analysis**: Deep understanding of what each item needs to accomplish
- **Dependency Mapping**: Identify any prerequisites or integration requirements
- **Quality Patterns**: Reference successful examples and established patterns
- **Risk Assessment**: Identify items that may need special attention

**Sequential Processing Strategy:**
Design execution approach for the specified items:
- **Processing Order**: Optimal sequence for handling multiple items
- **Quality Gates**: Validation checkpoints between phases
- **Error Handling**: Recovery strategies and escalation procedures
- **Progress Tracking**: How to maintain state and provide oversight

**PHASE 2: SYSTEMATIC VOLLEY EXECUTION**

**For Each Item in Sequence:**

**Sub-Phase 2A: Requirements & Planning**
```
Launch ANALYSIS AGENT for current item:
- Complete volley specification context
- Item-specific requirements and patterns
- Quality standards and success criteria
- Integration touchpoints and dependencies

VALIDATION GATE:
- Requirements analysis complete and clear
- Approach aligns with specification patterns
- No critical gaps or ambiguities
- Integration strategy validated

DECISION LOGIC:
IF (analysis complete AND specification compliant):
    → Proceed to Implementation Phase
ELSE IF (minor clarifications possible):
    → Auto-resolve using patterns from specification
ELSE:
    → Pause for human review and guidance
```

**Sub-Phase 2B: Implementation Execution**
```
Launch IMPLEMENTATION AGENT for current item:
- Approved requirements and approach
- Complete specification and quality standards
- Templates and established patterns
- Integration requirements and touchpoints

VALIDATION GATE:
- All required deliverables created
- Specification compliance verified
- Integration touchpoints connected
- Quality standards maintained

DECISION LOGIC:
IF (implementation complete AND standards met):
    → Proceed to Quality Audit Phase
ELSE IF (fixable issues identified):
    → Auto-implement corrections using specification
ELSE:
    → Pause for human review and correction
```

**Sub-Phase 2C: Quality Audit & Validation**
```
Launch AUDIT AGENT for current item:
- Complete implementation deliverables
- Specification compliance requirements
- Quality standards and success criteria
- Sequential thinking for thorough analysis

VALIDATION GATE:
- All specification requirements verified
- Quality checklist fully compliant
- No critical violations or gaps
- Professional standards maintained

DECISION LOGIC:
IF (audit passes AND no violations):
    → Mark item complete, proceed to next item
ELSE IF (violations can be auto-corrected):
    → Implement fixes and re-audit
ELSE:
    → Pause for human review and resolution
```

**PHASE 3: COMPLETION & QUALITY ASSURANCE**

**Sequential Progress Management:**
- Track completion status for each processed item
- Maintain quality consistency across all items
- Provide detailed progress reporting
- Enable human oversight at any stage

**Final Validation:**
- Comprehensive review of all completed items
- Integration testing across related items
- Quality consistency verification
- Success criteria validation

**SUCCESS CRITERIA:**
- All specified items completed according to volley specification
- 100% compliance with quality standards throughout
- Proper integration and connectivity validated
- Comprehensive documentation and progress logs