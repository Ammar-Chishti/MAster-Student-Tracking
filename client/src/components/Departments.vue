<template>
  <v-row dense>
    <v-col>
      <v-card class="elevation-5">
        <v-card-title>
          Departments and Tracks
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
          :items="degrees"
          :search="search"
          :loading="loading"
          item-key="degree_requirement_id"
          dense
          must-sort
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [5, 10, 15, 20],
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
        { text: "Track", value: "track" },
        { text: "Semester", value: "semester" },
        { text: "Year", value: "year" },
      ],
      degrees: [],
    };
  },

  async created() {
    // this component isn't strictly required from assignment specs
    let allDegrees = await APIService.get(
      "/api/degreerequirement?associate=true"
    );
    this.degrees = allDegrees;
    this.loading = false;
  },
};
</script>
