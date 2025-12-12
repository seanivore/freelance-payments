# Claude Code SPEC: Mao Documentation Gathering Project
> Use the documentation batch grouping files to systematically gather information from the codebase and create technical documentation.

## High-Level Objective

Create comprehensive technical documentation for the Mao v4 modular agent orchestrator using the predefined batch grouping files as questionnaires.

## Mid-Level Objective

- Read each batch grouping file in `./documentation/FILE_BATCH_DEFINITIONS/...`
- Answer the questions for each file listed in the batch
- Save the gathered information as organized documentation
- Focus on LOCAL terminal application architecture; read `/ARCHITECTURE_PRINCIPLES.md` first

## Implementation Notes

- **CRITICAL**: Mao is a LOCAL ONLY terminal application like Claude Code; read `/ARCHITECTURE_PRINCIPLES.md` first
- This is documentation gathering, NOT code modification 
- Only on limited files will you be asked to provide code that is not already in the codebase; e.g. 'UI interface patterns'
- Each batch file contains specific questions to answer about the listed files
- For each file, please copy the questionaire and insert your responses below each question or prompt 
- Save documentation in `/documentation/GATHERED_INFO/...` directory
- Each file should have its own copy of the questionaire 
- Name the file as as the batch number followed by the name of the file without its extension 
- E.g. 'CORE_SYSTEM_ARCHITECTURE_BATCH_01_FILE_NAME.md'; do this for every file in every batch 

## Context

### Beginning context
- 6 batch grouping files exist in `/documentation/FILE_BATCH_DEFINITIONS/...`
- Complete, audited, Mao v4 codebase ready for documentation
- Architecture principles document emphasizing LOCAL application

### Ending context 
- Comprehensive technical documentation saved in organized files
- All batch grouping questions answered with real codebase information
- When pulling code, only pull from codebase files; old, outdated implementation files exist  

## Tasks

### **Phase 1: Foundation (Sequential)**

**Task 1: Read Architecture Principles**
- Read `/ARCHITECTURE_PRINCIPLES.md` 
- Understand LOCAL terminal application concept
- Save: No output needed, just understanding

**Task 2: Core System Architecture** (25 files)
- Use `./documentation/FILE_BATCH_DEFINITIONS/CORE_SYSTEM_ARCHITECTURE.md` as questionnaire
- Answer questions for all files listed in the batches
  - Batch 01: Root Files (1 file)
  - Batch 02: Interfaces (1 file)
  - Batch 03: Orchestrator Core (12 files)
  - Batch 04: Orchestrator Managers (9 files)
  - Batch 05: Cache System (2 files) 
- Save: `/documentation/GATHERED_INFO/CORE_SYSTEM_ARCHITECTURE_BATCH_01_FILE_NAME.md`
  - 25 total deliverables for 'Task 2, Batches 1-5'

### **Phase 2: Modules (Parallel)**

**Task 3: Tools Ecosystem** (45 files)
- Use `/documentation/FILE_BATCH_DEFINITIONS/TOOLS_ECOSYSTEM.md` as questionnaire
- Answer questions for all files listed in the batch 
  - Batch 06: Search Tools (8 files)
  - Batch 07: Web Search Tools (4 files)
  - Batch 08: Content Creation Tools (8 files)
  - Batch 09: Development Tools (12 files)
  - Batch 10: System Tools (13 files)
- Save: `/documentation/GATHERED_INFO/TOOLS_ECOSYSTEM_BATCH_06_FILE_NAME.md`
  - 45 total deliverables for 'Task 3, Batches 6-10'

**Task 4: CLI Command System** (94 files)
- Use `/documentation/FILE_BATCH_DEFINITIONS/CLI_COMMAND_SYSTEM.md` as questionnaire  
- Answer questions for all files listed in the batch 
  - Batch 11: CLI Commands Group 1 (12 files)
  - Batch 12: CLI Commands Group 2 (12 files)
  - Batch 13: CLI Commands Group 3 (12 files)
  - Batch 14: CLI Commands Group 4 (12 files)
  - Batch 15: CLI Commands Group 5 (12 files)
  - Batch 16: CLI Commands Group 6 (12 files)
  - Batch 17: CLI Commands Group 7 (12 files)
  - Batch 18: CLI Commands Group 8 - JSON Only (10 files)
- Save: `/documentation/GATHERED_INFO/CLI_COMMAND_SYSTEM_BATCH_11_FILE_NAME.md`
  - 94 total deliverables for 'Task 4, Batches 11-18'

