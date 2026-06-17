import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import Sortable from 'sortablejs';

import { TasksCollection } from '../db/TasksCollection';
import './Task.js';
import './App.html';

const HIDE_COMPLETED_STRING = 'hideCompleted';
const CATEGORY_FILTER_STRING = 'categoryFilter';
const SEARCH_TEXT_STRING = 'searchText';
const DARK_MODE_STRING = 'darkMode';
const IS_LOADING_STRING = 'isLoading';

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTasksFilter = (instance) => {
  const filter = {};
  if (instance.state.get(HIDE_COMPLETED_STRING)) {
    filter.isChecked = { $ne: true };
  }
  const categoryFilter = instance.state.get(CATEGORY_FILTER_STRING);
  if (categoryFilter && categoryFilter !== 'all') {
    filter.category = categoryFilter;
  }
  const searchText = instance.state.get(SEARCH_TEXT_STRING);
  if (searchText) {
    filter.text = { $regex: escapeRegExp(searchText), $options: 'i' };
  }
  return filter;
};

Template.mainContainer.onCreated(function mainContainerOnCreated() {
  this.state = new ReactiveDict();
  this.state.set(CATEGORY_FILTER_STRING, 'all');
  this.state.set(SEARCH_TEXT_STRING, '');
  this.state.set(
    DARK_MODE_STRING,
    typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true'
  );

  const handle = Meteor.subscribe('tasks');
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handle.ready());
  });
});

Template.mainContainer.onRendered(function mainContainerOnRendered() {
  const instance = this;
  instance.autorun(() => {
    const isLoading = instance.state.get(IS_LOADING_STRING);
    if (isLoading) return;

    Tracker.afterFlush(() => {
      const listEl = instance.find('.tasks');
      if (!listEl || listEl.sortableInstance) return;

      listEl.sortableInstance = Sortable.create(listEl, {
        handle: '.drag-handle',
        animation: 150,
        onEnd() {
          const orderedIds = Array.from(listEl.children)
            .map((li) => li.dataset && li.dataset.id)
            .filter(Boolean);
          Meteor.call('tasks.reorder', orderedIds, (error) => {
            if (error) console.error(error.reason || error.message);
          });
        },
      });
    });
  });
});

Template.mainContainer.helpers({
  tasks() {
    const instance = Template.instance();
    return TasksCollection.find(getTasksFilter(instance), { sort: { order: 1 } });
  },
  hideCompleted() {
    return Template.instance().state.get(HIDE_COMPLETED_STRING);
  },
  isLoading() {
    return Template.instance().state.get(IS_LOADING_STRING);
  },
  incompleteCount() {
    const incompleteTasksCount = TasksCollection.find({ isChecked: { $ne: true } }).count();
    return incompleteTasksCount ? `(${incompleteTasksCount})` : '';
  },
  darkModeClass() {
    return Template.instance().state.get(DARK_MODE_STRING) ? 'dark' : '';
  },
  darkModeIcon() {
    return Template.instance().state.get(DARK_MODE_STRING) ? '☀️' : '🌙';
  },
});

Template.mainContainer.events({
  'click #hide-completed-button'(event, instance) {
    const current = instance.state.get(HIDE_COMPLETED_STRING);
    instance.state.set(HIDE_COMPLETED_STRING, !current);
  },
  'change .category-filter'(event, instance) {
    instance.state.set(CATEGORY_FILTER_STRING, event.target.value);
  },
  'input .search-input'(event, instance) {
    instance.state.set(SEARCH_TEXT_STRING, event.target.value);
  },
  'click #dark-mode-toggle'(event, instance) {
    const next = !instance.state.get(DARK_MODE_STRING);
    instance.state.set(DARK_MODE_STRING, next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('darkMode', next);
    }
  },
});

Template.form.events({
  'submit .task-form'(event) {
    event.preventDefault();
    const target = event.target;
    const text = target.text.value;
    const category = target.category.value;
    const dueDate = target.dueDate.value || null;
    if (!text.trim()) return;

    Meteor.call('tasks.insert', text, category, dueDate, (error) => {
      if (error) console.error(error.reason || error.message);
    });

    target.text.value = '';
    target.dueDate.value = '';
  },
});