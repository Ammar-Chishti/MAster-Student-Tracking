<template>
  <v-row dense>
    <v-col>
      <v-card class="elevation-5">
        <v-card-title>
          Course Offerings
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search any field"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="offerings"
          :search="search"
          :loading="loading"
          item-key="course_offering_id"
          dense
          must-sort
          :items-per-page="20"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [20,50,100],
          }"
        ></v-data-table>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../APIService";
export default {
  data() {
    return {
      search: "",
      loading: true,
      headers: [
        { text: "Department", value: "department" },
        { text: "Course Num", value: "course_num" },
        // { text: "Course Title", value: "title" },
        { text: "Section", value: "section" },
        { text: "Timeslot", value: "timeslot" },
        { text: "Semester", value: "semester" },
        { text: "Year", value: "year" },
      ],
      offerings: [],
    };
  },

  async created() {
    // this component isn't strictly required from assignment specs
    let allOfferings = await APIService.get("/api/courseoffering?associate=true");
    allOfferings.sort(function (a, b) {
      try {
        if (a.department < b.department) {
          return -1;
        } else if (a.course_num < b.course_num) {
          return -1;
        } else {
          return a.section - b.section;
        }
      } catch (err) {
        return -1;
      }
    });
    this.offerings = allOfferings;
    this.loading = false;
  },
};
</script>
