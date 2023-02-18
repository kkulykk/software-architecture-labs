import express from "express"
import bodyParser from 'body-parser';

const LOGGING_PORT = 4001;
const HOST_NAME = "localhost";

const app = express();
const map = new Map();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get("/logging-service", (request, response) => {

    const allMessages = [...map.values()]

    console.info(`[LOGGING]: Sending all messages – ${allMessages.join()}`)

    response.send(allMessages.join() || "" );
});

app.post("/logging-service", (request, response) => {
    const content = request.body
    const {messageId, message} = content;

    map.set(messageId, message)

    console.info(`[LOGGING]: Successfully saved message with id ${messageId}`)
    console.log(message)

    response.send(`Successfully saved message with id ${messageId}`);
});

app.listen(LOGGING_PORT, HOST_NAME, () => {
    console.log(`[LOGGING]: Server listening at ${HOST_NAME}:${LOGGING_PORT}`)
})
