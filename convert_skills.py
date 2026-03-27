#!/usr/bin/env python3
import os
import re
import yaml
import shutil

SOURCE_DIR = "Anthropic-Cybersecurity-Skills/skills"
OUTPUT_DIR = ".agents/skills/cybersecurity"


def convert_skill(skill_name):
    source_path = os.path.join(SOURCE_DIR, skill_name)
    skill_md_path = os.path.join(source_path, "SKILL.md")

    if not os.path.exists(skill_md_path):
        return False

    # Read original SKILL.md
    with open(skill_md_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract frontmatter
    frontmatter_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)

    if frontmatter_match:
        frontmatter_text = frontmatter_match.group(1)
        try:
            frontmatter = yaml.safe_load(frontmatter_text)
        except:
            frontmatter = {}

        # Get description from frontmatter
        description = frontmatter.get("description", "")
        if isinstance(description, str):
            description = description.strip()
            # Clean up multiline description
            description = " ".join(description.split())[:200]

        # Get author and version
        author = frontmatter.get("author", "community")
        version = frontmatter.get("version", "1.0")
        domain = frontmatter.get("domain", "cybersecurity")
        subdomain = frontmatter.get("subdomain", "")
        tags = frontmatter.get("tags", [])

        # Create new frontmatter for opencode
        new_frontmatter = {
            "name": skill_name.replace("-", "-"),
            "description": f"{description[:180]}..."
            if len(description) > 180
            else description,
            "metadata": {
                "author": author,
                "version": version,
                "domain": domain,
                "subdomain": subdomain,
                "tags": tags[:5],  # Limit tags
            },
            "risk": "high",
            "source": "community",
        }

        # Extract main content (after frontmatter)
        main_content = content[frontmatter_match.end() :].strip()

        # Create new SKILL.md for opencode
        new_content = f"""---
name: {skill_name}
description: {description[:200]}
metadata:
  author: {author}
  version: "{version}"
  domain: cybersecurity
  subdomain: {subdomain}
  tags: {tags[:5]}
risk: high
source: community
---

{main_content}
"""

        # Create output directory
        output_path = os.path.join(OUTPUT_DIR, skill_name)
        os.makedirs(output_path, exist_ok=True)

        # Write new SKILL.md
        with open(os.path.join(output_path, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write(new_content)

        # Copy references if exists
        refs_dir = os.path.join(source_path, "references")
        if os.path.exists(refs_dir):
            shutil.copytree(
                refs_dir, os.path.join(output_path, "references"), dirs_exist_ok=True
            )

        # Copy scripts if exists
        scripts_dir = os.path.join(source_path, "scripts")
        if os.path.exists(scripts_dir):
            shutil.copytree(
                scripts_dir, os.path.join(output_path, "scripts"), dirs_exist_ok=True
            )

        return True
    return False


# Get all skills
skills = sorted(os.listdir(SOURCE_DIR))
print(f"Found {len(skills)} skills")

# Convert each skill
converted = 0
for i, skill in enumerate(skills):
    if convert_skill(skill):
        converted += 1
        if (i + 1) % 100 == 0:
            print(f"Converted {i + 1} skills...")

print(f"\nSuccessfully converted {converted} skills to {OUTPUT_DIR}")
