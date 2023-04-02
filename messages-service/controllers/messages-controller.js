import express from "express"
import bodyParser from 'body-parser';

import {getMessages} from "../services/messages-service.js";

const MESSAGES_PORT = 4002;
const HOST_NAME = "localhost";

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get("/messages-service", (request, response) => {

    const result = getMessages();

    response.send(result);
});

app.listen(MESSAGES_PORT, HOST_NAME, () => {
    console.log(`[MESSAGES]: Server listening at ${HOST_NAME}:${MESSAGES_PORT}`)
})
