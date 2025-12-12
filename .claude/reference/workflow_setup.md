# Claude Code Workflow Setup Guide

**For Building Reusable Automation Workflows**

---

## The Golden Pattern: Workflow Commands + SPEC Files

### **The Common Mistake (Don't Do This):**
❌ Creating workflow commands with hardcoded, project-specific logic  
❌ Mixing general workflow patterns with specific implementation details  
❌ Building commands that only work for one use case  
❌ Overcomplicating argument structures  

### **The Correct Pattern (Do This):**
✅ **Reusable Workflow Commands** - Generic, adaptable automation patterns  
✅ **Specific SPEC Files** - Detailed instructions for applying workflows to specific projects  
✅ **Clean Argument Structure** - Simple, clear inputs that make sense  
✅ **Modular Architecture** - Components that can be reused across different projects  

---

## File Structure & Organization

### **Workflow Commands** (Save to `.claude/commands/`)
These are your **reusable automation engines**:
- Generic workflow patterns (like `dual_spec.md`, `multistage.md`)
- Take SPEC files as arguments
- Adaptable to different projects and use cases
- Follow established Claude Code command patterns

### **SPEC Files** (Save anywhere in project)
These are your **specific implementation instructions**:
- Detailed requirements for a particular use case
- Project-specific logic and patterns
- Quality standards and success criteria
- Integration requirements and touchpoints

### **Documentation** (Save to `.claude/ai-docs/`)
- Setup guides and patterns
- Examples and usage instructions
- Common pitfalls and solutions

---

## The Architecture Pattern

### **1. Workflow Command Structure**

```markdown
**WORKFLOW NAME COMMAND**

Brief description of what this workflow automates.

**Variables:**
spec_file: $ARGUMENTS
additional_params: $ARGUMENTS

**ARGUMENTS PARSING:**
1. `spec_file` - Path to specification file defining requirements
2. `additional_params` - Configuration options for this execution

**PHASE 1: SPECIFICATION ANALYSIS**
- Read and understand the SPEC file
- Extract requirements and patterns
- Plan execution strategy

**PHASE 2: EXECUTION**
- Implement the workflow logic
- Apply patterns from SPEC file
- Maintain quality standards

**PHASE 3: VALIDATION**
- Verify compliance with SPEC requirements
- Quality assurance and testing
- Final reporting and documentation
```

### **2. SPEC File Structure**

```markdown
**PROJECT WORKFLOW SPECIFICATION**

**Process Overview:**
- Source documents and requirements
- Quality standards and compliance rules
- Reference patterns and examples

**Phase Definitions:**
- What each phase accomplishes
- Validation criteria for each step
- Success metrics and quality gates

**Implementation Details:**
- File structures and naming conventions
- Integration requirements
- Quality standards and compliance rules

**Usage Examples:**
- Command line examples
- Expected inputs and outputs
- Testing and validation approaches
```

---

## Common Workflow Types & Examples

### **Sequential Processing Workflows**
Perfect for:
- Testing and validation
- Single-item processing
- Step-by-step implementation
- Quality-critical workflows

**Example Pattern:**
```bash
claude > /project:sequential_workflow ./project_spec.md item_identifier
```

### **Parallel Processing Workflows**
Perfect for:
- Batch processing multiple items
- Time-sensitive implementations
- Large-scale automation
- Efficiency-focused workflows

**Example Pattern:**
```bash
claude > /project:parallel_workflow ./project_spec.md item_range batch_size
```

### **Dual-Phase Workflows**
Perfect for:
- Foundation + enhancement patterns
- Two-stage implementations
- Dependencies between phases

**Example Pattern:**
```bash
claude > /project:dual_workflow ./foundation_spec.md ./advanced_spec.md
```

---

## Building New Workflows: Step-by-Step

### **Step 1: Identify the Pattern**
- What type of automation do you need?
- Is this a one-time use or reusable pattern?
- What are the key phases and validation points?
- How complex is the coordination required?

### **Step 2: Design the Workflow Command**
- **Keep it generic and reusable**
- Follow established Claude Code patterns
- Use clear, simple argument structures
- Focus on the automation logic, not project specifics

### **Step 3: Create the SPEC File**
- **Make it project-specific and detailed**
- Include all requirements and quality standards
- Provide clear examples and patterns
- Define success criteria and validation methods

### **Step 4: Test and Iterate**
- Start with simple test cases
- Validate the workflow logic works correctly
- Refine SPEC file based on results
- Scale up to full implementation

---

## Arguments & Execution Patterns

### **Claude Code Command Mechanics**

