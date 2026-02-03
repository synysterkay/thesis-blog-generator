export const PRICING_PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    interval: 'month' as const,
    popular: false,
    features: [
      '1 thesis per month',
      'Up to 3 chapters',
      '1 table & 1 chart',
      '2 reference uploads (10MB)',
      'PDF & DOCX export',
    ],
  },
  {
    id: 'monthly' as const,
    name: 'Pro Monthly',
    price: 9.99,
    interval: 'month' as const,
    popular: false,
    features: [
      'Unlimited thesis generation',
      'Unlimited chapters',
      'Unlimited tables & charts',
      '10 reference uploads (20MB)',
      'PDF, DOCX & LaTeX export',
    ],
  },
  {
    id: 'yearly' as const,
    name: 'Pro Yearly',
    price: 79.99,
    interval: 'year' as const,
    popular: true,
    savings: 'Save 33%',
    features: [
      'Everything in Pro Monthly',
      'Priority AI processing',
      'Priority support',
      'Early access to features',
      'Best value for regular users',
    ],
  },
  {
    id: 'lifetime' as const,
    name: 'Lifetime',
    price: 199.99,
    interval: 'lifetime' as const,
    popular: false,
    badge: 'Best Value',
    features: [
      'Everything forever',
      'All future features',
      'VIP support',
      'No recurring payments',
      'Priority processing',
    ],
  },
];

export const FREE_TIER_FEATURES = [
  '1 thesis per month',
  '3 chapters max',
  '1 table & 1 chart',
  '2 reference uploads',
  'PDF & DOCX export',
];

export const PAYWALL_FEATURES = [
  'Generate unlimited theses',
  'Unlimited chapters per thesis',
  'Unlimited tables & charts',
  '10 reference document uploads',
  'PDF, DOCX & LaTeX export',
];

export const TESTIMONIALS = [
  {
    quote: "Generated my 94-page master's thesis in just 28 minutes. My supervisor approved it with only minor citation edits. The humanization feature made it completely undetectable.",
    author: 'Sarah K.',
    role: 'MSc Computer Science, Stanford',
    initials: 'SK',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    quote: "The auto-generated tables actually used my research data correctly. Created 12 professional charts that my committee specifically praised. This tool paid for itself 100x over.",
    author: 'Michael R.',
    role: 'PhD Candidate, Business Analytics',
    initials: 'MR',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    quote: "Submitted my 87-page dissertation on time after struggling for 6 months. My advisor said it was one of the best-structured papers he's reviewed. Got an A with distinction.",
    author: 'Emily L.',
    role: 'Research Associate, Psychology',
    initials: 'EL',
    gradient: 'from-purple-500 to-pink-600',
  },
];

export const STATS = [
  { value: '10K+', label: 'Researchers' },
  { value: '50K+', label: 'Theses Generated' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '45M+', label: 'Words Written' },
];

export const FAQ_ITEMS = [
  {
    question: 'Will the generated content pass plagiarism checks?',
    answer: "Yes! Our AI generates 100% original content. Each thesis is uniquely created based on your specific topic and requirements. We recommend adding your own insights and citations for the best results.",
  },
  {
    question: 'Can I edit the generated content?',
    answer: "Absolutely! You have full control over every section. Edit text, regenerate specific parts, add your own content, modify tables and charts - it's your thesis to customize.",
  },
  {
    question: 'What academic fields are supported?',
    answer: 'We support all major academic fields including Computer Science, Business, Psychology, Engineering, Medicine, Law, Social Sciences, Humanities, and more. Our AI adapts its writing style to your field.',
  },
  {
    question: 'How long does generation take?',
    answer: 'A complete 90+ page thesis typically takes 20-40 minutes to generate, depending on complexity. You can watch the progress in real-time and start editing sections as they are completed.',
  },
  {
    question: 'What export formats are available?',
    answer: 'All users can export to PDF and Microsoft Word (DOCX). Pro users also get LaTeX export for academic submissions. All exports maintain proper formatting, tables, charts, and citations.',
  },
  {
    question: 'Is there a word or page limit?',
    answer: 'Pro users have no limits. Generate theses of any length with unlimited chapters. Free users can generate 1 thesis per month with up to 3 chapters, 1 table, and 1 chart.',
  },
  {
    question: 'Is my data secure and private?',
    answer: 'Absolutely. Your thesis content is encrypted and never shared with third parties. We comply with GDPR and CCPA regulations. You can delete your data at any time from your dashboard.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Enter Your Topic',
    description: 'Tell us your research topic, academic field, and preferred writing style',
    color: 'blue',
  },
  {
    number: 2,
    title: 'AI Creates Structure',
    description: 'Get chapter suggestions, outlines, and subheadings tailored to your topic',
    color: 'cyan',
  },
  {
    number: 3,
    title: 'Generate Content',
    description: 'Watch as your thesis is written chapter by chapter with tables and charts',
    color: 'indigo',
  },
  {
    number: 4,
    title: 'Edit & Export',
    description: 'Refine any section and export in PDF, DOCX, or LaTeX format',
    color: 'green',
  },
];

