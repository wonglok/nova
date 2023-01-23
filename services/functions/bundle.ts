export const handler = async (event) => {
  //

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      time: `${event.requestContext.time}`,
      services: {
        //
      },
    }),
  };
};
