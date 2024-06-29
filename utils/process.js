const { WebhookClient, EmbedBuilder } = require('discord.js');

// Initialize the webhook client
const webhook = new WebhookClient({ url: '' }); // webhook url

const logErrorToWebhook = async (eventType, error) => {
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`Process Event: ${eventType}`)
        .setDescription(`\`\`\`${error.stack || error.message || error}\`\`\``)
        .setTimestamp();

    try {
        await webhook.send({ embeds: [embed] });
        //console.log('Error log sent to webhook.');
    } catch (webhookError) {
        console.error('Error sending log to webhook:', webhookError);
    }
};

module.exports = function () {
    // Ctrl + C
    process.on('SIGINT', () => {
        const message = 'SIGINT: Closing database and exiting...';
        console.log(message);
        logErrorToWebhook('SIGINT', new Error(message));
        process.reallyExit(1);
    });

    // Standard crash
    process.on('uncaughtException', (err) => {
        //console.error(`UNCAUGHT EXCEPTION: ${err.stack}`);
        logErrorToWebhook('Uncaught Exception', err);
    });

    // Killed process
    process.on('SIGTERM', () => {
        const message = 'SIGTERM: Closing database and exiting...';
        console.error(message);
        logErrorToWebhook('SIGTERM', new Error(message));
        process.reallyExit(1);
    });

    // Standard crash
    process.on('unhandledRejection', (err) => {
        //console.error(`UNHANDLED REJECTION: ${err.stack}`);
        logErrorToWebhook('Unhandled Rejection', err);
    });

    // Deprecation warnings
    process.on('warning', (warning) => {
        console.warn(`WARNING: ${warning.name} : ${warning.message}`);
        logErrorToWebhook('Warning', warning);
    });

    // Reference errors
    process.on('uncaughtReferenceError', (err) => {
        console.error(err.stack);
        logErrorToWebhook('Uncaught Reference Error', err);
    });
};
