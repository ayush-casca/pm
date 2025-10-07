# Next.js + tRPC + Supabase + Prisma

A modern full-stack application built with Next.js 15, TypeScript, tRPC, Supabase, and Prisma.

## Features

- ⚡ **Next.js 15** with App Router
- 🔷 **TypeScript** for type safety
- 🚀 **tRPC** for end-to-end type safety
- 🗄️ **Supabase** for database and authentication
- 🛠️ **Prisma** for database ORM
- 🎨 **Tailwind CSS** for styling
- 📦 **React Query** for data fetching

## Getting Started

### 1. Environment Setup

Copy the environment variables and configure them:

```bash
cp .env.local.example .env.local
```

Update the following variables in `.env.local`:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Setup

1. Set up your Supabase project and get your database URL
2. Update the `DATABASE_URL` in your `.env.local` file
3. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/trpc/          # tRPC API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── providers.tsx      # tRPC and React Query providers
└── lib/                   # Utility libraries
    ├── prisma.ts          # Prisma client
    ├── supabase.ts        # Supabase client
    ├── trpc.ts            # tRPC server setup
    └── trpc-client.ts     # tRPC client setup
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: tRPC
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **State Management**: React Query (TanStack Query)
- **Authentication**: Supabase Auth (ready to configure)

## Next Steps

1. Configure your Supabase project
2. Set up authentication with Supabase Auth
3. Add more tRPC procedures
4. Create your database schema in Prisma
5. Build your application features

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)