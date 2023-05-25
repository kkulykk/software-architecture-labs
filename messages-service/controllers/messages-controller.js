import express from "express"
import bodyParser from 'body-parser';
import {Consul} from "consul/lib/consul.js";
import {Kafka} from "kafkajs";

import {getMessages} from "../services/messages-service.js";

const MESSAGES_PORT = 4002;
const SERVICE_NAME = 'messages-service';
const HOST_NAME = "0.0.0.0";
const instances = ["software-architecture-labs-messages-service-1", "software-architecture-labs-messages-service-2"]

const consul = new Consul({host: 'software-architecture-labs-consul-1', port: 8500});

for (const service of instances) {
    const registration = {
        id: service,
        name: SERVICE_NAME,
        "Address": service,
        port: MESSAGES_PORT,
        tags: ['microservice']
    };

    try {
        await consul.agent.service.register(registration);
        console.log(`Registered service ${service} in Consul`);
    } catch (error) {
        console.error(`Failed to register service ${service} in Consul: ${error}`);
    }
}

const [clientId, brokers, groupId, topic] = await Promise.all([consul.kv.get("kafka/client_id"),
    consul.kv.get("kafka/brokers"), consul.kv.get("kafka/group_id"), consul.kv.get("kafka/topic")])
const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const kafka = new Kafka({
    clientId: clientId.Value,
    brokers: [brokers.Value]
})

const messages = []

const consumer = kafka.consumer({groupId: groupId.Value})
await consumer.connect()
await consumer.subscribe({topic: topic.Value, fromBeginning: true})

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
