#!/usr/bin/env python3
"""
SecuBox WAF Rules Loader
Dynamically loads threat detection patterns from JSON config
Supports modular enable/disable per category
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

WAF_RULES_FILE = "/data/waf-rules.json"
WAF_CONFIG_FILE = "/data/waf-config.json"

class WafRulesLoader:
    def __init__(self):
        self.rules: Dict = {}
        self.compiled_patterns: Dict[str, List[Tuple[str, re.Pattern, str, str]]] = {}
        self.enabled_categories: set = set()
        self.load_rules()
    
    def load_rules(self):
        """Load rules from JSON file"""
        try:
            if os.path.exists(WAF_RULES_FILE):
                with open(WAF_RULES_FILE, "r") as f:
                    self.rules = json.load(f)
        except Exception as e:
            print(f"[WAF] Error loading rules: {e}")
            self.rules = {"categories": {}}
        
        # Load enabled categories from config
        self.load_config()
        
        # Compile patterns
        self.compile_patterns()
    
    def load_config(self):
        """Load enabled categories from config file"""
        self.enabled_categories = set()
        try:
            if os.path.exists(WAF_CONFIG_FILE):
                with open(WAF_CONFIG_FILE, "r") as f:
                    config = json.load(f)
                    for cat, enabled in config.get("categories", {}).items():
                        if enabled:
                            self.enabled_categories.add(cat)
            else:
                # Default: enable all categories
                for cat in self.rules.get("categories", {}).keys():
                    self.enabled_categories.add(cat)
        except Exception as e:
            print(f"[WAF] Error loading config: {e}")
            # Enable all on error
            for cat in self.rules.get("categories", {}).keys():
                self.enabled_categories.add(cat)
    
    def compile_patterns(self):
        """Compile regex patterns for enabled categories"""
        self.compiled_patterns = {}
        
        for cat_id, cat_data in self.rules.get("categories", {}).items():
            if cat_id not in self.enabled_categories:
                continue
            
            if not cat_data.get("enabled", True):
                continue
            
            self.compiled_patterns[cat_id] = []
            severity = cat_data.get("severity", "medium")
            
            for rule in cat_data.get("patterns", []):
                try:
                    pattern = re.compile(rule["pattern"], re.IGNORECASE)
                    rule_id = rule.get("id", "unknown")
                    desc = rule.get("desc", "")
                    cve = rule.get("cve", "")
                    self.compiled_patterns[cat_id].append((rule_id, pattern, desc, severity, cve))
                except re.error as e:
                    print(f"[WAF] Invalid pattern {rule.get(id)}: {e}")
    
    def check_request(self, path: str, query: str, body: str, headers: dict) -> Optional[dict]:
        """Check request against all enabled rules"""
        # Combine path, query and body for checking
        full_url = f"{path}?{query}" if query else path
        check_targets = {
            "url": full_url,
            "body": body,
            "user-agent": headers.get("user-agent", "")
        }
        
        for cat_id, patterns in self.compiled_patterns.items():
            for rule_id, pattern, desc, severity, cve in patterns:
                # Check appropriate target based on rule
                for target_name, target_value in check_targets.items():
                    if target_value and pattern.search(target_value):
                        return {
                            "matched": True,
                            "category": cat_id,
                            "rule_id": rule_id,
                            "description": desc,
                            "severity": severity,
                            "cve": cve,
                            "pattern": pattern.pattern,
                            "target": target_name
                        }
        
        return None
    
    def get_stats(self) -> dict:
        """Get rule statistics"""
        total_rules = 0
        categories = []
        for cat_id, patterns in self.compiled_patterns.items():
            total_rules += len(patterns)
            cat_data = self.rules.get("categories", {}).get(cat_id, {})
            categories.append({
                "id": cat_id,
                "name": cat_data.get("name", cat_id),
                "rules": len(patterns),
                "severity": cat_data.get("severity", "medium")
            })
        
        return {
            "total_rules": total_rules,
            "enabled_categories": len(self.compiled_patterns),
            "categories": categories
        }

# Global instance
waf_loader = WafRulesLoader()

def check_threat(path: str, query: str = "", body: str = "", headers: dict = None) -> Optional[dict]:
    """Convenience function for threat checking"""
    return waf_loader.check_request(path, query, body, headers or {})

def reload_rules():
    """Reload rules from disk"""
    waf_loader.load_rules()

def get_waf_stats() -> dict:
    """Get WAF statistics"""
    return waf_loader.get_stats()