**How Commands Work:**
1. Command file saved to `.claude/commands/filename.md`
2. Executed in Claude Code with `/project:filename arg1 arg2`
3. Arguments replace `$ARGUMENTS` variables in the command
4. Command reads SPEC files and executes workflow

**Argument Parsing Pattern:**
```markdown
**Variables:**
spec_file: $ARGUMENTS
config_option: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `spec_file` - Path to specification file
2. `config_option` - Configuration parameter
```

### **Execution Examples**

**Sequential Processing:**
```bash
# Test single item
claude > /project:sequential_volley ./my_project_spec.md item_4

# Process specific items
claude > /project:sequential_volley ./my_project_spec.md 4,5,6
```

**Parallel Processing:**
```bash
# Process with 3 parallel agents
claude > /project:parallel_volley ./my_project_spec.md 4-24 3

# Maximum parallelization
claude > /project:parallel_volley ./my_project_spec.md 4-24 5
```

---

## Quality Assurance & Best Practices

### **Workflow Command Best Practices**
- **Stay Generic**: Don't hardcode project-specific details
- **Clear Phases**: Define distinct phases with validation gates
- **Error Handling**: Include intelligent error recovery and human escalation
- **Documentation**: Comprehensive logging and progress reporting
- **Modularity**: Design for reuse across different projects

### **SPEC File Best Practices**
- **Be Specific**: Include all project-specific requirements and patterns
- **Quality Standards**: Define clear compliance and validation criteria
- **Examples**: Provide concrete examples and reference patterns
- **Success Metrics**: Clear definition of what constitutes completion
- **Integration Details**: Specific touchpoints and system connections

### **Testing Strategy**
1. **Start Small**: Test with single items or simple cases first
2. **Validate Quality**: Ensure output meets all standards and requirements
3. **Iterate**: Refine workflow and SPEC based on initial results
4. **Scale Gradually**: Increase scope once validation is successful
5. **Monitor**: Comprehensive logging and human oversight throughout

---

## Common Pitfalls & Solutions

### **Pitfall #1: Mixing Workflow and SPEC Logic**
**Problem**: Putting project-specific details in the workflow command  
**Solution**: Keep workflows generic, put specifics in SPEC files

### **Pitfall #2: Overcomplicating Arguments**
**Problem**: Too many arguments or complex parsing logic  
**Solution**: Use simple, clear argument patterns that match Claude Code conventions

### **Pitfall #3: Not Testing Small First**
**Problem**: Jumping straight to full-scale automation  
**Solution**: Always test with single items or small batches first

### **Pitfall #4: Insufficient Quality Gates**
**Problem**: Automation proceeds without proper validation  
**Solution**: Build in comprehensive validation and human escalation points

### **Pitfall #5: Poor Documentation**
**Problem**: Hard to understand or reuse workflows later  
**Solution**: Comprehensive documentation in both workflow commands and SPEC files

---

## Integration with Existing Systems

### **Claude Code Integration**
- Save workflow commands to `.claude/commands/` directory
- Use established Claude Code argument patterns
- Leverage existing Claude Code infrastructure and capabilities

### **Project Documentation**
- Save SPEC files in logical project locations
- Reference existing project documentation and standards
- Maintain consistency with established patterns and practices

### **Quality Standards**
- Integrate with existing quality assurance processes
- Reference established coding standards and compliance requirements
- Maintain professional quality throughout automation

---

## Future Expansion & Reusability

### **Building a Workflow Library**
- Create a collection of reusable workflow patterns
- Document common use cases and applications
- Share workflows across different projects and teams

### **Extending Existing Workflows**
- Modify SPEC files for new use cases
- Adapt workflows for different project types
- Build on successful patterns and approaches

### **Continuous Improvement**
- Learn from each implementation
- Refine workflows based on experience
- Document lessons learned and best practices

---

## Summary: The Golden Rules

1. **Workflows = Reusable Tools**: Generic automation patterns that work across projects
2. **SPECs = Specific Instructions**: Detailed requirements for particular use cases
3. **Simple Arguments**: Clear, straightforward input patterns that make sense
4. **Test Small First**: Always validate with simple cases before scaling
5. **Quality Gates**: Build in comprehensive validation and human oversight
6. **Document Everything**: Clear documentation for both workflows and SPECs
7. **Stay Modular**: Design for reuse and extension across different projects

**Remember**: The goal is to create automation that saves time while maintaining quality, and workflows that can be reused for future projects with different SPEC files.

---

*This guide represents the established pattern for building effective Claude Code automation workflows. Following these principles will create robust, reusable automation that scales effectively while maintaining professional quality standards.*