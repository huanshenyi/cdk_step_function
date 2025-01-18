import { Handler } from "aws-lambda";

interface User {
  username: string;
  age: number;
}

interface EventInput {
  fail?: boolean;
  users?: User[];
}

interface HandlerResponse {
  fail: boolean;
  users: User[];
}

const handler: Handler<EventInput, HandlerResponse> = async (
  event,
  context
) => {
  console.info("Event:", event);
  console.info("Context:", context);

  const fail = event?.fail ?? false;
  const users = event?.users ?? [];

  return {
    fail,
    users,
  };
};

export { handler };

/*
{"users":[{ "username": "thomas", "age": 50 }]}
*/
