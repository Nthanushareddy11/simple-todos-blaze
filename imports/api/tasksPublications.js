import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '../db/TasksCollection';

// Returning a cursor here is fine even on Meteor 3's async-only server API —
// `.find()` never actually touches the database by itself, it just describes
// a query. Meteor's publish machinery observes that cursor and streams
// changes to the client; no `await` needed for that part.
Meteor.publish('tasks', function publishTasks() {
  return TasksCollection.find({});
});
