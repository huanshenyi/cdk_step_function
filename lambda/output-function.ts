import { Handler } from "aws-lambda";

const handler: Handler = async (event, context) => {
    if (!event.user) {
        throw new Error("User not found");
    }
    console.info(event.user);
};

export { handler };