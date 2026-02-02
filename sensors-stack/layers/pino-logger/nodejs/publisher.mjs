import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import logger from "./index.mjs";

const sns = new SNSClient({});
export async function publish(data, topicArn) {
  const dataJson = JSON.stringify(data);
  const cmd = new PublishCommand({
    TopicArn: topicArn,
    Message: dataJson,
  });

  const resp = await sns.send(cmd);
  logger.debug(`response from publishing is ${resp}`);
}
