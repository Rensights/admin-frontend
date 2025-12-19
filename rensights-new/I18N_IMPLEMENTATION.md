# Multiple Language Support Implementation

## Overview
The application now supports multiple languages with translations managed through the admin panel. Translations are stored in the database and loaded dynamically.

## Architecture

### Backend (app-backend)
- **Model**: `Translation.java` - Stores translations with language code, namespace, key, and value
- **Repository**: `TranslationRepository.java` - Database access for translations
- **Service**: `TranslationService.java` - Business logic for translation CRUD operations
- **Controller**: `TranslationController.java` - REST API endpoints at `/api/translations`

### Admin Panel (admin-frontend)
- **Translation Management Page**: `/translations`
  - View all translations filtered by language and namespace
  - Create, edit, and delete translations
  - Manage translations for different languages and namespaces

### Frontend (app-frontend)
- **LanguageContext**: Manages current language and loads translations
- **LanguageSwitcher**: Component for switching between languages
- **Translation Function**: `t(key, namespace)` for translating text

## Usage

### For Developers - Using Translations in Components

```tsx
"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function MyComponent() {
  const { t, loadTranslations } = useLanguage();

  // Load translations for a namespace (optional, will auto-load on first use)
  useEffect(() => {
    loadTranslations('dashboard').catch(console.error);
  }, []);

  return (
    <div>
      <h1>{t('welcome.message', 'common')}</h1>
      <p>{t('dashboard.stats.title', 'dashboard')}</p>
    </div>
  );
}
```

### Translation Key Format
- Format: `namespace.key` or separate parameters `t(key, namespace)`
- Examples:
  - `t('welcome.message', 'common')` → Looks for key `welcome.message` in `common` namespace
  - `t('button.submit', 'auth')` → Looks for key `button.submit` in `auth` namespace

### Namespaces
Namespaces organize translations by feature/page:
- `common` - Common translations used across the app
- `dashboard` - Dashboard-specific translations
- `auth` - Authentication pages
- `deals` - Deals pages
- `property` - Property details pages
- etc.

### For Admins - Managing Translations

1. Navigate to **Translations** in the admin panel
2. Select a **Language** (e.g., en, ar, fr)
3. Select a **Namespace** (e.g., common, dashboard)
4. Click **"Add Translation"** to create new translations
5. Use the **Edit** button to modify existing translations
6. Use the **Delete** button to remove translations

### API Endpoints

#### Public Endpoints (for frontend)
- `GET /api/translations/{languageCode}/{namespace}` - Get all translations for a language/namespace
- `GET /api/translations/languages` - Get list of available languages

#### Admin Endpoints (require authentication)
- `GET /api/translations` - Get all translations
- `GET /api/translations/language/{languageCode}` - Get all translations for a language
- `POST /api/translations` - Create a new translation
- `PUT /api/translations/{id}` - Update a translation
- `DELETE /api/translations/{id}` - Delete a translation

### Language Switcher

The `LanguageSwitcher` component can be added to any page header/navigation:

```tsx
import LanguageSwitcher from "@/components/LanguageSwitcher";

// In your component:
<LanguageSwitcher />
```

### Adding Languages

To add a new language:
1. Add it to the `AVAILABLE_LANGUAGES` array in `LanguageSwitcher.tsx`
2. Add translations for that language through the admin panel

### Default Language
- Default language is `en` (English)
- User's language preference is stored in `localStorage`
- Falls back to English if translations are missing

## Database Schema

```sql
CREATE TABLE translations (
    id UUID PRIMARY KEY,
    language_code VARCHAR(10) NOT NULL,
    namespace VARCHAR(100) NOT NULL DEFAULT 'common',
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(language_code, namespace, translation_key)
);
```

## Next Steps

To fully implement translations:
1. Replace hardcoded strings with `t()` function calls
2. Create translation keys in the admin panel
3. Add translations for each language
4. Add the LanguageSwitcher to your navigation/header

## Example Translation Structure

For a dashboard page with welcome message:
- Namespace: `dashboard`
- Key: `welcome.message`
- English (`en`): "Welcome to your dashboard"
- Arabic (`ar`): "مرحباً بك في لوحة التحكم"
- French (`fr`): "Bienvenue sur votre tableau de bord"

