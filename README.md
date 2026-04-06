# Naturkartan.ax

Interactive map of hiking trails and cycling routes across the Åland Islands, built with React and Supabase.

## Features

- Interactive Leaflet map with trail route lines and facility markers
- Trail list with category filters and search
- Park/trail detail view with community-submitted edits
- User contribution flow — suggest edits to existing trails or submit new ones via GPX upload
- Admin interface for reviewing contributions, managing trails, and syncing from ArcGIS
- UI translations: Swedish, English, Finnish
- ArcGIS sync for automatic trail data updates from Ålands landskapsregering

## Tech Stack

- **Frontend:** React 19, Vite
- **Maps:** Leaflet / react-leaflet, OpenStreetMap tiles
- **Backend:** Supabase (Postgres + PostGIS, Row Level Security, Auth)
- **i18n:** i18next / react-i18next

## Project Structure

```
src/
  components/
    Admin/          # Admin panel, contribution review, park form, contact messages
    Contribute/     # ContributeModal (edit existing), ContributeTrailModal (add new via GPX)
    Map/            # MapView, ParkMarker
    Sidebar/        # Sidebar, ParkList, ParkDetail, AboutContact
  hooks/
    useParks.js
    useCategories.js
    useArcGISSync.js
    useFormFields.js
  lib/
    supabase.js
    facilities.js   # Facility type metadata (icons, colors, labels)
    iconUtils.js    # Shared Leaflet icon factories
    constants.js
supabase/
  migrations/       # All schema migrations (001–007)
styles.css
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run dev server

```bash
npm run dev
```

## Database

Managed via Supabase. Migrations are in `supabase/migrations/` and should be run in order.

Key tables:

| Table | Description |
|---|---|
| `items` | Trails and routes (ArcGIS-synced + user-contributed) |
| `categories` | Trail types (hiking, cycling) with colors |
| `contributions` | Pending user submissions — edits and new trails |
| `item_community_edits` | Approved edits to ArcGIS-synced trails |
| `contact_messages` | Messages submitted via the about/contact form |

Row Level Security is enabled on all tables. Public users can read items and insert contributions. All writes to `items` require admin role.

## Contribution Flow

**Editing an existing trail:** "Suggest an edit" on any trail opens a form. Submitted data is stored in `contributions` and reviewed by an admin.

**Adding a new trail:**
1. User clicks "+ Add a missing place"
2. Fills in name, category, description
3. Uploads a `.gpx` file — the route is previewed on a map
4. Optionally adds facility locations (parking, toilets, etc.) by pasting `lat, lng` coordinates
5. On admin approval, the trail is inserted into `items` with its route geometry and facility pins

## Admin

Navigate to `/admin`. Requires a Supabase user listed in the `admins` table.

- **Routes tab:** add, edit, or delete trails; trigger ArcGIS sync
- **Contributions tab:** review pending submissions with route map preview; approve or reject
- **Contacts tab:** read and archive contact form messages

## ArcGIS Sync

Trail data is sourced from Ålands landskapsregering FeatureServer APIs. The sync hook (`useArcGISSync`) fetches hiking trails, cycling routes, and facility points, then upserts changed records using `content_hash` deduplication.

## Build & Deploy

```bash
npm run build   # outputs to dist/
npm run preview # preview production build locally
```
