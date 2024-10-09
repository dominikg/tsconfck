---
'tsconfck': patch
---

fix(glob-matching): add implicit **/\* to path patterns that do not have an extension or wildcard in their last segment, eg `src` becomes `src/**/\*` for matching.
