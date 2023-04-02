import axios from "axios";
import {v4 as uuidv4} from "uuid";

/**
 * Get all messages from the logging or message services
 * @param hostName
 * @param loggingPort
 * @param messagesPort
 * @param response
 * @returns {Promise<*|string>}
 */
export const getAllMessages = async (hostName, loggingPort, messagesPort, response) => {
    let allMessages = "";
    let messages = "";

    try {
        allMessages = (await axios.get(`http://${hostName}:${loggingPort}/logging-service`)).data
    } catch (e) {
        return response.status(500).send('[FACADE]: Error getting all messages: ', e)
    }

    try {
        messages = (await axios.get(`http://${hostName}:${messagesPort}/messages-service`)).data
    } catch (e) {
        return response.status(500).send('[FACADE]: Error getting message: ', e)
    }

    return `${allMessages} : ${messages}`
}

export const recordMessage = async (hostName, loggingPort, content, response) => {
    if (!content.message) {
        console.error('[FACADE]: Message not provided')

        return response.status(400).send('[FACADE]: Message not provided')
    }

    const messageId = uuidv4();
    const data = {messageId, message: content.message};

    console.info(`[FACADE]: Sending message "${content.message}" with id ${data.messageId} to logging service`)

    try {
        const result = await axios.post(`http://${hostName}:${loggingPort}/logging-service`, data)

        return result.data
    } catch (err) {
        console.error("[FACADE]: Error sending message to logging service: ", err);
    }

}