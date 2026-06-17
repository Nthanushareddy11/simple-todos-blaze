import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '/imports/db/TasksCollection';
import '/imports/api/tasksMethods';
import '/imports/api/tasksPublications';

// A handful of seed tasks across all three categories, so the app shows a
// populated, working list immediately instead of an empty one.
const SEED_TASKS = [
  { text: 'Review investment committee deck', category: 'Work' },
  { text: 'Book dentist appointment', category: 'Personal' },
  { text: 'Submit MergerWare assessment before the deadline', category: 'Urgent' },
  { text: 'Read through the Meteor Methods guide', category: 'Work' },
  { text: 'Call placement coordinator', category: 'Personal' },
];

Meteor.startup(async () => {
  // Meteor 3 removed the synchronous Mongo API on the server (it relied on
  // Fibers, which are gone as of this release), so every collection call
  // here uses the `*Async` variants with `await`. The client-side Blaze
  // code in imports/ui keeps using the classic synchronous-looking API,
  // since Minimongo never depended on Fibers in the first place — that
  // part needed no migration at all.
  const taskCount = await TasksCollection.find().countAsync();

  if (taskCount === 0) {
    await Promise.all(
      SEED_TASKS.map((task, index) =>
        TasksCollection.insertAsync({
          text: task.text,
          category: task.category,
          isChecked: false,
          order: index,
          createdAt: new Date(),
        })
      )
    );
  }
});
