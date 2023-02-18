import express from "express"
import bodyParser from 'body-parser';
import axios from 'axios'
import {v4 as uuidv4} from 'uuid';

const FACADE_PORT = 4000;
const LOGGING_PORT = 4001;
const MESSAGES_PORT = 4002;
const HOST_NAME = "localhost";

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get("/facade-service", async (request, response) => {
    let allMessages = "";
    let messages = "";

    try {
        allMessages = (await axios.get(`http://${HOST_NAME}:${LOGGING_PORT}/logging-service`)).data
    } catch (e) {
        return response.status(500).send('[FACADE]: Error getting all messages: ', e)
    }

    try {
        messages = (await axios.get(`http://${HOST_NAME}:${MESSAGES_PORT}/messages-service`)).data
    } catch (e) {
        return response.status(500).send('[FACADE]: Error getting message: ', e)
    }

    response.send(`${allMessages} : ${messages}`)
});

app.post("/facade-service", async (request, response) => {
    const content = request.body;

    if (!content.message) {
        console.error('[FACADE]: Message not provided')

        return response.status(400).send('[FACADE]: Message not provided')
    }

    const messageId = uuidv4();
    const data = {messageId, message: content.message};

    console.info(`[FACADE]: Sending message "${content.message}" with id ${data.messageId} to logging service`)

    try {
        const result = await axios.post(`http://${HOST_NAME}:${LOGGING_PORT}/logging-service`, data)

        response.status(200).send(result.data)
    } catch (err) {
        console.error("[FACADE]: Error sending message to logging service: ", err);
    }
});

app.listen(FACADE_PORT, HOST_NAME, () => {
    console.log(`[FACADE]: Server listening at ${HOST_NAME}:${FACADE_PORT}`)
})
