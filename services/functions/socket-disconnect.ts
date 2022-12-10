import { ApiGatewayManagementApi, DynamoDB } from "aws-sdk";
import { Table } from "@serverless-stack/node/table";
import { APIGatewayProxyHandler } from "aws-lambda";

const TableName = Table.Connections.tableName || "Connections";
const dynamoDb = new DynamoDB.DocumentClient();

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
  const params = {
    TableName: Table.Connections.tableName,
    Key: {
      id: event.requestContext.connectionId,
    },
  };

  let thisConnection = await dynamoDb
    .get(params)
    .promise()
    .then((e) => e.Item || {});

  console.log(thisConnection);
  let messageRoom = thisConnection?.room;

  const { stage, domainName } = event.requestContext;

  const apiG = new ApiGatewayManagementApi({
    endpoint: `${domainName}/${stage}`,
  });

  await dynamoDb.delete(params).promise();

  if (messageRoom) {
    // Get all the connections
    const connections = await dynamoDb
      .scan({
        TableName: Table.Connections.tableName,
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
          messageData: {
            type: "clients",
            data: connections?.Items || [],
          },
        });
      })
    ).catch((e) => {
      console.error(e);
    });
  }

  return { statusCode: 200, body: "Disconnected" };
};
