# Yazio Data Extractor

A locally-run, browser-based React tool to extract data from Yazio screenshots, plot the trends, and calculate smoothing (moving averages and medians).

## Deployment

🚀 **[View the Live Application on GitHub Pages](https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/)** *(Make sure to enable GitHub pages in your repo settings -> Pages -> Build and deployment: GitHub Actions)*

## Development Setup

```bash
cd yazio-parser
npm install
npm run dev
```

## Features
- Upload long screenshots directly
- Local, secure OCR via `tesseract.js`
- Bounding box matching algorithms
- Customizable metric definitions
- Moving averages / moving medians analysis
