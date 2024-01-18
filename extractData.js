const fs = require('fs');
const path = require('path');
const StreamZip = require('node-stream-zip');
require('dotenv').config();

const MESSAGE_PATH = 'your_activity_across_facebook/messages/inbox';

const targetPerson = {
  nameID: process.env.NAME_ID,
};

if (process.argv.length < 3) {
  console.error('Usage: node script.js <zipFilePath1> <zipFilePath2> ...');
  process.exit(1);
}

const filePaths = process.argv.slice(2);

const notExistsFiles = [];
for (const filePath of filePaths) {
  if (!fs.existsSync(filePath)) {
    notExistsFiles.push(filePath);
  }
}

if (notExistsFiles.length > 0) {
  console.error(`Error: File not found - ${filePaths.join(', ')}`);
  process.exit(1);
}

const outputFolder = path.join(__dirname);

// Ensure the extraction directory exists
if (!fs.existsSync(outputFolder)) {
  console.log('Creating output folders');
  fs.mkdirSync(outputFolder);
}

const inboxJSONPath = path.join(__dirname, `message-${targetPerson.nameID}.json`);

fs.writeFileSync(inboxJSONPath, JSON.stringify({ messages: [] }), 'utf8');

async function processZipFiles(zipFilepaths, outputFolder) {
  for (const zipFilePath of zipFilepaths) {
    if (!fs.existsSync(zipFilePath)) {
      console.error(`Error: File not found ${zipFilePath}`);
      continue; // Skip to the next iteration if the file doesn't exist
    }

    try {
      const zip = new StreamZip.async({ file: zipFilePath });
      const entries = await zip.entries();
      for (const entry of Object.values(entries)) {
        if (!entry.isDirectory) {
          console.log(`Extracting: ${entry.name}`);
          const outputPath = path.join(outputFolder, entry.name);
          const outputDir = path.dirname(outputPath);

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          try {
            const stm = await zip.stream(entry.name);
            const writeStream = fs.createWriteStream(outputPath);
            stm.pipe(writeStream);
            await new Promise((resolve, reject) => {
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
            });
            if (
              entry.name.includes(targetPerson.nameID) &&
              entry.name.startsWith(MESSAGE_PATH) &&
              entry.name.endsWith('.json')
            ) {
              const matchFileObject = JSON.parse(fs.readFileSync(inboxJSONPath, 'utf8'));
              const newFileObject = JSON.parse(
                fs.readFileSync(path.join(__dirname, entry.name), 'utf8')
              );

              matchFileObject.title = newFileObject.title;
              matchFileObject.participants = newFileObject.participants;
              const newAppendedMessages = matchFileObject.messages
                .concat(newFileObject.messages)
                .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
              matchFileObject.messages = newAppendedMessages;

              fs.writeFileSync(inboxJSONPath, JSON.stringify(matchFileObject), 'utf-8');
            }
          } catch (error) {
            console.error(`Error writing ${entry.name}: ${error.message}`);
          }
        }
      }
      await zip.close();
      console.log(`Finished processing zip file: ${zipFilePath}`);
    } catch (error) {
      console.error(`Error processing ${zipFilePath}: ${error.message}`);
    }
  }
}

processZipFiles(filePaths, outputFolder);
