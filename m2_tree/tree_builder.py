import json
import yaml
from typing import Dict, Any

from shared.llm_client import LLMClient
from shared.schema_validator import SchemaValidator, ValidationError

class TreeBuilderError(Exception):
    pass

class ResumeTreeBuilder:
    def __init__(self):
        self.llm = LLMClient()
        self.validator = SchemaValidator()
        self.prompt_path = "./prompts/build_tree.yaml"
        
    def _load_prompt(self, resume_json: Dict[str, Any]) -> tuple[str, str]:
        with open(self.prompt_path, 'r', encoding='utf-8') as f:
            prompt_data = yaml.safe_load(f)
            
        system = prompt_data.get('system', '')
        user_template = prompt_data.get('user_template', '')
        
        user_prompt = user_template.replace('{resume_json}', json.dumps(resume_json, indent=2))
        return system, user_prompt

    VALID_TYPES = {
        "root", "section", "experience", "project", "education", "skills",
        "certifications", "certification", "award", "awards", "publication",
        "publications", "volunteer", "summary", "contact", "achievement",
        "achievements", "activity", "activities", "language", "languages",
        "interest", "interests", "other"
    }

    def _sanitize_node(self, node: dict):
        """Recursively sanitize a tree node to ensure schema compliance."""
        if not isinstance(node, dict):
            return

        # Remap unknown types to 'other'
        if node.get("type") not in self.VALID_TYPES:
            node["type"] = "other"

        # Ensure metadata exists with all required fields
        if "metadata" not in node or not isinstance(node["metadata"], dict):
            node["metadata"] = {}
        meta = node["metadata"]
        meta.setdefault("tech_stack", [])
        meta.setdefault("career_stage", None)
        meta.setdefault("duration_months", None)
        meta.setdefault("recency", None)
        meta.setdefault("complexity", None)
        meta.setdefault("has_outcome", False)
        meta.setdefault("responsibility_level", None)

        # Fix tech_stack: must be a list of strings
        if meta["tech_stack"] is None:
            meta["tech_stack"] = []
        elif isinstance(meta["tech_stack"], str):
            meta["tech_stack"] = [meta["tech_stack"]]

        # Ensure required fields exist
        node.setdefault("node_id", f"node_{id(node)}")
        node.setdefault("title", "Untitled")
        node.setdefault("level", 1)
        node.setdefault("summary", "")
        node.setdefault("children", [])

        for child in node.get("children", []):
            self._sanitize_node(child)

    def build_tree(self, resume_json: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt, user_prompt = self._load_prompt(resume_json)
        
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                tree_json = self.llm.call_json(user_prompt, system_prompt, 0.2)
                
                # Sanitize all nodes before validation
                self._sanitize_node(tree_json)
                
                self.validator.validate(tree_json, "tree_node.json")
                return tree_json
            except ValidationError as e:
                last_error = e
                if attempt == max_retries - 1:
                    raise TreeBuilderError(f"Failed to validate tree schema after {max_retries} attempts. Last error: {str(last_error)}")

