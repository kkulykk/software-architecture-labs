import express from "express"
import bodyParser from 'body-parser';

import {getAllMessages, recordMessage} from "../services/facade-service.js";

const FACADE_PORT = 4000;
const LOGGING_PORTS = [4001, 4003, 4004];
const MESSAGES_PORT = 4002;
const HOST_NAME = "localhost";

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get("/facade-service", async (request, response) => {

    const randomValue = Math.floor(Math.random() * LOGGING_PORTS.length);
    const randomLoggingPort = LOGGING_PORTS[randomValue];
    const messages = await getAllMessages(HOST_NAME, randomLoggingPort, MESSAGES_PORT, response)

    response.send(messages)
});

app.post("/facade-service", async (request, response) => {
    const content = request.body;
    const randomValue = Math.floor(Math.random() * LOGGING_PORTS.length);
    const randomLoggingPort = LOGGING_PORTS[randomValue];
    const result = await recordMessage(HOST_NAME, randomLoggingPort, content, response)

    response.status(200).send(result.data)
});

app.listen(FACADE_PORT, HOST_NAME, () => {
    console.log(`[FACADE]: Server listening at ${HOST_NAME}:${FACADE_PORT}`)
})
