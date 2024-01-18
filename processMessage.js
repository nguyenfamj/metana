const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const moment = require('moment-timezone');
require('dotenv').config();

const targetPerson = {
  nameID: process.env.NAME_ID,
};

console.log(targetPerson.nameID);

const messageFile = fs.readFileSync(
  path.join(__dirname, `message-${targetPerson.nameID}.json`),
  'utf8'
);
const messageFileObject = JSON.parse(messageFile);

const callHistory = messageFileObject.messages
  .filter((message) => Boolean(message.call_duration))
  .map((call) => {
    return {
      startTime: moment(call.timestamp_ms - call.call_duration)
        .tz(process.env.TIMEZONE)
        .format('YYYY-MM-DD HH:mm:ss'),
      duration: (call.call_duration / 60).toFixed(2), // Duration in minutes
      caller:
        call.content === 'The video chat ended.'
          ? process.env.PERSON_1_NAME
          : process.env.PERSON_2_NAME,
    };
  });

console.log(callHistory);

// Initialize jsPDF
const doc = new jsPDF();

// Adding overview information
doc.setFontSize(14);
doc.text('Messenger Call Logs Overview', 105, 20, null, null, 'center');
doc.setFontSize(12);
doc.text(
  `Messenger call logs between ${process.env.PERSON_1_NAME} and ${process.env.PERSON_2_NAME}`,
  20,
  30
);
doc.text(`Total Calls on Messenger: ${callHistory.length}`, 20, 40);
if (callHistory.length > 0) {
  const lastCallTime = callHistory[callHistory.length - 1].startTime;
  doc.text(`Last Call Time: ${lastCallTime}`, 20, 50);
}

// Function to add table header
function addTableHeader(yOffset) {
  doc.setFontSize(12);
  doc.text('Start Time', 20, yOffset);
  doc.text('Duration (min)', 70, yOffset);
  doc.text('Caller', 120, yOffset);
  doc.setDrawColor(0);
  doc.line(20, yOffset + 2, 190, yOffset + 2); // Draw a line for header separation
}

// Adding table header below the overview
let yOffset = 60;
addTableHeader(yOffset);
yOffset += 10; // Adjust yOffset to start below the header

// Adding call records
callHistory.forEach((call, index) => {
  if (yOffset > 280) {
    // Check if near the bottom of the page
    doc.addPage();
    yOffset = 20; // Reset yOffset for new page
    addTableHeader(yOffset);
    yOffset += 10; // Adjust yOffset to start below the header
  }
  doc.text(call.startTime, 20, yOffset);
  doc.text(call.duration.toString(), 70, yOffset);
  doc.text(call.caller, 120, yOffset);
  yOffset += 10;
});

// Save the PDF
doc.save(`${process.env.PDF_FILENAME}.pdf`);
