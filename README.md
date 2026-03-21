# Quantity Measurement App

This project currently includes a static quantity measurement UI and a seeded `db.json` file for JSON Server.

## Files

- `html/index.html` - main page
- `css/styles.css` - custom styles
- `db.json` - JSON Server database

## Run the UI

Open `html/index.html` in a browser.

## Run JSON Server

```bash
npm run server
```

or

```bash
json-server --watch db.json --port 3000
```

Available endpoints:

- `http://127.0.0.1:3000/units`
- `http://127.0.0.1:3000/conversions`
- `http://127.0.0.1:3000/history`
