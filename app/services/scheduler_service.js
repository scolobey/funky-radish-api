const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require('toad-scheduler')

const scheduler = new ToadScheduler()

const task = new AsyncTask(
  console.log("polling")
  // 'simple task',
  // () => { return db.pollForSomeData().then((result) => { /* continue the promise chain */ }) },
  // (err: Error) => { /* handle error here */ }
)

const job = new SimpleIntervalJob({ minutes: 1, }, task)

// when stopping your app
// scheduler.stop()

exports.launchScheduledTasks = () => {
  scheduler.addSimpleIntervalJob(job)
}
