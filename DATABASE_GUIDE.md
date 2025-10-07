# 🗄️ Database Scripts & Migration Guide

A comprehensive guide for managing your database with Prisma and Supabase.

## 📋 Available Scripts

### **Development Scripts**
```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Create and apply migration (development)
npm run db:migrate

# Push schema directly (quick changes, no migration files)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (⚠️ DESTRUCTIVE)
npm run db:reset

# Deploy migrations to production
npm run db:deploy

# Check migration status
npm run db:status

# Create migration without applying
npm run db:create

# Apply pending migrations
npm run db:apply
```

## 🔧 Script Explanations

### **`npm run db:generate`**
- **What it does:** Generates the Prisma client based on your schema
- **When to use:** After changing `schema.prisma` or installing Prisma
- **What happens:** Creates/updates `node_modules/.prisma/client/`
- **Example:** After adding a new field to a model

### **`npm run db:migrate`**
- **What it does:** Creates a new migration file AND applies it to database
- **When to use:** When you want to track schema changes
- **What happens:** 
  1. Creates migration file in `prisma/migrations/`
  2. Applies migration to your database
  3. Updates Prisma client
- **Example:** Adding a new table or field

### **`npm run db:push`**
- **What it does:** Directly applies schema to database (no migration files)
- **When to use:** Quick prototyping, development
- **What happens:** Schema changes applied immediately
- **Example:** Testing schema changes quickly

### **`npm run db:studio`**
- **What it does:** Opens Prisma Studio (database GUI)
- **When to use:** Viewing/editing data, debugging
- **What happens:** Opens browser with database interface
- **Example:** Checking if data was inserted correctly

## 🚀 Migration Workflow

### **1. Development Workflow**
```bash
# 1. Edit your schema
# Edit prisma/schema.prisma

# 2. Create and apply migration
npm run db:migrate

# 3. Generate client
npm run db:generate

# 4. Test your changes
npm run db:studio
```

### **2. Production Deployment**
```bash
# 1. Create migration (development)
npm run db:migrate --name add_user_avatar

# 2. Deploy to production
npm run db:deploy

# 3. Verify deployment
npm run db:status
```

## 📁 Migration Files Structure

```
prisma/
├── migrations/
│   ├── 20241201_120000_init/
│   │   └── migration.sql
│   ├── 20241201_130000_add_user_avatar/
│   │   └── migration.sql
│   └── 20241201_140000_add_post_tags/
│       └── migration.sql
├── schema.prisma
└── seed.ts
```

## 🔄 Common Scenarios

### **Scenario 1: Adding a New Field**
```bash
# 1. Edit schema.prisma
# model User {
#   id        String   @id @default(cuid())
#   email     String   @unique
#   name      String?
#   avatar    String?  # <- New field
#   createdAt DateTime @default(now())
#   updatedAt DateTime @updatedAt
#   posts     Post[]
# }

# 2. Create migration
npm run db:migrate --name add_user_avatar

# 3. Check the migration file
cat prisma/migrations/*/migration.sql
```

### **Scenario 2: Adding a New Table**
```bash
# 1. Edit schema.prisma
# model Category {
#   id          String   @id @default(cuid())
#   name        String
#   description String?
#   posts       Post[]
#   createdAt   DateTime @default(now())
#   updatedAt   DateTime @updatedAt
# }

# 2. Create migration
npm run db:migrate --name add_categories_table

# 3. Verify in Supabase dashboard
```

### **Scenario 3: Changing Field Type**
```bash
# 1. Edit schema.prisma
# model User {
#   id        String   @id @default(cuid())
#   email     String   @unique
#   name      String?
#   age       Int      # <- Changed from String to Int
#   createdAt DateTime @default(now())
#   updatedAt DateTime @updatedAt
#   posts     Post[]
# }

# 2. Create migration
npm run db:migrate --name change_age_to_int

# 3. Check for data loss warnings
```

## ⚠️ Important Notes

### **Before Running Migrations:**
1. **Backup your database** (especially production)
2. **Test on staging** environment first
3. **Review migration files** before applying
4. **Check for data loss** warnings

### **Migration Best Practices:**
1. **Use descriptive names:** `add_user_avatar_field` not `migration_1`
2. **One change per migration** when possible
3. **Test migrations** on a copy of production data
4. **Never edit migration files** after they're created

## 🚨 Troubleshooting

### **Migration Fails:**
```bash
# Check migration status
npm run db:status

# Reset and try again (⚠️ DESTRUCTIVE)
npm run db:reset

# Or manually fix the migration file
```

### **Schema Out of Sync:**
```bash
# Reset database
npm run db:reset

# Or push schema directly
npm run db:push
```

### **Client Out of Sync:**
```bash
# Regenerate client
npm run db:generate

# Restart your development server
npm run dev
```

## 🎯 Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `db:generate` | Generate Prisma client | After schema changes |
| `db:migrate` | Create & apply migration | Development changes |
| `db:push` | Direct schema push | Quick prototyping |
| `db:studio` | Open database GUI | Viewing/editing data |
| `db:deploy` | Deploy to production | Production deployment |
| `db:reset` | Reset database | Start over (⚠️ DESTRUCTIVE) |

## 🔗 Useful Links

- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [Prisma Studio](https://www.prisma.io/studio)
- [Database Best Practices](https://www.prisma.io/docs/guides/database-best-practices)
