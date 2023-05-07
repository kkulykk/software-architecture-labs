import axios from "axios";
import {v4 as uuidv4} from "uuid";
import {Kafka} from "kafkajs";

const kafka = new Kafka({
    clientId: 'micro_mq',
    brokers: ['kafka-server:9092']
})
const producer = kafka.producer()

/**
 * Get all messages from the logging or message services
 * @param hostName
 * @param loggingPort
 * @param messagesPort
 * @returns {Promise<*|string>}
 */
export const getAllMessages = async (loggingService, loggingPort, messagesService, messagesPort) => {
    let allMessages = "";
    let messages = "";
    const result = {err: null, data: {}}

    try {
        allMessages = (await axios.get(`http://${loggingService}:${loggingPort}/logging-service`)).data
    } catch (e) {
        result.err = {status: 500, error: '[FACADE]: Error getting all messages: ' + e.toString()}

        return result
    }

    try {
        messages = (await axios.get(`http://${messagesService}:${messagesPort}/messages-service`)).data
    } catch (e) {
        result.err = {status: 500, error: '[FACADE]: Error getting message: ' + e.toString()}

        return result
    }

    result.data = {messages: `${allMessages} : ${messages}`}

    return result
}

/**
 * Record message via certain service
 * @param hostName
 * @param loggingPort
 * @param content
 * @returns {Promise<*>}
 */
export const recordMessage = async (hostName, loggingPort, content) => {
    const result = {err: null, data: {}}

    if (!content.message) {
        console.error('[FACADE]: Message not provided')

        result.err = {status: 400, error: '[FACADE]: Message not provided'}

        return result
    }

    const messageId = uuidv4();
    const data = {messageId, message: content.message};

    await producer.connect()
    await producer.send({
        topic: 'messages',
        messages: [
            {
                key: messageId,
                value: content.message,
            }
        ],
    })
    await producer.disconnect()

    console.info(`[FACADE]: Message "${content.message}" with id ${data.messageId} added to queue`)

    try {
        const res = await axios.post(`http://${hostName}:${loggingPort}/logging-service`, data)

        result.data = {messages: res.data}
    } catch (err) {
        console.error("[FACADE]: Error sending message to logging service: ", err);

        result.err = {status: 500, error: '[FACADE]: Error sending message to logging service: ' + err.toString()}

        return result
    }

    console.info(`[FACADE]: Sent message "${content.message}" with id ${data.messageId} to logging service`)

    return result
}