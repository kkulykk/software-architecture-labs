import express from "express"
import bodyParser from 'body-parser';
import {Kafka} from "kafkajs";

import {getMessages} from "../services/messages-service.js";

const MESSAGES_PORT = 4002;
const HOST_NAME = "0.0.0.0";

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const kafka = new Kafka({
    clientId: 'micro_mq2',
    brokers: ['kafka-server:9092']
})

const messages = []

const consumer = kafka.consumer({ groupId: 'test-group' })

await consumer.connect()
await consumer.subscribe({topic: 'messages', fromBeginning: true})

await consumer.run({
    eachMessage: async ({topic, partition, message}) => {
        messages.push(message.value.toString())

        console.info(`[MESSAGES]: Message "${message.value}" saved to server`)
    },
})

app.get("/messages-service", (request, response) => {

    const result = getMessages(messages);

    response.status(200).send(result);
});

app.listen(MESSAGES_PORT, HOST_NAME, () => {
    console.log(`[MESSAGES]: Server listening at ${HOST_NAME}:${MESSAGES_PORT}`)
})
