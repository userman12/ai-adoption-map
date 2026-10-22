# AI Adoption Map

How fast is AI spreading through European businesses? An interactive map of the share of enterprises (10+ employees) using AI, by country and company size, 2021 to today, with 25 more Eurostat indicators on technologies, uses and barriers. Part 2 of a series after the [Internet Adoption Map](https://userman12.github.io/internet-adoption-map/).

## Live demo

**[userman12.github.io/ai-adoption-map](https://userman12.github.io/ai-adoption-map/)**

## Features

- **Choropleth map of Europe**: the 27 EU member states plus the non-EU countries Eurostat surveys (tagged "non-EU"), coloured in five bands set per indicator. Countries without a value are hatched, never shown as zero. Hover or tap a country for its value, its rank, the change since the previous survey year and any Eurostat note (e.g. break in series).
- **EU27 headline and trend**: the EU27 figure for the current view, with its change in percentage points. The year buttons double as a small bar chart of the EU27 trend, and **Play** steps through the survey years (2021, 2023, 2024, 2025).
- **Company size filter**: all enterprises, small (10–49 employees), medium (50–249) or large (250+).
- **26 indicators in four groups**, all from the same dataset, each shown with the base its percentage is computed on:
  - *Adoption*: uses at least one AI technology, 2+ or 3+ technologies (% of enterprises)
  - *Technologies*: text, speech or code generation; text analysis; speech recognition; image, video or audio generation; workflow automation (RPA); machine learning for data analysis; image recognition; autonomous robots, vehicles or drones (% of enterprises)
  - *What AI is used for*: marketing or sales; business administration or management; accounting, controlling or finance; production processes; ICT security; R&D or innovation; logistics (% of enterprises using AI)
  - *Why non-users hold back*: lack of expertise; unclear legal consequences; data protection and privacy concerns; data availability or quality; incompatible with existing systems; costs too high; ethical considerations; not useful for the business (% of enterprises that considered AI but don't use it)
- **Ranking**: every country for the current view against an EU27 reference line. Rows slide to their new rank when you change year, size or indicator, and hovering a row highlights the country on the map (and vice versa).
- **Country profile**: click a country on the map or in the ranking for every indicator side by side with the EU27 average, sorted highest first within each group. Click a row to put that indicator on the map.
- **Map or 3D globe**: switch to a draggable orthographic globe that turns to face Europe.
- **Shareable links**: the whole view lives in the URL, so any view is a link: `#y=2024&s=large&i=pms&v=globe&c=IT&l=it` (year, size, indicator, globe, open country, language).
- **English and Italian**, including number formats (20.0% / 20,0%).
- **Light and dark theme**, following the system setting.
- **Accessible**: Tab through countries on the map, Enter or Space opens a profile, Esc closes it. Countries and controls have screen-reader labels, text meets WCAG AA contrast, and reduced-motion settings turn the animations off.
- **Works on phones** from 360 px wide.
- **Private and static**: no backend, cookies or analytics. The browser loads the site's own files plus D3, TopoJSON and the world atlas from public CDNs, and never calls the Eurostat API.

## Data

Eurostat, dataset [`isoc_eb_ai`](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table). The browser only reads `data/ai-adoption.json`; to refresh it:

```sh
node scripts/fetch-data.mjs     # download from Eurostat
node scripts/validate-data.mjs  # check ranges and spot values
```

## Run locally

```sh
python3 -m http.server 8000     # then open http://localhost:8000
```
