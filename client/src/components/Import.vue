<template>
  <v-row dense>
    <v-col cols="auto">
      <v-card class="elevation-5" height="600" :width="drawer ? 55 : ''">
        <v-layout column fill-height>
          <v-layout column>
            <v-list>
              <v-list-item @click="drawer = !drawer">
                <v-list-item-avatar horizontal height="55">
                  <span style="padding-left: 16px"></span>
                  <v-icon color="#990000"> mdi-upload </v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title class="title"> Import </v-list-item-title>
                  <v-list-item-subtitle>
                    Upload files to database
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>

            <v-list>
              <v-list-item
                dense
                nav
                link
                v-for="(item, i) in importNavDrawer"
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
            </v-list>
            <v-divider></v-divider>
          </v-layout>
        </v-layout>
      </v-card>
    </v-col>

    <v-col>
      <v-card class="elevation-5" height="600">
        <v-container fluid>
          <router-view></router-view>
        </v-container>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  data() {
    return {
      uploadType: "none",
      fileToUpload: {},
      drawer: false,
      importNavDrawer: [
        {
          icon: "mdi-book-plus",
          text: "Import Courses",
          route: "/import/importcourse",
        },
        {
          icon: "mdi-calendar-plus",
          text: "Import Course Offerings",
          route: "/import/importoffering",
        },
        {
          icon: "mdi-layers-plus",
          text: "Import Degree Requirements",
          route: "/import/importdegree",
        },
        {
          icon: "mdi-account-multiple-plus",
          text: "Import Student Data",
          route: "/import/importstudent",
        },
        {
          icon: "mdi-notebook-plus",
          text: "Import Grades",
          route: "/import/importgrade",
        },
      ],
    };
  },

  async created() {
    if (!this.$store.state.loggedInUser.isGPD) {
      this.$router.push("studenthomepage");
      return;
    }
  },

  methods: {},
};
</script>
