# Agent Instructions

This project no longer relies on external n8n webhook analysis workflows for the core intelligence features (like Hunter's Board). Avoid using n8n for multimodal document analysis, as this is now handled natively via the `@google/genai` SDK in the backend routes (e.g. `app/api/analyze/route.ts`).
