import { Mongo } from 'meteor/mongo';

// Every task document looks like:
// {
//   _id: String,
//   text: String,
//   isChecked: Boolean,
//   category: String,   // 'Work' | 'Personal' | 'Urgent'
//   order: Number,       // controls manual drag-and-drop position (ascending)
//   createdAt: Date,
// }
export const TasksCollection = new Mongo.Collection('tasks');
