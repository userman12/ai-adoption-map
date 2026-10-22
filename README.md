# AI Adoption Map

How fast is AI spreading through European businesses? An interactive map of the share of enterprises (10+ employees) using AI, by country and company size, 2021 to today, with 25 more Eurostat indicators on technologies, uses and barriers. Part 2 of a series after the [Internet Adoption Map](https://userman12.github.io/internet-adoption-map/).

## Live demo

**[userman12.github.io/ai-adoption-map](https://userman12.github.io/ai-adoption-map/)**

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
