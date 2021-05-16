<template>
  <v-app>
    <v-app-bar app :clipped-left="true" dense src="./assets/sbu_colors.jpg">
      <v-row>
        <!-- <v-col cols="1" align="left">
          <v-icon style="color: white" @click="drawer = !drawer">
            mdi-menu</v-icon
          >
        </v-col> -->
        <v-col cols="12" align="right">
          <span class="title" style="color: white">
            MAST - Master's Student Tracking
          </span>
        </v-col>
        <!-- <v-col cols="1" align="right">
          <v-btn @click="signOut()">
          <span> Sign Out </span>
          <v-icon right>mdi-exit-to-app</v-icon>
        </v-btn>
        </v-col> -->
      </v-row>
    </v-app-bar>

    <v-navigation-drawer
      app
      :mini-variant="!drawer"
      permanent
      class="grey lighten-2"
    >
      <v-layout column fill-height>
        <v-layout column>
          <v-list>
            <v-list-item @click="drawer = !drawer">
              <v-list-item-avatar horizontal height="55">
                <span style="padding-left: 16px"></span>
                <v-icon color="#990000">mdi-account </v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title class="title">
                  Logged in as
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{
                    this.$store.state.loggedInUser.first_name +
                    " " +
                    this.$store.state.loggedInUser.last_name
                  }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list v-show="$store.state.loggedInUser.isGPD">
            <v-list-item
              dense
              nav
              link
              v-for="(item, i) in itemsGPD"
              :key="i"
              :to="item.route"
            >
              <v-list-item-icon>
                <v-icon v-text="item.icon"></v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="item.text"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <!-- <v-list-item></v-list-item> -->
          </v-list>

          <span
            v-show="
              $store.state.loggedInUser.isGPD &&
              this.$store.state.selectedID !== 'N/A'
            "
          >
            <v-divider></v-divider>

            <v-list>
              <v-list-item @click="drawer = !drawer">
                <v-list-item-avatar horizontal height="55">
                  <span style="padding-left: 16px"></span>
                  <v-icon color="#990000"> mdi-account-search </v-icon>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title class="title">
                    Student view
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{
                      this.$store.state.selectedID === "N/A"
                        ? ""
                        : this.$store.state.student.User.first_name +
                          " " +
                          this.$store.state.student.User.last_name
                    }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
          </span>

          <v-list v-show="$store.state.selectedID !== 'N/A'">
            <v-list-item
              dense
              nav
              link
              v-for="(item, i) in itemsStudent"
              :key="i"
              :to="item.route"
            >
              <v-list-item-icon>
                <v-icon v-text="item.icon"></v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="item.text"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <!-- <v-list-item></v-list-item> -->
          </v-list>
          <v-divider></v-divider>

          <v-list>
            <v-list-item @click="drawer = !drawer">
              <v-list-item-avatar horizontal height="55">
                <span style="padding-left: 16px"></span>
                <v-icon color="#990000"> mdi-database </v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title class="title"> Database </v-list-item-title>
                <v-list-item-subtitle> View and search </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>

          <v-list>
            <v-list-item
              dense
              nav
              link
              v-for="(item, i) in itemsDatabase"
              :key="i"
              :to="item.route"
            >
              <v-list-item-icon>
                <v-icon v-text="item.icon"></v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="item.text"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <!-- <v-list-item></v-list-item> -->
          </v-list>
          <v-divider></v-divider>
        </v-layout>

        <v-divider></v-divider>
        <v-list>
          <v-list-item dense nav link @click="signOut">
            <v-list-item-icon>
              <v-icon>mdi-exit-to-app</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Sign Out</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-layout>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapState } from "vuex";
import APIService from "./APIService";

export default {
  data() {
    return {
      drawer: true,
      items: [],
      itemsStudent: [
        {
          icon: "mdi-home",
          text: "Student Homepage",
          route: "/studenthomepage",
        },
        {
          icon: "mdi-format-list-text",
          text: "Degree Progress",
          route: "/degreeprogress",
        },
        {
          icon: "mdi-notebook",
          text: "Suggest Course Plan",
          route: "/suggestcourseplan",
        },
      ],
      itemsGPD: [
        {
          icon: "mdi-home",
          text: "GPD Homepage",
          route: "/gpdhomepage",
          show: true,
        },
        {
          icon: "mdi-upload",
          text: "Import",
          route: "/import",
          show: true,
        },
        {
          icon: "mdi-chart-areaspline",
          text: "Enrollment Trends",
          route: "/enrollmenttrends",
          show: true,
        },
      ],
      itemsDatabase: [
        {
          icon: "mdi-book",
          text: "Courses",
          route: "/courses",
        },
        {
          icon: "mdi-calendar-blank",
          text: "Course Offerings",
          route: "/courseofferings",
        },
        {
          icon: "mdi-layers",
          text: "Departments and Tracks",
          route: "/departments",
        },
      ],
    };
  },
  async created() {
    const authentication = await APIService.authenticate();
    if (authentication.success === false) {
      window.location.href = "/login.html";
    }
    // probably not the right place to put this but it works
    if (this.$route.fullPath === "/") {
      if (this.$store.state.loggedInUser.isGPD) {
        this.$router.push("gpdhomepage");
      } else {
        this.$router.push("studenthomepage");
      }
    }
  },
  name: "App",

  computed: {
    ...mapState([
      // basically transfers these variables over from store.js so that we have direct access to them and don't have to prepend everything with this.$store.state
      "loggedInUser",
      "student",
    ]),
  },

  methods: {
    async signOut() {
      // clear token
      this.$cookie.set("jwt", "");

      // route back to login page
      window.location.href = "/login.html";
    },

    async returnGPDHome() {
      this.$router.push("/gpdhomepage");
    },
  },
};
</script>

<style>
.header {
  color: white;
  padding-left: 11%;
}
.burger {
  padding-bottom: 14px;
}
</style>
