**PARALLEL VOLLEY EXECUTION COMMAND**

Execute systematic 3-phase volley workflow across multiple items simultaneously using coordinated parallel agents. Optimized for efficiency while maintaining quality through intelligent coordination.

**Variables:**

volley_spec: $ARGUMENTS
item_range: $ARGUMENTS
batch_size: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `volley_spec` - Path to volley specification file defining the process and requirements
2. `item_range` - Range of items to process (e.g., "4-24", "workflows,stats,config", "all_remaining")
3. `batch_size` - Number of parallel agents (default: 3, max: 5)

**PHASE 1: SPECIFICATION ANALYSIS & BATCH PLANNING**

**Deep Volley Specification Analysis:**
Read and analyze the volley specification at `volley_spec`:
- **Process Definition**: Understand the 3-phase volley pattern for parallel execution
- **Quality Standards**: Compliance requirements that must be maintained across all agents
- **Item Extraction**: How to parse and batch items from source documents
- **Coordination Requirements**: How to prevent conflicts and ensure consistency
- **Integration Patterns**: How items interconnect and dependencies

**Item Range Processing & Batching:**
Extract and organize the specified `item_range` for parallel processing:
- **Item Identification**: Parse source documents to extract all items in range
- **Batch Strategy**: Intelligently group items for parallel processing
- **Dependency Analysis**: Identify items that must be processed in sequence
- **Complexity Assessment**: Balance workload across parallel agents
- **Coordination Points**: Plan synchronization and quality checkpoints

**Parallel Execution Strategy:**
Design coordinated multi-agent approach:
- **Agent Allocation**: Distribute `batch_size` agents across item batches
- **Conflict Prevention**: Ensure agents work on distinct, non-overlapping items
- **Quality Coordination**: Maintain consistency across parallel workstreams
- **Progress Synchronization**: Coordinate timing and handoffs between phases

**PHASE 2: COORDINATED PARALLEL EXECUTION**

**Batch Distribution & Agent Launch:**
```
FOR each batch of items (up to batch_size parallel agents):
    
    Launch PARALLEL AGENT with:
    - Complete volley specification context
    - Assigned batch of items (non-overlapping)
    - Quality standards and consistency requirements
    - Coordination protocols with other agents
    
    Agent executes full 3-phase volley for assigned items:
    - Phase 1: Requirements analysis for all items in batch
    - Phase 2: Implementation of all items in batch
    - Phase 3: Quality audit of all items in batch
```

**Inter-Agent Coordination:**
- **Progress Monitoring**: Track completion across all parallel agents
- **Quality Synchronization**: Ensure consistent standards across agents
- **Conflict Resolution**: Handle any overlaps or dependencies
- **Resource Management**: Coordinate shared resources and touchpoints

**Dynamic Load Balancing:**
- **Progress Assessment**: Monitor agent performance and adjust if needed
- **Batch Reallocation**: Redistribute items if agents encounter blockers
- **Quality Gates**: Pause coordination if any agent fails validation
- **Intelligent Scaling**: Adjust parallel execution based on complexity

**PHASE 3: CONSOLIDATION & COMPREHENSIVE QA**

**Parallel Work Integration:**
```
Launch INTEGRATION AGENT with:
- Complete deliverables from all parallel agents
- Specification requirements for integration
- Quality standards for unified system
- Cross-batch consistency validation

Integration Tasks:
- Consolidate all parallel work into unified system
- Verify integration touchpoints across all items
- Test system-wide functionality and connectivity
- Ensure professional quality maintained throughout
```

**Comprehensive Quality Validation:**
- **Cross-Batch Consistency**: Verify quality standards maintained across all agents
- **Integration Testing**: Ensure all parallel work integrates properly
- **System-Wide Validation**: Test complete system functionality
- **Final Compliance Check**: Comprehensive audit against specification requirements

**Success Reporting:**
- **Completion Summary**: Detailed report of all items processed across all batches
- **Quality Metrics**: Compliance verification and consistency analysis
- **Performance Analysis**: Efficiency gains and coordination effectiveness
- **Integration Status**: Confirmation of system-wide functionality

**COORDINATION EXCELLENCE:**
- **Agent Boundary Management**: Clear, non-overlapping work assignments
- **Quality Consistency**: Uniform standards across all parallel workstreams
- **Intelligent Synchronization**: Efficient coordination without bottlenecks
- **Dynamic Adaptation**: Flexible response to complexity and changing requirements

**SUCCESS CRITERIA:**
- All items in range completed with full specification compliance
- Quality consistency maintained across all parallel workstreams
- Proper integration and system-wide functionality validated
- Significant efficiency gains while maintaining professional standards