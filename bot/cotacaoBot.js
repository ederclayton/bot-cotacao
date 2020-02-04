const { ActivityHandler, CardFactory, AttachmentLayoutTypes } = require('botbuilder');
const { crawlerBotRun } = require('./crawlerBot');

const InputDatesCard = require('../resource/InputDatesCard.json');

class CotacaoBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {

            if (context.activity.text && 
                this.isCotacaoOption(context.activity.text)) {

                await context.sendActivity('Nós sempre garantimos a melhor tarifa!\
                    Vou solicitar algumas informações para buscar o melhor para você:');

                await context.sendActivity({
                    attachments: [CardFactory.adaptiveCard(InputDatesCard)]
                });

            } else if (context.activity.value) { 
                if (context.activity.value.hasOwnProperty('checkin') && 
                    context.activity.value.checkin !== '' &&
                    context.activity.value.hasOwnProperty('checkout') &&
                    context.activity.value.checkout !== '') {
                    
                    await this.requestCotacao(context);

                } else {
                    await context.sendActivity('Para realizarmos a cotação, \
                        deve ser informado a data de entrada e saída.');
                }
            } else {
                await context.sendActivity('Desculpe, não posso lhe ajudar.');
            }

            await next();
        });

        this.isCotacaoOption = (message) => {
            switch (message.toLowerCase()) {
                case 'cotação de tarifas':
                case 'cotação':
                case 'tarifas':
                case 'cotacao':
                case 'cotacao de tarifas':
                    return true;
                default:
                    return false;
            }
        };

        this.requestCotacao = async (context) => {
            const checkin = new Date(context.activity.value.checkin);
            const checkout = new Date(context.activity.value.checkout);

            if (checkin >= checkout) {
                await context.sendActivity('Por favor, informe datas válidas.');
            } else {
                try {
                    let roomsCardJson = await crawlerBotRun(checkin, checkout);

                    await context.sendActivity({
                        attachments: roomsCardJson.map((e) => CardFactory.adaptiveCard(e)),
                        attachmentLayout: AttachmentLayoutTypes.Carousel
                    });
                } catch (error) {
                    if (error.message === 'Could not connect to the host.') {
                        await context.sendActivity('Não foi possível extrair as informações.');
                    } else {
                        await context.sendActivity('Não há quartos disponíveis para as datas informadas.');
                    }
                }
            }
        };
    };
};

module.exports.CotacaoBot = CotacaoBot;