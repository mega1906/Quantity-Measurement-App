# Quantity Measurement App

This project currently includes:

- a static UI for the quantity measurement screen
- `db.json` for JSON Server
- app initialization on page load
- unit fetching by selected type in `js/api.js`
- conversion record fetching by unit pair in `js/api.js`
- history save support in `js/api.js`
- history loading support in `js/api.js`
- basic conversion calculation support in `js/conversion.js`
- comparison calculation support in `js/conversion.js`
- arithmetic calculation support in `js/conversion.js`
- dropdown population support in `js/ui.js`
- active-state UI support in `js/ui.js`
- result panel update support in `js/ui.js`

## Files

- `html/index.html` - page markup and script loading
- `css/styles.css` - custom styles
- `db.json` - JSON Server data
- `js/app.js` - current initialization logic
- `js/api.js` - fetches units, conversion records, saves history, and loads history
- `js/conversion.js` - applies conversions, comparison, and arithmetic logic
- `js/ui.js` - populates unit dropdowns, handles active states, and shows results

## Run JSON Server

From the project root:

```bash
npm run server
```

Available endpoints:

- `http://localhost:3000/units`
- `http://localhost:3000/conversions`
- `http://localhost:3000/history`

## Run the UI

Open `html/index.html` in a browser after starting JSON Server.
