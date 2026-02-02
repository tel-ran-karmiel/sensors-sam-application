/**
 * Average Data Processor Handler
 * Subscribes to avg-sensor-data stream and processes averaged sensor values
 *
 * Event doc: https://docs.aws.amazon.com/lambda/latest/dg/invocation_tolerable_failure_rates.html
 * @param {Object} event - SNS Event
 * @param {Object} context - Lambda Context
 */

import logger from "/opt/nodejs/index.mjs";


/**
 * @param {Object} messageDict
 * @param {string} tzName
 */
function processMessage(messageDict, tzName) {
  const { sensorId, value, timestamp } = messageDict;

  const date = new Date(timestamp); 

  const dt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tzName,
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);

  console.log(
    `sensorId = ${sensorId}\n` +
    `avg value = ${value}\n` +
    `date-time = ${dt}`
  );
}

function processRecord(record, tzName) {
  const message = record.Sns.Message;
  logger.debug(`message from SNS record is ${message}`);

  const messageDict = JSON.parse(message);
  processMessage(messageDict, tzName);
}

export const lambdaHandler = async (event) => {
  try {
    const tzName = process.env.TZ || "Asia/Jerusalem";

    for (const record of event.Records) {
      processRecord(record, tzName);
    }
  } catch (e) {
    logger.error(`Error: ${e.message}`);
    throw e;
  }
};
