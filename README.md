# Thesis Generator - AI-Powered Academic Thesis Generator

A modern web application that generates complete, humanized academic theses using AI.

## Features

- 🎓 **90+ Page Generation** - Generate complete academic theses with chapters, sections, and proper structure
- ✍️ **Human-Like Writing** - Advanced humanization that passes AI detection
- 📊 **Auto Tables & Charts** - AI generates relevant data visualizations for each chapter
- 📥 **Export Anywhere** - Download in PDF, DOCX, LaTeX, or Markdown
- ✏️ **Full Editor Control** - Edit any section, regenerate parts, or add your own content
- ⚡ **Real-Time Progress** - Watch your thesis come to life with live progress tracking

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI**: DeepSeek API
- **Payments**: LemonSqueezy
- **Animations**: Framer Motion
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- LemonSqueezy account
- DeepSeek API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/thesis-ai.git
cd thesis-ai
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_MONTHLY_VARIANT_ID=your_monthly_variant_id
LEMONSQUEEZY_UNLIMITED_VARIANT_ID=your_unlimited_variant_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Set up the database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL from `supabase/schema.sql`

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (app)/           # Protected app routes
│   │   │   ├── app/         # Dashboard, theses, settings
│   │   │   └── layout.tsx   # App layout with sidebar
│   │   ├── api/             # API routes
│   │   │   ├── checkout/    # Payment checkout
│   │   │   ├── export/      # Thesis export
│   │   │   ├── generate/    # AI generation
│   │   │   ├── thesis/      # Thesis CRUD
│   │   │   └── webhooks/    # Payment webhooks
│   │   ├── auth/            # Authentication pages
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── landing/         # Landing page components
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── supabase/        # Supabase clients
│   │   ├── constants.ts     # App constants
│   │   ├── deepseek.ts      # DeepSeek API
│   │   ├── lemonsqueezy.ts  # Payment integration
│   │   ├── subscription.ts  # Subscription utilities
│   │   └── utils.ts         # Helper functions
│   ├── providers/           # React providers
│   └── types/               # TypeScript types
├── supabase/
│   └── schema.sql           # Database schema
└── public/                  # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Make sure to set the `maxDuration` in `vercel.json` for generation routes:

```json
{
  "functions": {
    "app/api/generate/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### LemonSqueezy Webhook

1. Go to LemonSqueezy Dashboard > Settings > Webhooks
2. Add your webhook URL: `https://your-domain.com/api/webhooks/lemonsqueezy`
3. Select events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `order_created`
4. Copy the signing secret to your environment variables

## License

MIT License - feel free to use this for your own projects!

## Support

For questions or issues, please open a GitHub issue or contact support@thesisgenerator.io
