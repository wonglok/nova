import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
import { Table } from "@serverless-stack/node/table";

const TableName = Table.Connections.tableName || "Connections";
const dynamoDb = new DynamoDB.DocumentClient();

import { APIGatewayProxyHandler } from "aws-lambda";

const postToConnection = async function ({
  apiG = {
    postToConnection: (_: any) => {
      return {
        promise: () => {},
      };
    },
  },
  id = "",
  messageData = {},
}) {
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

export const main: APIGatewayProxyHandler = async (event) => {
  const json = JSON.parse(event?.body || "{}");
  const messageType = json.type;
  const messageRoom = json.room;
  const messageData = json.data;
  const { stage, domainName } = event.requestContext;
  const apiG = new ApiGatewayManagementApi({
    endpoint: `${domainName}/${stage}`,
  });

  if (messageType === "join" && messageRoom) {
    const params = {
      TableName: TableName,
      Item: {
        id: event.requestContext.connectionId,
        room: messageRoom,
      },
    };

    await dynamoDb.put(params).promise();

    // Get all the connections
    const connections = await dynamoDb
      .scan({
        TableName,
        ProjectionExpression: "id, room",
        //
        FilterExpression: "room = :room",
        ExpressionAttributeValues: {
          ":room": messageRoom,
        },
      })
      .promise();

    // Iterate through all the connections
    await Promise.all(
      (connections?.Items || []).map((item) => {
        return postToConnection({
          apiG,
          id: item.id,
          messageData: connections?.Items || [],
        });
      })
    ).catch((e) => {
      console.error(e);
    });
  }

  if (messageType === "toRoom" && !!messageRoom) {
    // Get all the connections
    const connections = await dynamoDb
      .scan({
        TableName,
        ProjectionExpression: "id, room",
        //
        FilterExpression: "room = :room",
        ExpressionAttributeValues: {
          ":room": messageRoom,
        },
      })
      .promise();

    // Iterate through all the connections
    await Promise.all(
      (connections?.Items || []).map((item) => {
        return postToConnection({
          apiG,
          id: item.id,
          messageData: messageData,
        });
      })
    ).catch((e) => {
      console.error(e);
    });
  }

  return { statusCode: 200, body: "Message sent" };
};
