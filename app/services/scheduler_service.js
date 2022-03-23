const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require('toad-scheduler')
const SpoonacularService = require('../services/spoonacular_service.js');
const TwitterService = require('../services/twitter_service.js');

const scheduler = new ToadScheduler()

const twitterQueryTask = new AsyncTask(
  'twitter query task',
  () => {
    return TwitterService.findRecipeRequests()
    .then(response => response.body)
    .then(res => res.on('readable', () => {
      let chunk;
      while (null !== (chunk = res.read())) {
        console.log(JSON.parse(chunk.toString()));
        if (JSON.parse(chunk.toString()).data) {
          console.log(JSON.parse(chunk.toString()).data[0].text);
        }

      }
    }))
    .catch(function(err) {
      console.log('fetch failed: ', err);
    });
  })

// const twitterStreamTask = new AsyncTask(
//   'twitter stream task',
//   () => {
//     return TwitterService.initializeTweetStream()
//     // .then(response => {
//     //   console.log(response)
//     // })
//     // .catch(function(err) {
//     //   console.log('stream failed: ', err);
//     // });
//   })

const twitterQueryJob = new SimpleIntervalJob({ seconds: 10, }, twitterQueryTask)

// const twitterStreamJob = new SimpleIntervalJob({ seconds: 5, }, twitterStreamTask)

// when stopping your app
// scheduler.stop()

exports.launchScheduledTasks = () => {
  // scheduler.addSimpleIntervalJob(twitterQueryJob)
  // scheduler.addSimpleIntervalJob(twitterStreamJob)
}

TwitterService.initializeTweetStream()
