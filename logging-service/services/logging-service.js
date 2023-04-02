/**
 * Record a message to Hazelcast
 * @param messagesMap
 * @param content
 * @returns {Promise<*>}
 */
export const recordMessageHazelcast = async (messagesMap, content) => {
    const {messageId, message} = content;

    await messagesMap.put(messageId, message);

    console.info(`[LOGGING]: Successfully saved message with id ${messageId}`)
    console.log(message)

    return messageId
}

/**
 * Retrieve messages from Hazelcast
 * @param messagesMap
 * @returns {Promise<string>}
 */
export const getMessagesHazelcast = async (messagesMap) => {
    let allMessages = ''

    for(const [_, value] of await messagesMap.entrySet()){
        allMessages += `${value}, `
    }

    allMessages = allMessages.substring(0, allMessages.length - 2)

    console.info(`[LOGGING]: Sending all messages – ${allMessages}`)

    return allMessages
}