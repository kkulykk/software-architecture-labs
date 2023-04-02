import express from "express"
import bodyParser from 'body-parser';
import {Client} from "hazelcast-client";

import {getMessagesHazelcast, recordMessageHazelcast} from "../services/logging-service.js";

const LOGGING_PORT = process.env.PORT || 4001;
const HOST_NAME = "localhost";

const app = express();
const client = await Client.newHazelcastClient({
    clusterName: "lab-hazelcast"
});
const messagesMap = await client.getMap('messagesMap');

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get("/logging-service", async (request, response) => {
    const allMessages = await getMessagesHazelcast(messagesMap)

    response.send(allMessages);
});

app.post("/logging-service", async (request, response) => {
    const content = request.body
    const messageId = await recordMessageHazelcast(messagesMap, content)

    response.send(`Successfully saved message with id ${messageId}`);
});

app.listen(LOGGING_PORT, HOST_NAME, () => {
    console.log(`[LOGGING]: Server listening at ${HOST_NAME}:${LOGGING_PORT}`)
})
