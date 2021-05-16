<template>
  <v-row>
    <v-col cols="auto">
      <v-card class="elevation-1" width="380">
        <v-card-title> Import Courses </v-card-title>
        <v-card-subtitle>
          Upload a .txt file containing course information
        </v-card-subtitle>
        <v-divider></v-divider>
        <v-card-actions>
          <v-file-input
            v-model="file"
            truncate-length="40"
            hide-details
            dense
            outlined
            :disabled="disabled"
            :clearable="true"
            show-size
            accept=".txt"
            placeholder="Click here to browse files"
            :validate-on-blur="true"
          >
            <template v-slot:selection="{ text }">
              <v-chip small label color="primary">
                {{ text }}
              </v-chip>
            </template>
          </v-file-input>
        </v-card-actions>
        <v-form ref="form" onSubmit="return false;">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="departments"
                  label="Departments (leave empty for all)"
                  placeholder="AMS, CSE, BMI, ESE, etc."
                  :disabled="disabled"
                  :clearable="true"
                  :validate-on-blur="true"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-autocomplete
                  :items="semesters"
                  v-model="semester"
                  :rules="[rules.required]"
                  label="Semester"
                  :disabled="disabled"
                  :clearable="true"
                  :validate-on-blur="true"
                ></v-autocomplete>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="year"
                  :disabled="disabled"
                  :rules="[rules.required, rules.isYear]"
                  label="Year"
                  :validate-on-blur="true"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-form>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            :disabled="file === null || disabled"
            @click="submit"
            >Submit</v-btn
          >
        </v-card-actions>
        <v-progress-linear
          bottom
          :active="loading"
          :indeterminate="loading"
        ></v-progress-linear>
      </v-card>
    </v-col>

    <v-col>
      <v-card>
        {{ this.response }}
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../../APIService";
export default {
  data() {
    return {
      file: null,
      disabled: false,
      loading: false,
      response: "",
      semesters: ["Winter", "Spring", "SummerI", "SummerII", "Fall"],
      semester: "",
      year: "",
      departments: "",

      rules: {
        required: (v) => !!v || "Required field",
        isYear: (v) => (v >= 1901 && v <= 2155) || "Enter a vaild year",
      },
    };
  },

  async created() {
    if (!this.$store.state.loggedInUser.isGPD) {
      this.$router.push("studenthomepage");
      return;
    }
  },

  methods: {
    async submit() {
      if (!this.$refs.form.validate()) {
        return;
      }

      if (this.file === null) {
        return;
      }
      this.loading = true;
      this.disabled = true;
      let queryStr =
        "?semester=" +
        this.semester +
        "&year=" +
        this.year +
        "&departments=" +
        this.departments;

      const response = await APIService.upload(
        "/api/import/course" + queryStr,
        this.file
      );
      this.response =
        "Import Course Descriptions: " +
        response.failed +
        " failed out of " +
        response.total;
      this.loading = false;

      this.file = null;
      this.semester = "";
      this.year = "";
      this.disabled = false;
      this.loading = false;
    },
  },
};
</script>
