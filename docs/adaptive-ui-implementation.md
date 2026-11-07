# Adaptive layout and weather theme implementation

Implemented against the approved [layout](adaptive-ui-layout-handoff.md) and [color](weather-color-theme-handoff.md) handoffs on 31 October 2026.

## Presentation and routing

- The SDK 57 standard navigator keeps visited scenes mounted. Forecast and Air quality retain their public URLs but share one Weather workspace. Resizing changes presentation, not routes or providers. Settings and Air quality now live under the `(tabs)` route group; their public URLs remain `/settings` and `/air-quality`.
- Phones have five floating destinations and a Settings gear only on Weather. Wider windows have four rail destinations and bottom Settings. Intermediate, short, or large-font windows use one focused pane. Bottom content padding uses the measured navigation height.
- Weather keeps its existing measurements, summary controls and alerts. Forecast has all hourly samples and seven open daily rows; its compact tracks share the same width and scale. The unfolded measurement panel stretches to the detail pane's bottom.
- Charts always has six panels. Missing samples remain gaps and are excluded from statistics. Both paired lines remain visible when selecting extrema guides. Touch, keyboard and accessibility actions inspect the paired values. Plots measure their parent; shared natural header heights align all six unfolded panels.
- Sky keeps its calculation and preview hooks, dynamic section order, time controls and globe instance. The unfolded globe spans the time controls and both timelines. Event rows retain their fields without wrapping into separate rows.
- Map retains the same native WebView across resizing, with a real Windy iframe on web. Layer changes and explicit refresh still reload the map. Browser opening uses the selected layer and weather location.
- Settings groups every existing action into the six approved categories. Phones use a vertical menu and a second level for the selected category; wide layouts show menu and detail side by side. Back returns to the menu before leaving Settings. API-key edits remain in the existing modal; saving closes that modal. Refresh-rate changes now update the displayed preference immediately after saving.

## Review corrections

- The phone current-weather block has no separate background or border. High/low aligns with Feels like, and the icon follows the height of the temperature/condition text. The title and Settings gear scroll with the content. There is no floating compact header or frosted overlay.
- Daily precipitation uses equal-width number and unit columns, centering the gap below each icon. Chart panels keep compact headers/statistics without series underlines; plots use smooth 3 px lines, rounded gradient bars and single-row noon/midnight labels. Y-axis values omit units already shown in the panel header. Missing-data gaps, full sample counts, guides and inspection remain intact.
- Alerts are individual glass cards without an outer section or heading. They retain severity colors, expansion, metadata and newest-first ordering. The AI summary no longer includes the tap instruction, and Sky omits the location subtitle.
- Map layer controls have a filled active state and pointer-transparent fades only on edges with offscreen content. Fades disappear when all layers fit; resizing and scrolling the controls preserve the map instance.
- Wide Weather places location/update time on the left of the Forecast/Air quality selector. The AQI measurement is informational there; the selector changes the detail pane. Phones keep the AQI detail action.
- Native configuration and the root navigator lock the app to portrait. Install a new native build to apply the configuration; browser windows remain resizable for wide-layout review.

## Theme and surfaces

The theme supplies eight weather palettes in both appearances, with stops at 0%, 58% and 100%. Location-aware astronomy chooses clear day/night independently of stored Dark mode; provider times and icons are fallbacks. This calculation does not fetch weather and does not use Sky's preview time.

Glass surfaces use the approved 72% fill and foreground roles. Web uses 24 px backdrop blur when supported; native uses Expo BlurView over a shared background target. Reduced transparency, unavailable blur and Android versions below API 31 use the opaque fallback. Charts deliberately use opaque reading surfaces. The hero retains a dark gradient behind its white text even when its unfolded height grows.

No storage key, persisted format, fetch-lock behavior, API logger retention or alert history retention was changed. Test and browser review data use synthetic credentials.

## Verification

- Repository preflight covers formatting, TypeScript, lint and the complete Jest suite. Jest uses filesystem watching directly instead of requiring access to a shared Watchman daemon.
- Regression tests cover the 320/360/390/600/720/840/1024 dp thresholds, large-font and short-window fallback, scene identity across resizing, Forecast/AQI destination continuity, all 48 hourly entries and seven daily rows, zero and mixed precipitation, paired chart inspection with missing samples, Sky time/camera continuity, reduced-transparency fallback, Map layer/URL preservation and initial deep links.
- Production web export and browser review used synthetic cached data. Phone and unfolded layouts were inspected at 320, 390, 600, 720 and 1024 px, including light/dark surfaces, rail Settings, focused AQI, exact Weather/Forecast bottom alignment, six equal chart heights and aligned plots, and Sky panel alignment. Chart tick spacing and explicit web selection semantics were corrected during review.

Physical Android/iOS checks remain necessary for native blur appearance, low-end-device scrolling, screen-reader gestures, keyboard/safe-area behavior and foldable hinge occlusion. Embedded Windy pan/zoom remains inside the existing WebView/iframe; the app does not receive an external camera API. Native preview and camera continuity should be checked on a real foldable in addition to the component regressions.
