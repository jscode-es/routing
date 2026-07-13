# 1.0.0 (2026-07-12)


* feat!: implicit stack navigator per folder ([ae56ea8](https://github.com/jscode-es/routing/commit/ae56ea87de3ca5d592e0700dd14d0ebbe0c05dab))


### Bug Fixes

* avoid double top inset with nested headers under hidden ones ([dbc7b29](https://github.com/jscode-es/routing/commit/dbc7b29c069e6bf4bbd66662c886c06cca25d46c))
* opaque screen background so push transitions do not blend ([5ab0a5c](https://github.com/jscode-es/routing/commit/5ab0a5cb35a3f376508c32f9f251cbf265560055)), closes [#f2f2f2](https://github.com/jscode-es/routing/issues/f2f2f2)
* tab bar respects the bottom safe area inset ([22407b8](https://github.com/jscode-es/routing/commit/22407b8608c0544151587f7dd4544e48f52b7bc8))


### Features

* declarative navigators via layout.ts and Next-style layout children ([5b39817](https://github.com/jscode-es/routing/commit/5b39817e99d0e5c297ae44110aebe9dc304a7f72))
* deep linking via core Linking module ([03e71e2](https://github.com/jscode-es/routing/commit/03e71e27c6aa01f9adef24ab763ff42e69e4adca))
* dev route-tree log on RootRouter mount ([31c1227](https://github.com/jscode-es/routing/commit/31c1227de714dbf0084be45f53032e73f3f298d0))
* **example:** order the dynamic premium tab pair after Home ([9599806](https://github.com/jscode-es/routing/commit/9599806f66a1dd7a17e1d155fab5decabce02ec1))
* **example:** premium demo for dynamic hidden tabs ([acfa424](https://github.com/jscode-es/routing/commit/acfa424af23157567dbaeb140c98987a832bd57d))
* headerShown and safeArea screen options for full-bleed screens ([e286f11](https://github.com/jscode-es/routing/commit/e286f11730f10587baa11480b6c031a6678278a6))
* hidden tabs via NavigatorConfig and Tabs prop ([04aba89](https://github.com/jscode-es/routing/commit/04aba896085edefa64154c2e0cf7e72a1af80076))
* native stack navigator on react-native-screens ([7c25d57](https://github.com/jscode-es/routing/commit/7c25d5780cfdf100ff4ec69cba32d71f9722fcce))
* native tabs navigator with frozen background tabs ([2fbb0b0](https://github.com/jscode-es/routing/commit/2fbb0b03935a93bc97b5ff8598dc1b179eb1dff6))
* navigation state, useRouter hooks, imperative router and Link ([3747004](https://github.com/jscode-es/routing/commit/3747004461603b5eb2403e84bdeb61a1531a2630))
* nested navigators, implicit pass-through and +not-found fallback ([582cdbf](https://github.com/jscode-es/routing/commit/582cdbfa8c36663bd03d6e0bf645299a80be3b52))
* npm packaging, smoke test, docs, LICENSE and README ([b324d9e](https://github.com/jscode-es/routing/commit/b324d9ebe68c67e78c5e524a6c2aa23eee59c295))
* pass params and pathname as props to pages and layouts ([77421e9](https://github.com/jscode-es/routing/commit/77421e9245d0c1a559bdc381865b20aed9d48846))
* per-page metadata and generateMetadata exports ([f99b086](https://github.com/jscode-es/routing/commit/f99b0867ff94088b97eecb6b4ae6f85f2e1756b8))
* per-screen orientation option on Stack.Screen ([e70e06d](https://github.com/jscode-es/routing/commit/e70e06d136801123f90b2298ed269731068c7d4c))
* per-screen stack animations and tab fade transitions ([4e4639c](https://github.com/jscode-es/routing/commit/4e4639cc2e3dc080f64e48e7a5822fe2b76dca75))
* prepare package for npm publishing under [@authuser](https://github.com/authuser) scope ([44249af](https://github.com/jscode-es/routing/commit/44249afbd775fe05f28dbaa86af2b409a9707d1a))
* Redirect component for declarative auth guards ([4b104c7](https://github.com/jscode-es/routing/commit/4b104c74f5dafe37aafdf74fe3c8360380151d47))
* scaffold package tooling, docs and pure route-tree engine ([cbae318](https://github.com/jscode-es/routing/commit/cbae318d488b99cbd0e066b93b92b0eb4a0f70d2))
* tab icons via render prop and icon-only mode ([a6d3d30](https://github.com/jscode-es/routing/commit/a6d3d3065d3ac69dab32ecbf06e832a8bad85bc5))
* tabs order option in NavigatorConfig and Tabs prop ([fb4d27f](https://github.com/jscode-es/routing/commit/fb4d27f7187ca8c39f3851d9a2c6322f1713b646))
* wire example app to RootRouter with require.context ([f0880e3](https://github.com/jscode-es/routing/commit/f0880e31b792660443ddbef40f0502e6cd2efd75))
* zero-config RootRouter via babel plugin ([adbdb75](https://github.com/jscode-es/routing/commit/adbdb7591ab1bac27532c475cd9df4931944a167))


### BREAKING CHANGES

* folders without layout previously passed through to
the nearest ancestor navigator. To keep that behavior declare
export const navigator = { type: slot } in a layout.ts. Ships in 0.x
before the 1.0 release.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
