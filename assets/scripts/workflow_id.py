"""
Workflow ID CLI Command - Core Logic
Generates unique workflow IDs for workflow setup flow with workflow manager integration
"""

import json
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

# Standard MAO imports
from orchestrator.cache.cache_system import CacheManager
from orchestrator.error_handling import handle_errors, retry_with_backoff, APIError
from orchestrator.workflow_manager import WorkflowManager
from orchestrator.workflow_state import WorkflowStateManager
from orchestrator.memory_mcp import MemoryMCPManager

# Standard cache instance
cache = CacheManager()

@handle_errors(operation_name="workflow_id", return_dict=True)
def execute_workflow_id(params: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Main workflow_id command execution with caching and error handling.
    Generates unique workflow IDs as part of workflow setup flow.
    
    Args:
        params: Command parameters from CLI / app input
        
    Returns:
        Standardized result dictionary with workflow ID data
    """
    # Parse parameters
    with_explanation = params.get("explain", False) if params else False
    
    # Check cache first (short-lived cache for ID generation)
    cache_key = _generate_cache_key(params)
    cached_result = cache.get_cached_analysis(cache_key, "workflow_id")
    if cached_result:
        return json.loads(cached_result)
    
    # Execute command logic
    result = _execute_command_logic(params, with_explanation)
    
    # Cache result for 1 minute (workflow IDs should be fresh)
    cache.cache_content_analysis(cache_key, json.dumps(result), "workflow_id")
    
    return result

def estimate_cost(params: Dict[str, Any] = None) -> float:
    """
    Estimate operation cost for budget planning.
    Uses Claude Sonnet 4 cost structure.
    """
    base_cost = 0.002  # Medium complexity manager integration command
    
    # Add cost for explanation if requested
    if params and params.get("explain", False):
        base_cost += 0.0005  # Additional cost for mathematical explanation
    
    return base_cost

def _generate_cache_key(params: Dict[str, Any] = None) -> str:
    """Generate fingerprinted cache key for workflow ID operations"""
    base_key = f"workflow_id|{str(params) if params else 'none'}"
    
    # Add timestamp component for cache invalidation (workflow IDs should be unique)
    timestamp_component = str(int(datetime.now().timestamp()))
    base_key += f"|ts:{timestamp_component}"
    
    return hashlib.md5(base_key.encode()).hexdigest()[:16]

def _execute_command_logic(params: Dict[str, Any] = None, with_explanation: bool = False) -> Dict[str, Any]:
    """Core workflow_id command logic implementation"""
    try:
        # Initialize workflow manager
        workflow_manager = WorkflowManager()
        
        # Generate workflow ID using workflow manager
        id_result = workflow_manager.generate_workflow_id(with_explanation=with_explanation)
        
        if not id_result.get("success"):
            return {
                "success": False,
                "error": "Failed to generate workflow ID via WorkflowManager",
                "timestamp": datetime.now().isoformat()
            }
        
        # Prepare result data
        result_data = {
            "success": True,
            "workflow_id": id_result.get("workflow_id"),
            "generation_method": "workflow_manager",
            "timestamp": datetime.now().isoformat(),
            "ready_for_workflow_setup": True
        }
        
        # Add explanation if requested
        if with_explanation and "explanation" in id_result:
            result_data["explanation"] = id_result["explanation"]
            result_data["mathematical_details"] = True
        
        # Optional: Initialize workflow context in memory MCP
        try:
            memory_manager = MemoryMCPManager()
            context_id = memory_manager.create_workflow_context(
                workflow_id=id_result.get("workflow_id"),
                user_goal="Workflow setup phase - ID generated"
            )
            result_data["memory_context_created"] = True
            result_data["context_id"] = context_id
        except Exception as e:
            # Don't break workflow ID generation if memory context fails
            result_data["memory_context_created"] = False
            result_data["memory_warning"] = f"Memory context creation failed: {str(e)}"
        
        # Add workflow setup guidance
        result_data["next_steps"] = [
            "Use 'mao variables' to see required workflow variables",
            "Use this workflow_id in your workflow configuration JSON",
            "Continue with workflow setup using this unique identifier"
        ]
        
        return result_data
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to generate workflow ID: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "fallback_available": "Use 'mao workflow_id' again to retry"
        }

def _initialize_workflow_state(workflow_id: str) -> bool:
    """Initialize workflow state tracking for new workflow ID"""
    try:
        workflow_state = WorkflowStateManager()
        
        # Create initial state entry
        state_data = {
            "workflow_id": workflow_id,
            "status": "id_generated",
            "created_at": datetime.now().isoformat(),
            "setup_phase": "workflow_id_complete",
            "next_phase": "variable_definition"
        }
        
        return workflow_state.update_workflow_state(workflow_id, state_data)
    except Exception as e:
        # Don't break workflow ID generation if state tracking fails
        print(f"Warning: Workflow state initialization failed: {e}")
        return False

# Standalone function for CLI manager import
def execute_command(params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Standalone function for CLI manager routing"""
    return execute_workflow_id(params)