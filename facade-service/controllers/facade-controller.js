import express from "express"
import bodyParser from 'body-parser';
import {Consul} from "consul/lib/consul.js";

import {getAllMessages, recordMessage} from "../services/facade-service.js";

const FACADE_PORT = 4000;
const SERVICE_NAME = 'facade-service';
const HOST_NAME = "0.0.0.0";

const consul = new Consul({host: 'software-architecture-labs-consul-1', port: 8500});
const instances = ["software-architecture-labs-facade-service-1"];

for (const service of instances) {
    const registration = {
        id: service,
        name: SERVICE_NAME,
        "Address": service,
        port: FACADE_PORT,
        tags: ['microservice']
    };

    try {
        await consul.agent.service.register(registration);
        console.log(`Registered service ${service} in Consul`);
    } catch (error) {
        console.error(`Failed to register service ${service} in Consul: ${error}`);
    }
}

async function getServiceAddress(serviceName) {
    try {
        const services = await consul.catalog.service.nodes(serviceName);
        if (services.length > 0) {
            const service = services[Math.floor(Math.random() * services.length)];

            return {address: service.ServiceAddress, port: service.ServicePort};
        }

        console.error(`No instances found for service ${serviceName}`);
    } catch (error) {
        console.error(`Failed to fetch address for service ${serviceName} from Consul: ${error}`);
        throw error;
    }
}

const app = express();

app.use(express.static("client"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get("/facade-service", async (request, response) => {
    const randomLoggingService = await getServiceAddress('logging-service');
    const randomMessagesService = await getServiceAddress('messages-service');
    const res = await getAllMessages(randomLoggingService.address, randomLoggingService.port, randomMessagesService.address, randomMessagesService.port)
    const {err, data} = res;

    if (err) return response.status(err.status).send(err.error)

    response.status(200).send(data.messages)
});

app.post("/facade-service", async (request, response) => {
    const content = request.body;
    const randomLoggingService = await getServiceAddress('logging-service');
    const result = await recordMessage(randomLoggingService.address, randomLoggingService.port, content)
    const {err, data} = result;

    if (err) return response.status(err.status).send(err.error)

    response.status(200).send(data.messages)
});

app.listen(FACADE_PORT, HOST_NAME, () => {
    console.log(`[FACADE]: Server listening at ${HOST_NAME}:${FACADE_PORT}`)
})
