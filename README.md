# AI Adoption Map

How fast is AI spreading through European businesses? An interactive map of the share of enterprises (10+ employees) using AI, by country, company size and sector, 2021 to today, with 35 more Eurostat indicators on technologies, uses, sourcing, digital intensity and barriers. In English and Italian, on desktop and phone.

## Live demo

**[userman12.github.io/ai-adoption-map](https://userman12.github.io/ai-adoption-map/)**

## Features

- **What the data says**: a six-step guided tour that sets up the page for each fact and explains it in one sentence: the EU27 trend, the range across countries, small vs large enterprises, sectors, the most used AI technology and the reason non-users cite most. Every number is computed from the data when the tour opens, never written by hand.
- **Choropleth map of Europe**: the 27 EU member states plus the non-EU countries Eurostat surveys (tagged "non-EU"), coloured in five bands set per indicator. Countries without a value are hatched, never shown as zero. Hover or tap a country for its value, its rank, the change since the previous survey year and any Eurostat note (e.g. break in series).
- **EU27 headline and trend**: the EU27 figure for the current view, with its change in percentage points. The year buttons double as a small bar chart of the EU27 trend, and **Play** steps through the survey years (2021, 2023, 2024, 2025). The page holds still while it plays: only the data move. Lists and notes keep the room their longest year needs, and the profile and comparison keep the same rows every year, with "–" where a year has no value. 2022 is shown as a marked gap, never estimated: Eurostat's survey that year had no AI questions.
- **Indicator definitions**: the "Definition" button next to the indicator menu opens Eurostat's own wording of the indicator (in English, as Eurostat publishes it), the technologies it counts, the base of the percentage, the survey years, how many countries have a value, the Eurostat code and dataset, plus Eurostat's definition of AI and links to its article and survey methodology.
- **Company size filter**: all enterprises, small (10–49 employees), medium (50–249) or large (250+).
- **Sector filter**: all sectors or one of ten (manufacturing; energy, water and waste; construction; wholesale and retail trade; transport and storage; accommodation and food; information and communication; real estate; professional, scientific and technical activities; administrative and support services). Eurostat publishes sector figures for all enterprises with 10+ employees only, so the size filter switches off while a sector is selected, and the page says why.
- **36 indicators in six groups**, each shown with the base its percentage is computed on:
  - *Adoption*: uses at least one AI technology, 2+ or 3+ technologies (% of enterprises)
  - *Technologies*: text, speech or code generation; text analysis; speech recognition; image, video or audio generation; workflow automation (RPA); machine learning for data analysis; image recognition; autonomous robots, vehicles or drones (% of enterprises)
  - *What AI is used for*: marketing or sales; business administration or management; accounting, controlling or finance; production processes; ICT security; R&D or innovation; logistics (% of enterprises using AI)
  - *How AI is obtained*: ready-to-use commercial AI; commercial AI modified in-house; open-source AI modified in-house; AI developed in-house; AI developed or modified by external providers (% of enterprises using AI; several answers possible)
  - *AI users by digital intensity*: businesses that use AI, split by their digital intensity level, from very low (0–3 of 12 digital technologies and practices) to very high (10–12) (% of all enterprises; together the four levels make up the share using AI)
  - *Why non-users hold back*: considered using AI (% of enterprises not using AI), then lack of expertise; unclear legal consequences; data protection and privacy concerns; data availability or quality; incompatible with existing systems; costs too high; ethical considerations; not useful for the business (% of enterprises that considered AI but don't use it)
- **Ranking**: every country for the current view against an EU27 reference line. Rows slide to their new rank when you change year, size or indicator, and hovering a row highlights the country on the map (and vice versa).
- **Find a country**: click or type in the search box on the map to open a country profile. Suggestions appear in a short, scrollable list in the page language, and accents are optional. Use ↑ ↓ and Enter to pick, Esc to close.
- **Country profile**: click a country on the map or in the ranking for every indicator side by side with the EU27 average, sorted highest first within each group, plus the current indicator in every sector. Click a row to put that indicator, or that sector, on the map. A small trend chart sets the country against the EU27 across the survey years (2022 drawn as a dashed stretch); hover a year to read its values, click it to select it.
- **Share**: copy a link to the exact view (header or profile), or download the open profile as a 1200×630 PNG card with the figure, the EU27 average, the trend and the source, drawn in the browser.
- **Compare countries**: add 2 to 4 countries from their profile or the menu, and see them side by side with the EU27 on every indicator, grouped as in the profile, with the comparison saved in the link.
- **Small vs large enterprises**: below the map, one row per country joins the shares of small, medium and large enterprises on a shared axis, with the EU27 row on top. Sort by the gap (large minus small, in percentage points) or by either size; hover or focus a row for the three values, click it for the country profile. Click the title to fold the section away or open it again.
- **Two indicators, every country**: a scatter chart with any two indicators on the axes, one dot per country and dashed EU27 reference lines. The axes stay fixed across years, so Play moves the dots. It describes, it doesn't explain: the page says so.
- **Data table and CSV**: every country and survey year for the current indicator, size or sector, with Eurostat's notes. The CSV keeps every decimal Eurostat publishes and follows the page language (comma-separated in English; semicolons and decimal commas in Italian, as Excel expects there).
- **Map or 3D globe**: switch to a draggable orthographic globe that turns to face Europe.
- **Shareable links**: the whole view lives in the URL, so any view is a link: `#y=2024&s=large&i=pms&v=globe&c=IT&l=it`, `#n=J&i=tnlg` or `#cmp=IT,DE,FR&sx=any&sy=ble` (year, size, sector, indicator, globe, open country, language, compared countries, scatter axes).
- **English and Italian**, including number formats (20.0% / 20,0%).
- **Light and dark theme**: follows the system setting until you pick one with the switch next to the language buttons; the choice is kept in your browser only.
- **Keyboard**: ← → change year, Space plays or pauses, / or Cmd/Ctrl+K finds a country, Esc closes tooltips, the tour and the profile.
- **Accessible**: Tab through countries on the map and the scatter chart, Enter or Space opens a profile. Countries and controls have screen-reader labels, the trend has a text alternative and the data table gives every value without the map. Text meets WCAG AA contrast, and reduced-motion settings turn the animations off.
- **Works on phones** from 360 px wide.
- **Private and static**: no backend, cookies or analytics. The browser loads the site's own files plus D3, TopoJSON and the world atlas from public CDNs, and never calls the Eurostat API.

## Data

Eurostat, datasets [`isoc_eb_ai`](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table) (by country and size) and [`isoc_eb_ain2`](https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ain2/default/table) (by sector). The data files also carry Eurostat's English label for every indicator, shown in the definition dialog. The definition of AI quoted there comes from Eurostat's [Statistics Explained article](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Use_of_artificial_intelligence_in_enterprises).

The page shows only what Eurostat publishes. Missing values stay missing: no zeros, estimates, interpolation or forecasts. The footer gives the extraction date. The current files match Eurostat's release of 15 June 2026, which covers the survey years 2021, 2023, 2024 and 2025.

The browser only reads `data/ai-adoption.json` and `data/ai-sectors.json`. To refresh them (Node 18+, no dependencies):

```sh
node scripts/fetch-data.mjs     # download from Eurostat
node scripts/validate-data.mjs  # check ranges, EU27 coverage, digital-intensity sums and spot values
```

`validate-data.mjs` fails on any value outside 0–100 and on any indicator or sector without EU27 values. It also checks the 2025 figures against Eurostat's published ones: EU27 20.0% overall, and 17.0%, 30.4% and 55.0% for small, medium and large enterprises. After a refresh, retake `og.png`, the link preview image. It is a 1200×630 screenshot of the page's headline area in English, light theme.

## Run locally

```sh
python3 -m http.server 8000     # then open http://localhost:8000
```

There is no build step. Any static host works; this one is GitHub Pages, from the `main` branch.

## Files

- `index.html`: the page, with every text slot filled by `app.js`.
- `app.js`: data loading, the English and Italian texts, the map and globe, the charts, the URL state.
- `styles.css`: layout, light and dark themes.
- `data/`: the two Eurostat extracts. `scripts/`: fetch and validate them.
- `fonts/`: Schibsted Grotesk (400, 500, 700, Latin), self-hosted, with its licence.
- `favicon.svg`: the tab icon, the EU27 share in the four survey years drawn to scale. `og.png`: the link preview.

## Credits

- Data: [Eurostat](https://ec.europa.eu/eurostat). Reuse is allowed with the source acknowledged, under Eurostat's [copyright notice](https://ec.europa.eu/eurostat/help/copyright-notice). The page only rounds values for display; the CSV keeps every decimal.
- Map: [world-atlas](https://github.com/topojson/world-atlas) (ISC licence), from Natural Earth (public domain).
- Libraries: [D3](https://d3js.org) (ISC) and [TopoJSON](https://github.com/topojson/topojson-client) (ISC), loaded from cdnjs.
- Typeface: [Schibsted Grotesk](https://github.com/schibsted/schibsted-grotesk), SIL Open Font License 1.1 (`fonts/OFL.txt`).

## License

The code is under the [MIT License](LICENSE). The data belong to Eurostat, and the typeface, map and libraries keep their own licences (see Credits).