**Task 5: Configuration Management** (37 files)
- Use `/documentation/FILE_BATCH_DEFINITIONS/CONFIGURATION_MANAGEMENT.md` as questionnaire
- Answer questions for all files listed in the batch 
  - Batch 19: Models & Providers Configuration (13 files)
  - Batch 20: Settings & System Configuration (14 files)
  - Batch 21: User & Workflow Configuration (10 files)
- Save: `/documentation/GATHERED_INFO/CONFIGURATION_MANAGEMENT_BATCH_19_FILE_NAME.md`
  - 37 total deliverables for 'Task 5, Batches 19-21'

**Task 6: Templates and Scripts** (31 files)
- Use `/documentation/FILE_BATCH_DEFINITIONS/TEMPLATES_AND_SCRIPTS.md` as questionnaire
- Answer questions for all files listed in the batch 
  - Batch 22: Templates System (13 files)
  - Batch 23: Utility Scripts (14 files)
  - Batch 24: Workflow & GitHub Scripts (4 files)
- Save: `/documentation/GATHERED_INFO/TEMPLATES_AND_SCRIPTS_BATCH_22_FILE_NAME.md`
  - 31 total deliverables for 'Task 6, Batches 22-24'

### **Phase 3: Integration (Sequential)**

**Task 7: UI Integration Requirements** (41 files)
- Use `/documentation/FILE_BATCH_DEFINITIONS/UI_TYPESCRIPT_INTEGRATION.md` as questionnaire
- Focus on LOCAL subprocess communication patterns
  - Pythong terminal interface `./interfaces/ui_terminal.py` (1 file)
  - CLI `ui_*.py` files (29 files)
  - Tools `ui_*.py` files (11 files)
- Save: `/documentation/GATHERED_INFO/UI_TYPESCRIPT_INTEGRATION_FILE_NAME.md`
  - 41 total deliverables for 'Task 7'

### **Phase 4: Architecture Documentation**

**Task 8: Create Technical Architecture Sections**

Create comprehensive architecture sections, one document for each of the 6 categories, using gathered documentation to provide code snippets, patterns, and technical implementation guidance following Anthropic documentation style (60-80% written content, 10-20% bullet points, 20-40% code examples).

**Architecture Pattern Categories:**

1. **Architecture Overview** (LOCAL app patterns, subprocess communication)
2. **Core System Patterns** (orchestration, state management, caching) 
3. **Tool Integration Patterns** (discovery, generation, execution)
4. **Configuration & Data Patterns** (JSON configs, memory systems, analytics)
5. **User Interface Patterns** (CLI design, terminal UI, workflow UX)
6. **Extension & Automation Patterns** (adding tools/models, business automation)

**Implementation Approach:**

- Use gathered information from Tasks 1-7 to extract representative code examples for each pattern category
- Focus on practical implementation guidance rather than exhaustive code documentation
- Integrate architecture sections into existing narrative documentation where marked
- Provide entry-level accessible technical content with clear code examples
- Demonstrate modular architecture principles through concrete patterns

**Deliverables:**

- **6 comprehensive architecture pattern sections** (one for each category) with 3-5 representative code examples per pattern
- **Architecture integration for all 10 documentation files** (00-09) where narrative content has designated architecture insertion points
- **Implementation guidance covering 80%+ of core system functionality** through practical code snippets and patterns rather than exhaustive file-by-file documentation
- **Complete pattern coverage** demonstrating modular architecture principles across all major system components (orchestration, tools, CLI, configuration, UI, extensions)
- **Entry-level technical documentation** that maintains 60-80% written content, 10-20% bullet points, 20-40% code ratio throughout

* Please create the directory and save them in: `/documentation/ARCHITECTURE_SECTIONS/...` using the following file names: 

- ARCH_01_Architecture_Overview.md
- ARCH_02_Core_System_Patterns.md
- ARCH_03_Tool_Integration_Patterns.md
- ARCH_04_Configuration_Data_Patterns.md
- ARCH_05_User_Interface_Patterns.md
- ARCH_06_Extension_Automation_Patterns.md

**Coverage Goal:** Provide sufficient technical depth that developers can understand and extend any aspect of the Mao system using the documented patterns, while keeping content accessible and practical rather than overwhelming.

**Dependencies:**
- Requires completion of Tasks 1-7 (all gathered documentation)
- Integrates with existing documentation structure and narrative content

---