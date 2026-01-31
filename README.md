# Thesis Blog Generator

Automated blog post generator for ThesisAI using DeepSeek AI.

## Setup

1. Add these secrets to your GitHub repo:
   - `DEEPSEEK_API_KEY` - Your DeepSeek API key (same as Humanizewebapp)
   - `GH_PAT` - Personal Access Token with write access to `synysterkay/thesispost`

2. Create the `synysterkay/thesispost` repo with:
   ```
   posts/
   └── index.json  (start with: [])
   ```

## Usage

### Manual Trigger
Go to Actions → Generate Blog Post → Run workflow

Enter:
- **Topic**: e.g., "How to Write a Thesis Introduction"
- **Keywords**: e.g., "thesis writing, academic writing, thesis tips"
- **Style**: informative, tutorial, comparison, news, or guide

### Scheduled
Runs automatically every Monday at 9am UTC.

## Output

Posts are pushed to `synysterkay/thesispost` repo in format:
```
posts/
├── index.json
├── how-to-write-thesis-introduction.mdx
└── thesis-writing-tips-2026.mdx
```
