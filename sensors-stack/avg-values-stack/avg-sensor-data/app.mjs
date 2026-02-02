/**
 * Average Data Processor Handler
 * Subscribes to avg-sensor-data stream and processes averaged sensor values
 *
 * Event doc: https://docs.aws.amazon.com/lambda/latest/dg/invocation_tolerable_failure_rates.html
 * @param {Object} event - SNS Event
 * @param {Object} context - Lambda Context
 */// index.js (AWS Lambda - Node.js)

import logger from "/opt/nodejs/index.mjs";
import { publish } from "/opt/nodejs/publisher.mjs";

const ENV_TOPIC = "AVG_SENSOR_VALUES_TOPIC_ARN";
const ENV_REDUCE_SIZE = "REDUCING_SIZE";

// sensorId -> [values]
const sensorsHistory = {};

/**
 * @param {string} sensorId
 * @param {number} value
 * @param {number} reduceSize
 * @returns {number|null} average if size >= reduceSize, else null
 */
function getAvgValue(sensorId, value, reduceSize) {
  if (!sensorsHistory[sensorId]) sensorsHistory[sensorId] = [];
  const values = sensorsHistory[sensorId];
  values.push(value);

  const size = values.length;
  let res = null
  if (size >= reduceSize) {
    const sum = values.reduce((acc, v) => acc + v, 0);
    res = sum / size;
  }
  return res;
}

/**
 * @param {string} sensorId
 * @param {string} topicArn
 * @param {number} avg
 */
async function publishAvg(sensorId, topicArn, avg) {
  const payload = {
    sensorId,
    value: avg,
    timestamp: Date.now()
  };

  const resp = await publish(payload, topicArn);
  delete sensorsHistory[sensorId];
  logger.debug(`response from publishing is ${JSON.stringify(resp)}`);
}

/**
 * @param {any} record
 * @param {string} topicArn
 * @param {number} reduceSize
 */
async function processRecord(record, topicArn, reduceSize) {
  const message = record?.Sns?.Message;
  logger.debug(`message from SNS record is ${message}`);

  const messageDict = JSON.parse(message);
  const sensorId = messageDict.sensorId;
  const value = messageDict.value;

  const avg = getAvgValue(sensorId, value, reduceSize);
  if (avg) {
    logger.debug(`Sensor ${sensorId}, avg=${avg}`);
    await publishAvg(sensorId, topicArn, avg);
  }
}

/**
 * Lambda entry
 */
export async function lambdaHandler(event, __) {
  try {
    const topicArn = process.env[ENV_TOPIC];
    if (!topicArn) throw new Error("missing env. variable for topic arn");
    logger.debug(`topicARN is ${topicArn}`);

    const reduceSize = parseInt(process.env[ENV_REDUCE_SIZE] ?? "5");
    logger.debug(`reducing size is ${reduceSize}`);

    const records = event?.Records ?? [];
    for (let record of records) {
      await processRecord(record, topicArn, reduceSize);
    }
  } catch (e) {
    logger.error(`ERROR: ${e?.message ?? String(e)}`);
    throw e;
  }
}




