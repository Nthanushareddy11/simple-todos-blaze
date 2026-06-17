import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import './Task.html';

Template.task.onCreated(function taskOnCreated() {
  this.state = new ReactiveDict();
  this.state.set('editing', false);
});

Template.task.helpers({
  isCategory(category) {
    return this.category === category;
  },
  checkedClass() {
    return this.isChecked ? 'task-checked' : '';
  },
  isEditing() {
    return Template.instance().state.get('editing');
  },
  dueDateValue() {
    if (!this.dueDate) return '';
    return new Date(this.dueDate).toISOString().slice(0, 10);
  },
  overdueClass() {
    if (!this.dueDate || this.isChecked) return '';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return new Date(this.dueDate) < startOfToday ? 'overdue' : '';
  },
});

function saveTextEdit(event, instance) {
  const newText = event.target.value.trim();
  instance.state.set('editing', false);

  if (newText && newText !== instance.data.text) {
    Meteor.call('tasks.setText', instance.data._id, newText, (error) => {
      if (error) console.error(error.reason || error.message);
    });
  }
}

Template.task.events({
  'click .toggle-checked'() {
    Meteor.call('tasks.setIsChecked', this._id, !this.isChecked, (error) => {
      if (error) console.error(error.reason || error.message);
    });
  },
  'click .delete'() {
    Meteor.call('tasks.remove', this._id, (error) => {
      if (error) console.error(error.reason || error.message);
    });
  },
  'change .task-category-select'(event) {
    Meteor.call('tasks.setCategory', this._id, event.target.value, (error) => {
      if (error) console.error(error.reason || error.message);
    });
  },
  'change .task-due-date'(event) {
    Meteor.call('tasks.setDueDate', this._id, event.target.value || null, (error) => {
      if (error) console.error(error.reason || error.message);
    });
  },
  'click .task-text'(event, instance) {
    instance.state.set('editing', true);
    Tracker.afterFlush(() => {
      const input = instance.find('.task-text-edit');
      if (input) {
        input.focus();
        input.select();
      }
    });
  },
  'blur .task-text-edit'(event, instance) {
    saveTextEdit(event, instance);
  },
  'keydown .task-text-edit'(event, instance) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveTextEdit(event, instance);
    } else if (event.key === 'Escape') {
      instance.state.set('editing', false);
    }
  },
});