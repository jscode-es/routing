# @authuser/react-native-routing

[![npm version](https://img.shields.io/npm/v/@authuser/react-native-routing.svg)](https://www.npmjs.com/package/@authuser/react-native-routing)
[![CI](https://github.com/jscode-es/routing/actions/workflows/release.yml/badge.svg)](https://github.com/jscode-es/routing/actions/workflows/release.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jscode-es/routing/blob/main/LICENSE)

File-based router for **React Native** (iOS/Android), without Expo or React
Navigation. Routes are defined as files under `app/`, in the style of
Expo Router/Next.js, on top of a navigation engine built directly on
`react-native-screens`, `react-native-gesture-handler` and
`react-native-reanimated`. Zero runtime dependencies.

```
app/
  index.tsx          → /            (implicit root stack, no layouts needed)
  users/[id].tsx     → /users/:id
  (tabs)/layout.ts   → export const navigator = { type: 'tabs' }
  not-found.tsx      → 404 fallback (optional)
```

## Features

- File-based routes: static, dynamic (`[id]`), catch-all (`[...slug]`),
  groups (`(group)`), nested layouts and `not-found` (with a default 404
  screen if the app doesn't define one).
- Zero required layouts: an implicit native stack per folder, tabs with a
  one-line declarative `layout.ts`, and screen options co-located with each
  page (`export const metadata` / `generateMetadata`), Next.js style.
  Component layouts receive the navigator as `children` and persist across
  screens.
- Visual route tree in development: on startup the discovered tree is
  printed with navigators, URLs and titles (`logRoutes={false}` disables it).
- Native `<Stack>` (`ScreenStack`): native push/pop transitions, native
  header, `presentation: 'modal'`, Android hardware back button,
  swipe-to-go-back on iOS.
- `<Tabs>` with natively frozen tabs (they keep their state) and an
  animated indicator powered by reanimated.
- Nested navigators (sub-stacks) independent from the root stack.
- `useRouter`, `useLocalSearchParams`, `useGlobalSearchParams`,
  `usePathname`, `useSegments`, `<Link>`, `<Slot>`, `<Redirect>`
  (declarative auth guards) and an imperative router.
- Deep linking via the core `Linking` module (cold and warm starts), with
  no separate linking configuration: it's derived from the route tree.
- New Architecture (Fabric) and Fast Refresh: new files under `app/` are
  picked up without codegen.

## Quick start

Requires an existing React Native CLI project
(`npx @react-native-community/cli init`); not for web or Expo Go.

**1. Install** the package and its peer dependencies (no React Navigation
or `react-native-safe-area-context` needed):

```sh
npm install @authuser/react-native-routing \
  react-native-screens react-native-gesture-handler \
  react-native-reanimated react-native-worklets
cd ios && pod install && cd ..   # iOS only
```

**2. Configure Babel and Metro** (one-time setup):

```js
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@authuser/react-native-routing/babel', // accepts { root: './other-dir' }
    'react-native-worklets/plugin',         // always last
  ],
};

// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withRouting } = require('@authuser/react-native-routing/metro');
module.exports = withRouting(getDefaultConfig(__dirname));
```

**3. Mount the router** — no props needed; the Babel plugin locates `app/`
at build time:

```tsx
// App.tsx
import { RootRouter } from '@authuser/react-native-routing';

export default function App() {
  return <RootRouter />;
}
```

**4. Create routes.** No layout required: the root mounts an implicit
native stack and each page declares its options next to the component:

```tsx
// app/index.tsx  →  /
import { Link } from '@authuser/react-native-routing';
import type { ScreenMetadata } from '@authuser/react-native-routing';

export const metadata: ScreenMetadata = { title: 'Home' };

export default function Home() {
  return <Link href="/users/42">Go to user 42</Link>;
}
```

```tsx
// app/users/[id].tsx  →  /users/:id, with a dynamic title
import { Text } from 'react-native';
import type { GenerateMetadata, PageProps } from '@authuser/react-native-routing';

export const generateMetadata: GenerateMetadata = ({ params }) => ({
  title: `User ${String(params.id)}`,
});

export default function User({ params }: PageProps<{ id: string }>) {
  return <Text>User {params.id}</Text>;
}
```

Every page receives `params` and `pathname` as props (Next.js style);
layouts do too, plus `children`. For nested components that don't receive
the page props there are hooks (`useLocalSearchParams`, `usePathname`).

The name between brackets is up to you, and dynamic segments nest:

```
app/posts/[slug].tsx       → /posts/:slug     → params.slug
app/[category]/[item].tsx  → /:category/:item → params.category, params.item
app/blog/[...slug].tsx     → /blog/*          → params.slug (string[])
```

Match priority: static > dynamic > catch-all (`posts/featured.tsx` beats
`posts/[slug].tsx` for `/posts/featured`).

**5. Tabs?** A folder with a one-line `layout.ts`; each tab's title and
icon come from its page `metadata`:

```ts
// app/(tabs)/layout.ts
import type { NavigatorConfig } from '@authuser/react-native-routing';

export const navigator: NavigatorConfig = { type: 'tabs', animation: 'fade' };
```

```tsx
// app/(tabs)/profile.tsx  →  /profile
export const metadata: ScreenMetadata = {
  title: 'Profile',
  tab: {
    icon: ({ focused, size }) => (
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.4 }}>👤</Text>
    ),
  },
};
```

On startup in development, the package prints the discovered tree (in
logcat / React Native DevTools):

```
@authuser/react-native-routing · 5 routes

app/                 Stack (implicit)
├── (tabs)/          Tabs
│   ├── index        /            "Home"
│   └── profile      /profile     "Profile"
├── users/
│   └── [id]         /users/:id   (dynamic)
└── not-found        404 (package default)
```

### Shared UI and guards

A component layout receives its folder's navigator as `children`
(Next.js style) and **persists** while navigating between its children —
ideal for providers and auth guards:

```tsx
// app/(tabs)/layout.tsx — coexists with export const navigator
export default function TabsGuard({ children }: { children?: ReactNode }) {
  const session = useSession();
  if (!session) return <Redirect href="/login" />;
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

### Navigating

```tsx
<Link href="/users/42">Profile of 42</Link>;

const router = useRouter();
router.push('/users/42');
router.replace('/login');
router.back();

// Outside components (e.g. a push-notification handler):
import { router } from '@authuser/react-native-routing';
router.push('/messages/123');
```

## Documentation

- [Getting started](https://github.com/jscode-es/routing/blob/main/docs/getting-started.md) — step-by-step guide
- [File conventions](https://github.com/jscode-es/routing/blob/main/docs/file-conventions.md) — routes, groups, layouts, implicit stack
- [API reference](https://github.com/jscode-es/routing/blob/main/docs/api-reference.md) — components, hooks, `metadata`, `NavigatorConfig`
- [Architecture](https://github.com/jscode-es/routing/blob/main/docs/architecture.md) — internal design

## Contributing

Source code, issues and development setup live at
[github.com/jscode-es/routing](https://github.com/jscode-es/routing).

## License

[MIT](https://github.com/jscode-es/routing/blob/main/LICENSE)
