import express from "express"
import bodyParser from 'body-parser';
import {Consul} from "consul/lib/consul.js";
import {Client} from "hazelcast-client";

import {getMessagesHazelcast, recordMessageHazelcast} from "../services/logging-service.js";

const LOGGING_PORT = 4001;
const SERVICE_NAME = 'logging-service';
const HOST_NAME = "0.0.0.0";
const instances = ["software-architecture-labs-logging-service-1", "software-architecture-labs-logging-service-2", "software-architecture-labs-logging-service-3"]

const consul = new Consul({host: 'software-architecture-labs-consul-1', port: 8500,});

for (const service of instances) {
    const registration = {
        id: service,
        name: SERVICE_NAME,
        "Address": service,
        port: LOGGING_PORT,
        tags: ['microservice']
    };

    try {
        await consul.agent.service.register(registration);
        console.log(`Registered service ${service} in Consul`);
    } catch (error) {
        console.error(`Failed to register service ${service} in Consul: ${error}`);
    }
}

const [clusterName, clusterMembers, mapName] = await Promise.all([consul.kv.get("hazelcast/cluster_name"), consul.kv.get("hazelcast/cluster_members"), consul.kv.get("hazelcast/map_name")])

const app = express();
const client = await Client.newHazelcastClient({
    clusterName: clusterName.Value,
    network: {
        clusterMembers: clusterMembers.Value.split(',')
    }
})

const messagesMap = await client.getMap(mapName.Value);

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
