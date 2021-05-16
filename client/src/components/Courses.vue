<template>
  <v-row dense>
    <v-col>
      <v-card class="elevation-5">
        <v-card-title>
          Courses
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
          :items="courses"
          :search="search"
          :loading="loading"
          item-key="course_id"
          dense
          must-sort
          :items-per-page="20"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [20, 50, 100],
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
        { text: "Course Title / Description", value: "title" },
        { text: "Credits", value: "credits_str" },
        { text: "Semester", value: "semester" },
        { text: "Year", value: "year" },
      ],
      courses: [],
    };
  },

  async created() {
    // this component isn't strictly required from assignment specs
    let allCourses = await APIService.get("/api/course");
    for (let c of allCourses) {
      if (c.creditRangeMin === c.creditRangeMax) {
        c.credits_str = c.creditRangeMin;
      } else {
        c.credits_str = c.creditRangeMin + " - " + c.creditRangeMax;
      }
    }
    this.courses = allCourses;
    this.loading = false;
  },
};
</script>
