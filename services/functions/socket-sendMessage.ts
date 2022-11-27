import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
import { Table } from "@serverless-stack/node/table";

const TableName = Table.Connections.tableName || "Connections";
const dynamoDb = new DynamoDB.DocumentClient();

import { APIGatewayProxyHandler } from "aws-lambda";

export const main: APIGatewayProxyHandler = async (event) => {
  const json = JSON.parse(event?.body || "{}");
  const messageType = json.type;
  const messageRoom = json.room;
  const messageData = json.data;
  const { stage, domainName } = event.requestContext;

  if (messageType === "join") {
    const params = {
      TableName: TableName,
      Item: {
        id: event.requestContext.connectionId,
        roomID: messageRoom,
      },
    };

    await dynamoDb.put(params).promise();
  }

  if (messageType === "toRoom" && !!messageRoom) {
    // Get all the connections
    const connections = await dynamoDb
      .scan({
        TableName,
        ProjectionExpression: "id, roomID",
        //
        FilterExpression: "roomID = :roomID",
        ExpressionAttributeValues: {
          ":roomID": messageRoom,
        },
      })
      .promise();

    const apiG = new ApiGatewayManagementApi({
      endpoint: `${domainName}/${stage}`,
    });

    const postToConnection = async function ({ id = "" }) {
      try {
        // console.log("before", id, messageData);
        // Send the message to the given client
        await apiG
          .postToConnection({
            ConnectionId: id,
            Data: JSON.stringify(messageData),
          })
          .promise();

        // console.log("after", id, messageData);
      } catch (e: any) {
        if (e?.statusCode === 410) {
          // Remove stale connections
          await dynamoDb.delete({ TableName, Key: { id } }).promise();
        } else {
          console.error(e);
        }
      }
    };

    // Iterate through all the connections
    await Promise.all(
      (connections?.Items || []).map((item) => {
        return postToConnection({ id: item.id });
      })
    ).catch((e) => {
      console.error(e);
    });
  }

  return { statusCode: 200, body: "Message sent" };
};
