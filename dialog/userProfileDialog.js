const {ComponentDialog,ConfirmPrompt,DialogSet,DialogTurnStatus,TextPrompt,WaterfallDialog} = require('botbuilder-dialogs');
const JobCard = require('./resources.json');
const{ CardFactory } = require('botbuilder');
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
class UserProfileDialog extends ComponentDialog {
    constructor(userState) {
        super('userProfileDialog');
        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.fetchdetailsStep.bind(this),
            this.contiStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }
    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, 'Please enter the name you want to search.');
    }
    async fetchdetailsStep(step){   
        try {
            var os = require('os');
            var testname= step.result;
            if(testname==="Hi"||testname==="hi"||testname==="Hello"||testname==="hello"||testname==="HI"||testname==="HELLO")
            {
                await step.context.sendActivity("Hello @User");
                await step.endDialog();
                return await step.beginDialog(this.id);    
            }
            else if(testname==="Bye"||testname==="bye"||testname==="Stop"||testname==="stop"||testname==="BYE"||testname==="STOP")
            {
                await step.context.sendActivity("Bye @User");
                return await step.endDialog();  
            }
            var len = testname.indexOf(" ");
            var fname=testname.substring(0,len);
            var lname=testname.substring(len+1,testname.lenght);
            if(fname===""||lname===""){
                await step.context.sendActivity("Please enter full name to search");
                await step.endDialog();
                return await step.beginDialog(this.id); 
            }
            var furl= "http://10.22.20.28:8001/find/givenname=" + fname + "?sn="+lname;
            var url= furl.trim();
            let response = await fetch(url);
            let data = JSON.parse(JSON.stringify(await response.json()));
            if(JSON.stringify(data)==='[]'){
                await step.context.sendActivity("Please check the name you have entered.");
                await step.endDialog();
                return await step.beginDialog(this.id);    
            }
            else{
                let cards = [];
                await data.forEach((data,i)=>{      
                    let cardJson = JSON.parse(JSON.stringify(JobCard));
                    cardJson.body['0'].facts['0'].value = data.givenName+" "+data.sn;
                    cardJson.body['0'].facts['1'].value = data.department;
                    cardJson.body['0'].facts['2'].value = data.title;
                    cardJson.body['0'].facts['3'].value = data.mail;
                    cardJson.body['0'].facts['4'].value = data.mobile;
                    cardJson.body['0'].facts['5'].value = data.telephoneNumber;
                    let adaptativeCard = CardFactory.adaptiveCard(cardJson);
                    cards.push(adaptativeCard);
                });
                await step.context.sendActivity({attachments: cards});
                return await step.prompt(CONFIRM_PROMPT, 'Do you want to search another name?', ['yes', 'no']);
            } 
        } 
        catch (error) {
            console.log(error)
            await step.context.sendActivity("Some problem with the network. Please try again later");    
            return await step.endDialog();
        }
    }
    async contiStep(step)
    {
        if(step.result){
            await step.endDialog();
            return await step.beginDialog(this.id);
        }
        else{   
            await step.context.sendActivity("Thank you!!");
            return await step.endDialog();
        }
    }
}
module.exports.UserProfileDialog = UserProfileDialog;
