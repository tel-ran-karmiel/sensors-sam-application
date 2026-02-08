/**
 * Abnormal Sensor Data Handler
 * Subscribes to ingest stream and publishes to low-sensor-data and high-sensor-data streams
 *
 * Event doc: https://docs.aws.amazon.com/lambda/latest/dg/invocation_tolerable_failure_rates.html
 * @param {Object} event - SNS Event
 * @param {Object} context - Lambda Context
 */

import logger from "/opt/nodejs/index.mjs";
import { publish } from "/opt/nodejs/publisher.mjs";
import {InvokeCommand, LambdaClient} from "@aws-sdk/client-lambda"
const ENV_TOPIC_LOW = "LOW_SENSOR_DATA_TOPIC_ARN";
const ENV_TOPIC_HIGH = "HIGH_SENSOR_DATA_TOPIC_ARN";
const ENV_LAMBDA = "SENSOR_DATA_PROVIDER_FUNCTION_NAME";
const staleTime = parseInt(process.env["STALE_TIME"] || "1_000_000_000")
const cache = {};
const lambdaClient = new LambdaClient({})
export const lambdaHandler = async (event, __) => {
  try {
    logger.debug(`cache is ${JSON.stringify(cache)}`)
    const topicArnLow = process.env[ENV_TOPIC_LOW];
    if (!topicArnLow)
      throw new Error("missing env. variable for low values topic arn");
    logger.debug(`topicARNLow is ${topicArnLow}`);
    const topicArnHigh = process.env[ENV_TOPIC_HIGH];
    if (!topicArnHigh)
      throw new Error("missing env. variable for high values topic arn");
    logger.debug(`topicARNHigh is ${topicArnHigh}`);
    const functionName = process.env[ENV_LAMBDA]
    if (!functionName)
      throw new Error("missing env. variable for lambda function name");
    logger.debug(`invoked lambda function is ${functionName}`);
    const records = event?.Records ?? [];
    for (let record of records) {
      await processRecord(record, topicArnLow, topicArnHigh, functionName);
    }
  } catch (e) {
    logger.error(`ERROR: ${e?.message ?? String(e)}`);
    throw e;
  }
};
async function processRecord(record, topicArnLow, topicArnHigh, FunctionName) {
  const messageJSON = record?.Sns?.Message;
  logger.debug(`message from SNS record is ${messageJSON}`);
  const data = JSON.parse(messageJSON)
  const {sensorId, value, timestamp} = data
  logger.debug(`cache contains value for sensor ${sensorId} that is ${cache[sensorId]}`)
  if (shouldInvoke(sensorId)) {
      await updateCache(sensorId,FunctionName)
  }
  const minValue = cache[sensorId][0]
  const maxValue = cache[sensorId][1]
  logger.debug(`for sensor ${sensorId} minValue=${minValue} maxValue=${maxValue}`)

  if (value < minValue) {
    publish({sensorId, value, minValue, timestamp }, topicArnLow)
  } else if (value > maxValue) {
    publish({sensorId, value, maxValue, timestamp }, topicArnHigh)
  }

}
function shouldInvoke(sensorId) {
  const values = cache[sensorId]
  let isStaled = false;
  if (!values) {
    logger.debug(`sensor ${sensorId} doesn't have values in the cache`)
  } else if (Date.now() / 1000 - values[2] > staleTime) {
    isStaled = true;
    logger.debug(`values for sensor ${sensorId} are staled`)
  }
  return !values || isStaled
}
async function updateCache(sensorId,  FunctionName){
    logger.debug(` ${FunctionName} to be invoked` )
    const command = new InvokeCommand({
      FunctionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify({
             sensorId
      }))
    })
    const response = await lambdaClient.send(command)
    processResponseFromLambda(response)
    logger.debug(`object cache for sensor ${sensorId} contains ${cache[sensorId]} values`)
}
function processResponseFromLambda(response) {
    const respObj = JSON.parse(Buffer.from(response.Payload).toString("utf-8"))
    const values = respObj.values;
    values.push(Math.trunc(Date.now() / 1000));
    cache[respObj.sensorId] = values;

}
