import express from "express"
import bodyParser from 'body-parser';

const MESSAGES_PORT = 4002;
const HOST_NAME = "localhost";

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get("/messages-service", (request, response) => {
    console.info('[MESSAGES]: Not implemented yet')

    response.send(`Not implemented yet`);
});

app.listen(MESSAGES_PORT, HOST_NAME, () => {
    console.log(`[MESSAGES]: Server listening at ${HOST_NAME}:${MESSAGES_PORT}`)
})
