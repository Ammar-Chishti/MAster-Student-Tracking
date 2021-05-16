import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import VueRouter from 'vue-router';
import store from './store';
import VueCookie from 'vue-cookie';
import APIService from './APIService';

// COMPONENTS
import StudentHomepage from './components/StudentHomepage';
import CourseOfferings from './components/CourseOfferings';
import SuggestCoursePlan from './components/SuggestCoursePlan';
import DegreeProgress from './components/DegreeProgress';
import Courses from './components/Courses';
import Departments from './components/Departments';
import GPDHomepage from './components/GPDHomepage';
import EnrollmentTrends from './components/EnrollmentTrends';
import Import from './components/Import';
import ImportCourse from './components/importSubComponents/ImportCourse';
import ImportOffering from './components/importSubComponents/ImportOffering';
import ImportDegree from './components/importSubComponents/ImportDegree';
import ImportStudent from './components/importSubComponents/ImportStudent';
import ImportGrade from './components/importSubComponents/ImportGrade';

Vue.use(VueRouter);
Vue.use(VueCookie);

Vue.config.productionTip = false;

const router = new VueRouter({
  routes: [
    { path: '/studenthomepage', component: StudentHomepage },
    { path: '/courseofferings', component: CourseOfferings },
    { path: '/suggestcourseplan', component: SuggestCoursePlan },
    { path: '/degreeprogress', component: DegreeProgress },
    { path: '/courses', component: Courses },
    { path: '/departments', component: Departments },
    { path: '/gpdhomepage', component: GPDHomepage },
    { path: '/enrollmenttrends', component: EnrollmentTrends },
    {
      path: '/import',
      component: Import,
      children: [
        {
          path: 'importcourse',
          component: ImportCourse
        },
        {
          path: 'importoffering',
          component: ImportOffering
        },
        {
          path: 'importdegree',
          component: ImportDegree
        },
        {
          path: 'importstudent',
          component: ImportStudent
        },
        {
          path: 'importgrade',
          component: ImportGrade
        }
      ],
      redirect: '/import/importcourse'
    },
    { path: '/' }, // empty component, gets redirected to correct homepage in App.vue
    { path: '/*', redirect: '/' } // redirect everything else to /
  ],
  // use middleware here to initially populate store and redirect to homepage (eg. on hard refresh)
  // also need to implement catchall route /*
  mode: 'history'

});

// global middleware for all routes
router.beforeEach(async (to, from, next) => {
  const authentication = await APIService.authenticate();
  if (authentication.success !== true) {
    window.location.href = '/login.html';
  } else {
    next();
  }
});

(async () => {
  // populate store before Vue app is started
  const authentication = await APIService.authenticate();
  store.state.loggedInUser = await APIService.get('/api/user/' + authentication.sbu_id);
  if (!authentication.isGPD) {
    store.state.student = await APIService.get('/api/student/' + authentication.sbu_id + '?associate=true');
    store.state.selectedID = authentication.sbu_id;
  }

  new Vue({
    router,
    vuetify,
    store,
    render: h => h(App)
  }).$mount('#app');
})();
