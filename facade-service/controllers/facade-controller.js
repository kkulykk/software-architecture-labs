import express from "express"
import bodyParser from 'body-parser';

import {getAllMessages, recordMessage} from "../services/facade-service.js";

const FACADE_PORT = 4000;
const LOGGING_PORT = 4001
const MESSAGES_PORT = 4002;
const HOST_NAME = "0.0.0.0";

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get("/facade-service", async (request, response) => {

    const randomLoggingService = `software-architecture-labs-logging-service-${Math.floor(Math.random() * 3) + 1}`;
    const randomMessagesService = `software-architecture-labs-messages-service-${Math.floor(Math.random() * 2) + 1}`;
    const res = await getAllMessages(randomLoggingService, LOGGING_PORT, randomMessagesService, MESSAGES_PORT)
    const {err, data} = res;

    if (err) return response.status(err.status).send(err.error)

    response.status(200).send(data.messages)
});

app.post("/facade-service", async (request, response) => {
    const content = request.body;
    const randomLoggingService = `software-architecture-labs-logging-service-${Math.floor(Math.random() * 3) + 1}`;
    const result = await recordMessage(randomLoggingService, LOGGING_PORT, content)
    const {err, data} = result;

    if (err) return response.status(err.status).send(err.error)

    response.status(200).send(data.messages)
});

app.listen(FACADE_PORT, HOST_NAME, () => {
    console.log(`[FACADE]: Server listening at ${HOST_NAME}:${FACADE_PORT}`)
})
