# Facebook Data Processing Scripts

## Introduction

This repository contains two scripts for processing Facebook data:

- `extractData.js`: Extracts data from provided Facebook data zip files.
- `processMessage.js`: Processes messages from the extracted data.

## Requirements

- Node.js must be installed on your system.
- Ensure that all dependencies (if any) are installed. You can install dependencies by running `npm install` in the project directory.

## Instructions

### Running `extractData.js`

Run the script using Node.js, passing the paths to the zip files as arguments. For example:

```bash
node extractData.js path1.zip path2.zip path3.zip
```

You can pass as many zip files as needed.

### Running `processMessage.js`

After running `extractData.js`, you can process the messages by simply executing the `processMessage.js` script:

```bash
node processMessage.js
```

This script processes the data extracted by `extractData.js`.
