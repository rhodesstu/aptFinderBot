
require('dotenv/config')
const rp = require("request-promise");
const checksum = require("checksum");
const co = require("cheerio");

// Instantiate Twilio - you'll need to get your own credentials for this one!
const client = require('twilio')(AC58c1da44a69baf46efc7068bcff75783, 1928ef4121e156cd5f8a0154ce44e4f7);

// instantiate an empty variable outside the function so we can save its value
let hash = "";

const url = `https://www.kijiji.ca/b-appartement-condo-4-1-2/grand-montreal/plateau/k0c214l80002?price=__1400`;

function checkURL(siteToCheck) {
  return rp(siteToCheck)
    .then(HTMLresponse => {
      const $ = co.load(HTMLresponse);
      let apartmentString = "";

      // use cheerio to parse HTML response and find all search results
      // then find all apartmentlistingIDs and concatenate them
      $(".search-item.regular-ad").each((i, element) => {
        apartmentString += `${element.attribs["data-ad-id"]}`;
      });

      if (hash === '') {
        console.log('Making initial fetch...')
        hash = checksum(apartmentString);
      }

      // When the hashes are not equal, there is a change in ad ID's
      if (checksum(apartmentString) !== hash) {
        hash = checksum(apartmentString)
        return true;
      }

      console.log('No change to report!')
      return false;
    })
    .catch(err => {
      console.log(`Could not complete fetch of ${url}: ${err}`);
    });
}

function SMS({
  body,
  to,
  from
}) {
  client.messages
    .create({
      body,
      to,
      from
    })
    .then(() => {
      console.log(`👍 Success! Message has been sent to ${to}`);
    })
    .catch(err => {
      console.log(err);
    });
}

// check every 10 seconds
// doing this asynchonously so our fetch  is sure to resolve
setInterval(async () => {
  // if checkURL returns true, send a message!

  if (await checkURL(url)) {
    console.log('Found a change! Sending SMS...')
    // These are obviously fake phone numbers, replace the `to` with whatever number you want to message
    // and the from with the number from your Twilio account!
    SMS({
      body: `There is a new add at ${url}!`,
      to: "+",
      from: "+"
    });
  }
}, 10000);