export const FEATURES_GRID = [
  {
    title: '90+ Page Generation',
    description: 'Generate complete academic theses with chapters, sections, and proper academic structure in minutes.',
    icon: 'Sparkles',
    tags: ['5-7 Chapters', 'Auto Outlines', 'References'],
    large: true,
    gradient: true,
  },
  {
    title: 'Human-Like Writing',
    description: 'Advanced humanization that passes AI detection and reads naturally',
    icon: 'PenTool',
    color: 'green',
  },
  {
    title: 'Auto Tables & Charts',
    description: 'AI generates relevant data visualizations for each chapter automatically',
    icon: 'BarChart',
    color: 'purple',
  },
  {
    title: 'Export Anywhere',
    description: 'Download in PDF, DOCX, LaTeX, or Markdown for any submission requirement',
    icon: 'FileText',
    color: 'orange',
  },
  {
    title: 'Full Editor Control',
    description: 'Edit any section, regenerate parts, or add your own content seamlessly',
    icon: 'Edit3',
    color: 'cyan',
  },
  {
    title: 'Real-Time Progress',
    description: 'Watch your thesis come to life with live progress tracking, word counts, and chapter status updates.',
    icon: 'Zap',
    large: true,
    dark: true,
  },
];

export const ACADEMIC_REFERENCES = [
  "Bharadwaj A., El Sawy O. A., Pavlou P. A., Venkatraman N., Digital business strategy: toward a next generation of insights, MIS Quarterly, 37(2), 2013.",
  "Bocken N. M. P., de Pauw I., Bakker C., van der Grinten B., Product design and business model strategies for a circular economy, Journal of Industrial and Production Engineering, 33(5), 2016.",
  "Catalini C., Gans J. S., Some simple economics of the blockchain, Communications of the ACM, 63(7), 2020.",
  "Gawer A., Cusumano M. A., Industry platforms and ecosystem innovation, Journal of Product Innovation Management, 31(3), 2014.",
  "Gawer A., Digital platforms and ecosystems: Remarks on the dominant organizational forms of the digital age, Innovation: Organization & Management, 23(1), 2021.",
  "Kenney M., Zysman J., The rise of the platform economy, Issues in Science and Technology, 32(3), 2016.",
  "Osterwalder A., Pigneur Y., Business model generation: a handbook for visionaries, game changers, and challengers, John Wiley & Sons, 2010.",
  "Parker G. G., Van Alstyne M. W., Choudary S. P., Platform Revolution: How Networked Markets Are Transforming the Economy, W. W. Norton & Company, 2016.",
  "Teece D. J., Business models, business strategy and innovation, Long Range Planning, 43(2-3), 2010.",
  "Zott C., Amit R., Massa L., The business model: recent developments and future research, Journal of Management, 37(4), 2011.",
  "Zuboff S., The age of surveillance capitalism: The fight for a human future at the new frontier of power, PublicAffairs, 2019.",
];

export const BLOG_TOPICS = [
  // Thesis Writing Tips
  "How to Write a Compelling Thesis Introduction",
  "Structuring Your Literature Review: A Step-by-Step Guide",
  "Common Thesis Mistakes and How to Avoid Them",
  "Writing a Methodology Chapter That Impresses",
  "How to Write a Strong Thesis Conclusion",
  
  // Research Methods
  "Qualitative vs Quantitative Research: When to Use Each",
  "How to Conduct a Systematic Literature Review",
  "Data Collection Methods for Academic Research",
  "Statistical Analysis Techniques for Thesis Research",
  "Case Study Research: Best Practices",
  
  // Academic Writing
  "Academic Writing Style: Tips for Clear Communication",
  "How to Avoid Plagiarism in Academic Writing",
  "Citation Styles Explained: APA, MLA, Chicago, Harvard",
  "Writing Academic Abstracts That Get Noticed",
  "How to Write Effective Research Questions",
  
  // AI in Academia
  "How AI is Transforming Academic Research",
  "Ethical Use of AI Tools in Thesis Writing",
  "AI-Assisted Research: Benefits and Limitations",
  "The Future of Academic Writing with AI",
  "Using AI for Literature Review: A Guide",
  
  // Graduate School
  "Thesis Defense Preparation: Complete Guide",
  "Time Management for Graduate Students",
  "Working with Your Thesis Supervisor Effectively",
  "Overcoming Writer's Block in Academic Writing",
  "Publishing Your Thesis Research: Next Steps",
  
  // Data Visualization
  "Creating Effective Charts for Academic Papers",
  "Data Visualization Best Practices for Research",
  "When to Use Tables vs Graphs in Your Thesis",
  "Designing Figures for Maximum Impact",
  "Statistical Graphics: Dos and Don'ts",
];
