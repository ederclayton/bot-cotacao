const moment = require('moment');
const puppeteer = require('puppeteer');
const RoomCardTemplate = require('../resource/RoomCardTemplate.json');
const _ = require('lodash');

const reservationUrl = 'https://myreservations.omnibees.com/default.aspx?q=5462';

const createRoomCard = (roomJson) => {
    let roomCard = _.cloneDeep(RoomCardTemplate);
    roomCard.body[0].url = roomJson.image;
    roomCard.body[1].text = roomJson.name;
    roomCard.body[2].text = roomJson.price;
    roomCard.body[3].inlines[0].text = roomJson.description;

    return roomCard;
};

const crawlerBotRun = (checkin, checkout) => {
    const promise = new Promise( async (resolve, reject) => {
        const browser = await puppeteer.launch({ headless: true});
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 926 });

        // Mount the URL with the search dates.
        let urlWithDates = reservationUrl + 
                            '&CheckIn=' + moment(checkin).format('DDMMYYYY') +
                            '&CheckOut=' + moment(checkout).format('DDMMYYYY');

        try {
            await page.goto(urlWithDates);
        } catch (error) {
            reject(new Error('Could not connect to the host.'));
        }

        let roomsData = await page.evaluate(() => {
            let rooms = [];
            let roomsCard = document.querySelectorAll('div.roomExcerpt');

            roomsCard.forEach((roomElement) => {
                let roomJson = {};
                try {
                    roomJson.name = roomElement.querySelector('h5 > a').innerText;
                    roomJson.price = roomElement.querySelector('h6.bestPriceTextColor').innerText;
                    roomJson.description = roomElement.querySelector('div.excerpt > p > a').innerText;
                    roomJson.image = roomElement.querySelector('img').src;
                } catch (exception) {
                    reject(new Error('Some problem happened in data recovery.'));
                }

                // If the room does not have a price, does not enter the final array.
                if (roomJson.hasOwnProperty('price') && roomJson.price !== '') {
                    rooms.push(roomJson);
                }
            });
            return rooms;
        });

        await browser.close();

        if (roomsData.length === 0) {
            reject(new Error('It could not be found compatible rooms with the dates.'));
        } else {
            resolve(roomsData.map(createRoomCard));
        }
    });
    return promise;
};

exports.crawlerBotRun = crawlerBotRun;