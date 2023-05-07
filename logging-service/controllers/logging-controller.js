import express from "express"
import bodyParser from 'body-parser';
import {Client} from "hazelcast-client";

import {getMessagesHazelcast, recordMessageHazelcast} from "../services/logging-service.js";

const LOGGING_PORT = 4001;
const HOST_NAME = "0.0.0.0";

const app = express();
const client = await Client.newHazelcastClient({
    clusterName: "lab-hazelcast",
    network: {
        clusterMembers: [
            'software-architecture-labs-hazelcast-1',
            'software-architecture-labs-hazelcast-2',
            'software-architecture-labs-hazelcast-3'
        ]
    }
});
const messagesMap = await client.getMap('messagesMap');

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get("/logging-service", async (request, response) => {
    const allMessages = await getMessagesHazelcast(messagesMap)

    response.status(200).send(allMessages);
});

app.post("/logging-service", async (request, response) => {
    const content = request.body
    const messageId = await recordMessageHazelcast(messagesMap, content)

    response.status(200).send(`Successfully saved message with id ${messageId}`);
});

app.listen(LOGGING_PORT, HOST_NAME, () => {
    console.log(`[LOGGING]: Server listening at ${HOST_NAME}:${LOGGING_PORT}`)
})
