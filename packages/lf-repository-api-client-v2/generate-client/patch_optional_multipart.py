#!/usr/bin/env python3
"""
Post-nswag patch: rewrite nswag's hard-coded null-throw checks for multipart
form-data parameters that the swagger marks as optional.

nswag always emits
    if (x === null || x === undefined)
        throw new Error("The parameter 'x' cannot be null.");
    else
        <append to FormData>;
for every multipart property, ignoring the swagger's `required` list. For
parameters the server accepts as absent (e.g. imageFiles, optional request
payloads), this turns a legitimate omission into a client-side crash. The
script rewrites each such block into
    if (x !== null && x !== undefined)
        <append to FormData>;
for parameters whose operationId's multipart schema does NOT list them as
required. Required parameters are left alone so that callers still see the
throw when they forget a mandatory field.

Idempotent. Reads swagger.json + index.ts next to this file and rewrites
index.ts in place.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SWAGGER = HERE / "swagger.json"
INDEX_TS = HERE.parent / "index.ts"


def load_optional_multipart_params(swagger_path):
    with swagger_path.open() as f:
        spec_doc = json.load(f)
    out = {}
    for path_item in spec_doc.get("paths", {}).values():
        for verb_spec in path_item.values():
            if not isinstance(verb_spec, dict):
                continue
            op_id = verb_spec.get("operationId")
            if not op_id:
                continue
            rb = verb_spec.get("requestBody", {})
            for ct, media in rb.get("content", {}).items():
                if "multipart" not in ct:
                    continue
                schema = media.get("schema", {})
                required = set(schema.get("required", []))
                props = set(schema.get("properties", {}).keys())
                optional = props - required
                if optional:
                    out[op_id] = optional
    return out


# Match nswag's null-throw block on a single multipart param:
#     if (NAME === null || NAME === undefined)
#         throw new Error("The parameter 'NAME' cannot be null.");
#     else
#         <one-line body>;
NULL_CHECK = re.compile(
    r"^(?P<indent>[ \t]+)if \((?P<name>\w+) === null \|\| (?P=name) === undefined\)\n"
    r"[ \t]+throw new Error\(\"The parameter '(?P=name)' cannot be null\.\"\);\n"
    r"[ \t]+else\n"
    r"(?P<body_indent>[ \t]+)(?P<body>[^\n]+;)",
    re.MULTILINE,
)

# Match TypeScript method signatures so we can attribute each null-check to
# its enclosing method. Signatures appear on a single line and end with "{".
METHOD_SIG = re.compile(
    r"^[ \t]+(?P<name>\w+)\(args:.*\): Promise<[^>]+>\s*\{\s*$", re.MULTILINE
)


def method_name_to_op_id(method_name, op_ids):
    """TS method name is camelCase of the operationId (e.g. ImportEntry -> importEntry)."""
    for op_id in op_ids:
        if op_id and op_id[0].lower() + op_id[1:] == method_name:
            return op_id
    return None


def enclosing_method(src, pos):
    last = None
    for m in METHOD_SIG.finditer(src):
        if m.start() > pos:
            break
        last = m
    return last.group("name") if last else None


def patch(src, optional_map):
    op_ids = list(optional_map.keys())
    patched = 0

    def replace(match):
        nonlocal patched
        param = match.group("name")
        method = enclosing_method(src, match.start())
        if method is None:
            return match.group(0)
        op_id = method_name_to_op_id(method, op_ids)
        if op_id is None or param not in optional_map.get(op_id, set()):
            return match.group(0)
        indent = match.group("indent")
        body = match.group("body")
        patched += 1
        return f"{indent}if ({param} !== null && {param} !== undefined)\n{indent}    {body}"

    return NULL_CHECK.sub(replace, src), patched


def main():
    if not SWAGGER.exists():
        print(f"[patch_optional_multipart] {SWAGGER} not found; skipping", file=sys.stderr)
        return 0
    if not INDEX_TS.exists():
        print(f"[patch_optional_multipart] {INDEX_TS} not found; skipping", file=sys.stderr)
        return 0

    optional_map = load_optional_multipart_params(SWAGGER)
    if not optional_map:
        print("[patch_optional_multipart] no optional multipart params in swagger")
        return 0

    src = INDEX_TS.read_text(encoding="utf-8")
    new_src, patched = patch(src, optional_map)
    if patched == 0:
        print("[patch_optional_multipart] no null-check blocks rewritten (already patched or nothing to patch)")
    else:
        INDEX_TS.write_text(new_src, encoding="utf-8")
        ops = ", ".join(sorted(optional_map))
        print(f"[patch_optional_multipart] rewrote {patched} null-check(s) across operations: {ops}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
