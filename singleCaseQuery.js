const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const fs = require('fs');

let https;
try {
    https = require('node:https');
} catch (err) {
    console.log('https support is disabled!');
}


function getOptions(i) {

    /*  const f = new FormData();

      f.append('changeLocale', '');
      f.append('completedActionsCurrentPage', '0');
      f.append('upcomingActionsCurrentPage', '0');
      f.append('appReceiptNum', 'IOE9821823535');
      f.append('caseStatusSearchBtn', 'CHECK+STATUS');*/

    return {
        hostname: 'egov.uscis.gov',
        path: `/casestatus/mycasestatus.do?changeLocale=&completedActionsCurrentPage=0&upcomingActionsCurrentPage=0&appReceiptNum=IOE${i}&caseStatusSearchBtn=CHECK+STATUS`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 1000000
        // data: f
    };
}

callback = function (response, i) {
    let str = '';

    //another chunk of data has been received, so append it to `str`
    response.on('data', function (chunk) {
        str += chunk;
    });

    //the whole response has been received, so we just print it out here
    response.on('end', function () {
        const dom = new JSDOM(str);
        if (!str.match(/<h1><\/h1>\s*<p><\/p>/)) {
            fs.appendFileSync('results.txt', `IOE${i}\n`);
            fs.appendFileSync('results.txt', dom.window.document.querySelector("body > div.main-content-sec.pb40 > form:nth-child(6) > div > div.container > div > div > div.col-lg-12.appointment-sec.center > div.rows.text-center")?.innerHTML?.trim()+"\n");
           /* console.log(`IOE${i}`)
            console.log(dom.window.document.querySelector("body > div.main-content-sec.pb40 > form:nth-child(6) > div > div.container > div > div > div.col-lg-12.appointment-sec.center > div.rows.text-center").innerHTML);*/
        }
    });
}

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {

    let longSnooze = false;
    for (let i = 9821830000; i < 9821900000; i++) {
        try {
            if (longSnooze) {
                await snooze(30 * 1000);
                longSnooze = false;
            } else {
                await snooze(200);
            }
            console.log(i);
            let req = https.request(getOptions(i));
            req.end();

            req.on('response', r => callback(r, i));
            req.on('error', (log) => {
                //console.log(log)
                longSnooze = true;
                i--;
            });
            req.on('timeout', () => {
                longSnooze = true;
                i--;
            });

        }
        catch(err) {
            console.log(err);
        }
    }
}


main();