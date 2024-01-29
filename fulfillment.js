'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const reqr = require('sync-request');

process.env.DEBUG = 'dialogflow:debug'; 

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    const googleBooksApiKey = 'γοογλε βοοκσ απι κευ';
    const googleBooksApiUrl = 'https://www.googleapis.com/books/v1/volumes';

    function GetRandomWords(frases){
        if (frases){
            return frases[Math.floor(Math.random() * frases.length)];
        }
    }

    function recommendBooks(agent) {
        const genre = agent.parameters.genre;

        if (genre) {
            const genreQuery = genre.toLowerCase().replace(' ', '+');
            const apiUrl = `${googleBooksApiUrl}?q=subject:${genreQuery}&key=${googleBooksApiKey}`;

            try {
                const res = reqr('GET', apiUrl, {
                    json: {},
                });

                const resJson = JSON.parse(res.getBody('utf8'));

                if (resJson.items && resJson.items.length > 0) {
                    const max = 10;
                    const books = resJson.items.slice(0, max);
                    const text = GetRandomWords(['Here are ', 'You might like these ', 'Check out these ', 'I recommend the following ']);

                    let output = text + max + ' books in the ' + genre + ' genre:\n';

                    for (const book of books) {
                        const title = book.volumeInfo.title;
                        const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown Author';
                        const description = book.volumeInfo.description ? book.volumeInfo.description : 'No description available';

                        output += `- Title: ${title}\n`;
                        output += `  Author(s): ${authors}\n`;
                        output += `  Description: ${description}\n\n`;
                    }

                    agent.add(output);
                } else {
                    agent.add(`I couldn't find any books in the ${genre} genre. Would you like to try another genre?`);
                }
            } catch (err) {
                console.error(err.message);
                agent.add('Sorry, something went wrong while fetching book recommendations.');
            }
        } else {
            agent.add('Please specify a genre to get book recommendations.');
        }
    }

    let intentMap = new Map();
    intentMap.set('Recommend books', recommendBooks);
    agent.handleRequest(intentMap);
});
