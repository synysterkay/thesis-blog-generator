import json

with open('/Volumes/Flow/thesis-blog-generator/posts/index.json', 'r') as f:
    data = json.load(f)

new_post = {
    "slug": "thesis-writing-tips-guide-strategies",
    "title": "Master Thesis Writing: Expert Tips for Academic Success",
    "excerpt": "Comprehensive guide with actionable thesis writing tips for graduate students. Learn structure, research methods, and writing strategies for academic success.",
    "description": "Discover proven thesis writing tips to streamline your research process. Learn practical strategies for structure, research, and writing success.",
    "date": "2026-01-31",
    "publishedAt": "2026-01-31T20:05:41.560Z",
    "author": "Thesis Generator Research Team",
    "category": "Guides",
    "tags": ["thesis writing", "academic writing", "research methodology", "graduate studies", "dissertation help"],
    "keywords": ["thesis writing tips", "dissertation writing", "academic research", "graduate writing", "research methodology"],
    "image": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
    "readTime": "12 min read",
    "featured": False,
    "filename": "2026-01-31-thesis-writing-tips-expert-guide.mdx"
}

data.append(new_post)

with open('/Volumes/Flow/thesis-blog-generator/posts/index.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Updated index.json now has {len(data)} posts")
