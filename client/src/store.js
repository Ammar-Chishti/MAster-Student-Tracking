import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    loggedInUser: {
      sbu_id: '-1',
      first_name: 'First',
      last_name: 'Last',
      email: 'first.last@email.com',
      password: 'password',
      isGPD: false
    },
    selectedID: 'N/A',
    student: {}
  },

  mutations: {

  },

  actions: {

  }
});

// The store state will contain the most important data that needs to be accessible across all components. Other non-important data will just be stored inside the relevant component.
// For example, StudentHomepage needs to store an editedStudent object, which we can just store there locally and it doesn't need to go here in the main store.
